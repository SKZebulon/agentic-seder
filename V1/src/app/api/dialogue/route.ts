import { NextRequest, NextResponse } from 'next/server';

const MODEL = 'claude-sonnet-4-20250514';

const SYSTEM = `You generate short, natural dialogue for animated characters at a Passover Seder.
You receive a character's personality profile (markdown) and what just happened.
Generate ONE short reaction — 1-2 sentences max. It should feel like something a real person would say.
It can be funny, touching, sarcastic, confused, or profound — whatever fits the character.
Return ONLY a JSON object: {"en":"English line","he":"Hebrew line or empty string"}
No markdown, no backticks, no explanation. Just the JSON object.
If the character would speak Hebrew, put it in "he". If English, in "en". Can have both.
Keep it SHORT and natural. Real people at dinner don't give speeches.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  /** 200 + ok:false avoids browser “failed resource” console spam; client treats as “use fallback”. */
  if (!apiKey) {
    return NextResponse.json({ ok: false, configured: false, reason: 'ANTHROPIC_API_KEY not set on server' });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { context, profile, charId, phase, mood } = body as Record<string, unknown>;
  if (
    typeof context !== 'string' ||
    typeof profile !== 'string' ||
    typeof charId !== 'string' ||
    typeof phase !== 'string'
  ) {
    return NextResponse.json(
      { error: 'Expected context, profile, charId, phase (strings)' },
      { status: 400 }
    );
  }

  const moodLine =
    typeof mood === 'string'
      ? `\n## Mood for this line\nThe table’s emotional temperature is: **${mood}** (solemn = fewer jokes; playful = wit welcome; balanced = natural).`
      : '';

  if (profile.length > 80_000 || context.length > 20_000) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `## Character\nYou are writing ONE spoken line for character id "${charId}" only. Obey the profile below; do not sound like a generic narrator.${moodLine}\n\n## Seder phase\n${phase}\n\n## What just happened\n${context}\n\n## Profile (follow this voice)\n${profile}\n\nGenerate ONE short, in-character reaction.`,
        },
      ],
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    console.error('Anthropic API error', upstream.status, errText.slice(0, 500));
    return NextResponse.json({ error: 'Claude request failed' }, { status: 502 });
  }

  const data = (await upstream.json()) as {
    content?: Array<{ text?: string }>;
  };
  const text = data.content?.map((c) => c.text || '').join('') || '';

  try {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as { en?: string; he?: string };
    return NextResponse.json({
      ok: true,
      reaction: {
        speaker: charId,
        en: parsed.en || '',
        he: parsed.he || '',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Bad response format from model' }, { status: 502 });
  }
}
