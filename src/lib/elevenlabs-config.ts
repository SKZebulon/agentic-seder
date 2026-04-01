/** Shared voice IDs for ElevenLabs — used by client (direct key) and /api/elevenlabs (server key). */

export const ELEVEN_VOICE_MAP: Record<string, string> = {
  leader: 'TxGEqnHWrfWFTfGW9XjX',
  mother: '21m00Tcm4TlvDq8ikWAM',
  father: 'ErXwobaYiN019PkySvjV',
  savta: 'MF3mGyEYCl7XYWbV9V6O',
  saba: 'VR6AewLTigWG4xSOukaG',
  child_young: 'EXAVITQu4vr4xnSDxMaL',
  child_wise: 'AZnzlk1XvdvUeBnXmlld',
  child_wicked: 'pNInz6obpgDQGcFmaJgB',
  child_simple: 'EXAVITQu4vr4xnSDxMaL',
  uncle: 'TxGEqnHWrfWFTfGW9XjX',
  aunt: '21m00Tcm4TlvDq8ikWAM',
  guest: 'ErXwobaYiN019PkySvjV',
};

export const ELEVEN_VOICE_SETTINGS: Record<string, { stability: number; similarity_boost: number; style?: number }> = {
  leader: { stability: 0.7, similarity_boost: 0.8, style: 0.3 },
  mother: { stability: 0.6, similarity_boost: 0.75, style: 0.4 },
  father: { stability: 0.65, similarity_boost: 0.75, style: 0.3 },
  savta: { stability: 0.5, similarity_boost: 0.7, style: 0.6 },
  saba: { stability: 0.7, similarity_boost: 0.8, style: 0.2 },
  child_young: { stability: 0.4, similarity_boost: 0.7, style: 0.7 },
  child_wise: { stability: 0.65, similarity_boost: 0.8, style: 0.3 },
  child_wicked: { stability: 0.5, similarity_boost: 0.75, style: 0.6 },
  child_simple: { stability: 0.4, similarity_boost: 0.65, style: 0.7 },
  uncle: { stability: 0.4, similarity_boost: 0.7, style: 0.8 },
  aunt: { stability: 0.6, similarity_boost: 0.75, style: 0.3 },
  guest: { stability: 0.65, similarity_boost: 0.8, style: 0.3 },
};
