import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SYSTEM_PROMPT = `You generate dialogue for characters at a Passover Seder. This is a REAL Jewish Seder — the primary purpose is conducting the complete Passover service, not comedy.

STRICT RULES:
1. THIS IS A JEWISH SEDER. Never mention "church," "mass," "pastor," or any non-Jewish religious terms. The setting is a Jewish home.
2. THE SEDER IS THE STAR. Characters are engaged participants, not hecklers. Their personality comes through in HOW they participate — the wise child asks deep follow-up questions, the grandmother gets emotional at meaningful moments, the teen rolls his eyes but still participates.
3. Characters should mostly be GOOD family members who listen, follow along, and engage with the Seder. Personality adds color but doesn't derail.
4. Keep reactions SHORT (1-2 sentences). Real people at a Seder say brief things between readings.
5. Characters can make practical comments about the Seder activities: "Pass the salt water," "Does everyone have enough wine?", "Hold up the seder plate," "Who has the Haggadah open to the right page?"
6. Characters can ask genuine questions about the Exodus story, the meaning of the rituals, or Jewish history. These are WELCOME at a Seder.
7. If the character is the rebellious teen, they can be mildly sarcastic but they still participate. They might say something cynical, but they're still sitting at the table and they still care underneath.
8. The grandmother might compare things to her childhood, get emotional, or worry about people eating enough — but she's following the Seder.
9. The non-Jewish guest asks genuine questions and is increasingly moved.
10. Children can be restless at appropriate moments (during long readings) but engaged during exciting parts (plagues, songs, Afikoman).
11. When generating Hebrew ("he" field), use natural conversational Hebrew, not liturgical. Liturgy is handled separately.

SEDER KNOWLEDGE — Characters know these activities:
- Wine is poured BY OTHERS (you don't pour your own — tonight we are royalty)
- Karpas/parsley is dipped in salt water and passed around
- The seder plate is LIFTED during Ha Lachma Anya
- Matzah is covered and uncovered at various points
- During Rabban Gamliel's section, you POINT to the matzah, maror, and zeroa
- You LEAN LEFT when drinking wine and eating matzah (sign of freedom)
- Everyone follows along in their Haggadah
- Maror is dipped in charoset
- The Korech sandwich is assembled by each person
- During the meal, there's soup (chicken soup with matzah balls for Ashkenazi, different for Sephardi)
- The Afikoman is the last food eaten — nothing after it
- Elijah's cup is a special large goblet filled with wine, placed in the center
- The door is physically opened for Elijah
- Chad Gadya and Echad Mi Yodea get faster and more competitive each verse

Return ONLY a JSON array: [{"speaker":"character_id","en":"English line","he":"Hebrew or empty"},...]
No markdown, no backticks, no explanation. Just the JSON array.`;

export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ ok: false, configured: false }, { status: 200 });

  try {
    const { context, characters, phase, maxReactions, tradition, speakLang, history } = await req.json();

    const fileMap: Record<string,string> = {
      leader:'leader',mother:'mother',father:'father',savta:'savta',saba:'saba',
      child_young:'child-youngest',child_wise:'child-wise',child_wicked:'child-wicked',
      child_simple:'child-simple',uncle:'uncle',aunt:'aunt',guest:'guest'
    };

    const profiles = (characters || []).map((id: string) => {
      const fname = fileMap[id] || id;
      const fpath = join(process.cwd(), 'public', 'characters', `${fname}.md`);
      if (existsSync(fpath)) return `### Character: ${id}\n${readFileSync(fpath, 'utf-8')}`;
      return null;
    }).filter(Boolean).join('\n\n---\n\n');

    if (!profiles) return NextResponse.json({ ok: true, reactions: [] });

    const traditionNote = tradition === 'sephardi' 
      ? 'This is a SEPHARDI family. They may reference Sephardi customs, foods (like rice, which Sephardim eat on Pesach), melodies, and cultural references.'
      : 'This is an ASHKENAZI family. They may reference Ashkenazi customs, foods (gefilte fish, matzah ball soup), melodies, and cultural references.';

    const langNote = speakLang === 'he' 
      ? 'Generate responses primarily in Hebrew (he field). English (en field) can be empty or a brief translation.'
      : speakLang === 'both'
      ? 'Generate responses in both Hebrew and English.'
      : 'Generate responses primarily in English (en field). Hebrew (he field) can include a Hebrew phrase if natural.';

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
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `## Seder Phase: ${phase}\n## Tradition: ${traditionNote}\n## Language: ${langNote}\n\n## Recent Conversation History\n${(history || []).join('\n')}\n\n## What Just Happened\n${context}\n\n## Character Profiles\n${profiles}\n\nGenerate ${maxReactions || 2} short, in-character reactions. Remember: the Seder is the star. Characters participate meaningfully. They can reference the recent conversation history if relevant.`
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
