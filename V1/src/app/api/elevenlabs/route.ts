import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return NextResponse.json({ ok: false, configured: false }, { status: 200 });

  try {
    const { text, voiceId, stability, similarity_boost, style } = await req.json();
    if (!text || !voiceId) return NextResponse.json({ ok: false, error: 'Missing text or voiceId' });

    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': key,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: stability || 0.5,
          similarity_boost: similarity_boost || 0.75,
          style: style || 0.4,
          use_speaker_boost: true,
        }
      })
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('ElevenLabs error:', resp.status, err);
      return NextResponse.json({ ok: false, error: `ElevenLabs ${resp.status}` });
    }

    // Stream the audio bytes back
    const audioBuffer = await resp.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      }
    });
  } catch (e) {
    console.error('ElevenLabs route error:', e);
    return NextResponse.json({ ok: false, error: 'Server error' });
  }
}
