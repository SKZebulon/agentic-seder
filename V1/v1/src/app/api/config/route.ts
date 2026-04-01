import { NextResponse } from 'next/server';

/** Tells the client which features work via server env (Vercel) — no secrets exposed. */
export async function GET() {
  return NextResponse.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    elevenLabs: !!(process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY),
  });
}
