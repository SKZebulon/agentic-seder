import { NextRequest, NextResponse } from 'next/server';

/** Prefer widely available models first; Flash may be unavailable on some plans. */
const MODEL_FALLBACKS = [
  'eleven_turbo_v2_5',
  'eleven_multilingual_v2',
  'eleven_flash_v2_5',
] as const;

function apiKey() {
  return process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
}

/** Optional: one voice ID from *your* ElevenLabs account (Voices → ⋮ → Copy ID). Replaces premade library IDs. */
function defaultVoiceIdFromEnv() {
  return (process.env.ELEVENLABS_DEFAULT_VOICE_ID || '').trim();
}

/** JSON body for failures — use 200 so the client is not a gateway error; engine only plays audio when Content-Type is audio/*. */
function failJson(message: string, detail?: string) {
  return NextResponse.json(
    { ok: false, error: message, detail: detail?.slice(0, 800) },
    { status: 200, headers: { 'Cache-Control': 'no-store' } }
  );
}

/** Parse ElevenLabs error JSON for early exit (don't retry every model). */
function parseElError(body: string): { code?: string; type?: string } {
  try {
    const j = JSON.parse(body) as { detail?: { code?: string; type?: string } | string };
    const d = j.detail;
    if (d && typeof d === 'object') {
      return { code: d.code, type: d.type };
    }
  } catch {
    /* ignore */
  }
  return {};
}

export async function POST(req: NextRequest) {
  const key = apiKey();
  if (!key) {
    console.warn('ElevenLabs: no ELEVENLABS_API_KEY (or ELEVEN_LABS_API_KEY) in env');
    return failJson('not_configured');
  }

  let body: {
    text?: string;
    voiceId?: string;
    stability?: number;
    similarity_boost?: number;
    style?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { text, voiceId: requestedVoiceId, stability, similarity_boost, style } = body;

  if (!text?.trim() || !requestedVoiceId) {
    return NextResponse.json({ ok: false, error: 'Missing text or voiceId' }, { status: 400 });
  }

  const override = defaultVoiceIdFromEnv();
  const voiceId = override || requestedVoiceId;
  if (override) {
    console.log('ElevenLabs: using ELEVENLABS_DEFAULT_VOICE_ID for all lines');
  }

  const voice_settings = {
    stability: stability ?? 0.5,
    similarity_boost: similarity_boost ?? 0.75,
    style: style ?? 0.4,
    use_speaker_boost: true,
  };

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  let lastStatus = 0;
  let lastBody = '';

  for (const model_id of MODEL_FALLBACKS) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': key,
        },
        body: JSON.stringify({
          text,
          model_id,
          voice_settings,
        }),
      });

      if (resp.ok) {
        const audioBuffer = await resp.arrayBuffer();
        console.log(`ElevenLabs: ok model=${model_id} bytes=${audioBuffer.byteLength}`);
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': String(audioBuffer.byteLength),
            'Cache-Control': 'no-cache',
            'X-ElevenLabs-Model': model_id,
          },
        });
      }

      lastStatus = resp.status;
      lastBody = await resp.text().catch(() => '');
      console.warn(
        `ElevenLabs model ${model_id} failed ${resp.status}: ${lastBody.slice(0, 300)}`
      );

      const err = parseElError(lastBody);
      if (err.code === 'paid_plan_required' || err.type === 'payment_required') {
        return failJson(
          'paid_plan_required',
          lastBody +
            (override
              ? ''
              : ' — Tip: create or pick a voice under *My Voices* in ElevenLabs, copy its Voice ID, and set ELEVENLABS_DEFAULT_VOICE_ID in Vercel. Or regenerate your API key after upgrading so it is tied to the paid workspace.')
        );
      }

      if (resp.status === 401 || resp.status === 403) {
        return failJson('unauthorized', lastBody);
      }
      if (resp.status === 429) {
        return failJson('rate_limited', lastBody);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`ElevenLabs fetch error (${model_id}):`, msg);
      lastBody = msg;
    }
  }

  console.error(`ElevenLabs: all models failed lastStatus=${lastStatus}`);
  return failJson('upstream_error', lastBody || `HTTP ${lastStatus}`);
}
