import { NextResponse } from 'next/server';

export async function GET() {
  const elKey = process.env.ELEVENLABS_API_KEY;
  const aiKey = process.env.ANTHROPIC_API_KEY;

  const result: any = {
    elevenlabs: { configured: !!elKey, keyPrefix: elKey ? elKey.slice(0, 6) + '...' : null },
    anthropic: { configured: !!aiKey, keyPrefix: aiKey ? aiKey.slice(0, 8) + '...' : null },
  };

  // Test ElevenLabs if configured
  if (elKey) {
    try {
      const r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/TxGEqnHWrfWFTfGW9XjX', {
        method: 'POST',
        headers: { 'Accept': 'audio/mpeg', 'Content-Type': 'application/json', 'xi-api-key': elKey },
        body: JSON.stringify({ text: 'Test.', model_id: 'eleven_flash_v2_5', voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
      });
      result.elevenlabs.testStatus = r.status;
      result.elevenlabs.testContentType = r.headers.get('content-type');
      if (r.ok) {
        const buf = await r.arrayBuffer();
        result.elevenlabs.testAudioBytes = buf.byteLength;
        result.elevenlabs.working = buf.byteLength > 100;
      } else {
        result.elevenlabs.testError = await r.text().then(t => t.slice(0, 200)).catch(() => 'unknown');
        result.elevenlabs.working = false;
      }
    } catch (e: any) {
      result.elevenlabs.testError = e?.message || 'fetch failed';
      result.elevenlabs.working = false;
    }
  }

  return NextResponse.json(result);
}
