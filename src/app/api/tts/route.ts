import { NextRequest, NextResponse } from 'next/server';

/** Google Cloud Text-to-Speech (Neural2 / WaveNet). Set GOOGLE_TTS_API_KEY in Vercel. */
export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_TTS_API_KEY not configured' }, { status: 503 });
  }

  let body: { text?: string; languageCode?: string; voiceName?: string; speakingRate?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text || text.length > 4500) {
    return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
  }

  const languageCode = body.languageCode || 'en-US';
  const voiceName =
    body.voiceName ||
    (languageCode.startsWith('he') ? 'he-IL-Wavenet-A' : 'en-US-Neural2-J');

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode, name: voiceName },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: typeof body.speakingRate === 'number' ? body.speakingRate : 0.92,
          pitch: 0,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('Google TTS error', res.status, err.slice(0, 400));
    return NextResponse.json({ error: 'TTS upstream failed' }, { status: 502 });
  }

  const data = (await res.json()) as { audioContent?: string };
  if (!data.audioContent) {
    return NextResponse.json({ error: 'No audio' }, { status: 502 });
  }

  return NextResponse.json({ audioContent: data.audioContent, mime: 'audio/mpeg' });
}
