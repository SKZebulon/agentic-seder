import { NextResponse } from 'next/server';

function elevenKey() {
  return process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY;
}

export async function GET() {
  const elKey = elevenKey();
  const defaultVoice = (process.env.ELEVENLABS_DEFAULT_VOICE_ID || '').trim();
  return NextResponse.json({
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    elevenlabs: !!elKey,
    /** Server replaces all character voice IDs with this (avoids "library voices" API restrictions when set). */
    elevenlabsCustomVoice: !!defaultVoice,
  });
}
