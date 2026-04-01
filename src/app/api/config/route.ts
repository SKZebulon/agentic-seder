import { NextResponse } from 'next/server';

function elevenKey() {
  return process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
}

export async function GET() {
  return NextResponse.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    elevenlabs: !!elevenKey(),
  });
}
