import { NextRequest, NextResponse } from 'next/server';
import { ELEVEN_VOICE_MAP, ELEVEN_VOICE_SETTINGS } from '@/lib/elevenlabs-config';

const KEY = () => process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;

/** Proxy ElevenLabs TTS so the browser never holds the API key (use env on Vercel). */
export async function POST(req: NextRequest) {
  const apiKey = KEY();
  if (!apiKey) {
    return NextResponse.json({ ok: false, configured: false, reason: 'ELEVENLABS_API_KEY not set on server' });
  }

  let body: { text?: string; characterId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const characterId = typeof body.characterId === 'string' ? body.characterId : 'leader';
  if (!text || text.length > 5000) {
    return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
  }

  const voiceId = ELEVEN_VOICE_MAP[characterId] || ELEVEN_VOICE_MAP.leader;
  const settings = ELEVEN_VOICE_SETTINGS[characterId] || ELEVEN_VOICE_SETTINGS.leader;

  const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_flash_v2_5',
      voice_settings: {
        stability: settings.stability,
        similarity_boost: settings.similarity_boost,
        style: settings.style ?? 0.3,
        use_speaker_boost: true,
      },
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    console.error('ElevenLabs API error', upstream.status, err.slice(0, 400));
    return NextResponse.json({ error: 'ElevenLabs request failed' }, { status: 502 });
  }

  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  });
}
