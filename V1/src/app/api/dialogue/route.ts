import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ ok: false, configured: false }, { status: 200 });

  try {
    const { context, characters, phase, maxReactions } = await req.json();

    // Load character personality markdown files from public/characters/
    const fileMap: Record<string,string> = {
      leader:'leader',mother:'mother',father:'father',savta:'savta',saba:'saba',
      child_young:'child-youngest',child_wise:'child-wise',child_wicked:'child-wicked',
      child_simple:'child-simple',uncle:'uncle',aunt:'aunt',guest:'guest'
    };

    const profiles = (characters || []).map((id: string) => {
      const fname = fileMap[id] || id;
      const fpath = join(process.cwd(), 'public', 'characters', `${fname}.md`);
      if (existsSync(fpath)) {
        return `### Character: ${id}\n${readFileSync(fpath, 'utf-8')}`;
      }
      return null;
    }).filter(Boolean).join('\n\n---\n\n');

    if (!profiles) return NextResponse.json({ ok: true, reactions: [] });

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You generate short, natural dialogue for animated characters at a Passover Seder.
For EACH character listed, write ONE short reaction (1-2 sentences max).
Make each reaction feel like something a REAL person would say at family dinner.
Reactions should be varied: funny, touching, sarcastic, confused, profound, mundane.
Each character has a DISTINCT voice based on their personality profile.
NEVER repeat similar reactions. Every line should feel unique to that character.

Return ONLY a JSON array: [{"speaker":"character_id","en":"English line","he":"Hebrew or empty"},...]
No markdown, no backticks, no explanation. Just the JSON array.`,
        messages: [{
          role: 'user',
          content: `## Current Seder Phase\n${phase}\n\n## What Just Happened\n${context}\n\n## Character Profiles\n${profiles}\n\nGenerate ${maxReactions || 2} short, varied, in-character reactions.`
        }]
      })
    });

    if (!resp.ok) {
      console.error('Anthropic API error:', resp.status);
      return NextResponse.json({ ok: false, error: 'API error' });
    }

    const data = await resp.json();
    const text = data.content?.map((c: any) => c.text || '').join('') || '';
    const cleaned = text.replace(/```json|```/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      return NextResponse.json({
        ok: true,
        reactions: arr.filter((r: any) => r.en || r.he).map((r: any) => ({
          speaker: r.speaker, en: r.en || '', he: r.he || ''
        }))
      });
    } catch {
      return NextResponse.json({ ok: true, reactions: [] });
    }
  } catch (e) {
    console.error('Dialogue route error:', e);
    return NextResponse.json({ ok: false, error: 'Server error' });
  }
}
