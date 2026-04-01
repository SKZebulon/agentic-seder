import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    console.log('ElevenLabs: no API key configured');
    return NextResponse.json({ ok: false, configured: false });
  }

  try {
    const body = await req.json();
    const { text, voiceId, stability, similarity_boost, style } = body;
    
    if (!text || !voiceId) {
      return NextResponse.json({ ok: false, error: 'Missing text or voiceId' }, { status: 400 });
    }

    console.log(`ElevenLabs: speaking "${text.slice(0,50)}..." with voice ${voiceId}`);

    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': key,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_flash_v2_5',
        voice_settings: {
          stability: stability ?? 0.5,
          similarity_boost: similarity_boost ?? 0.75,
          style: style ?? 0.4,
          use_speaker_boost: true,
        }
      })
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => 'unknown');
      console.error(`ElevenLabs API error ${resp.status}: ${errText.slice(0,200)}`);
      return NextResponse.json({ ok: false, error: `ElevenLabs ${resp.status}: ${errText.slice(0,100)}` }, { status: 502 });
    }

    const audioBuffer = await resp.arrayBuffer();
    console.log(`ElevenLabs: got ${audioBuffer.byteLength} bytes of audio`);
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.byteLength),
        'Cache-Control': 'no-cache',
      }
    });
  } catch (e: any) {
    console.error('ElevenLabs route error:', e?.message || e);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
