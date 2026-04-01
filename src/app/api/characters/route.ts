import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const fileMap: Record<string, string> = {
  leader: 'leader', mother: 'mother', father: 'father', savta: 'savta', saba: 'saba',
  child_young: 'child-youngest', child_wise: 'child-wise', child_wicked: 'child-wicked',
  child_simple: 'child-simple', uncle: 'uncle', aunt: 'aunt', guest: 'guest'
};

export async function GET(req: NextRequest) {
  const charId = req.nextUrl.searchParams.get('id');
  const type = req.nextUrl.searchParams.get('type') || 'md'; // 'md' or 'meta' or 'all'

  if (type === 'all') {
    const fpath = join(process.cwd(), 'public', 'characters.json');
    if (existsSync(fpath)) {
      return NextResponse.json(JSON.parse(readFileSync(fpath, 'utf-8')));
    }
    return NextResponse.json([]);
  }

  if (!charId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  if (type === 'meta') {
    const fpath = join(process.cwd(), 'public', 'characters.json');
    const chars = JSON.parse(readFileSync(fpath, 'utf-8'));
    const char = chars.find((c: any) => c.id === charId);
    return NextResponse.json(char || { error: 'Not found' }, { status: char ? 200 : 404 });
  }

  const fname = fileMap[charId] || charId;
  const fpath = join(process.cwd(), 'public', 'characters', `${fname}.md`);

  if (existsSync(fpath)) {
    const content = readFileSync(fpath, 'utf-8');
    return new NextResponse(content, { headers: { 'Content-Type': 'text/markdown' } });
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(req: NextRequest) {
  try {
    const { id, content, meta, type } = await req.json();
    
    if (type === 'meta' && meta) {
      const fpath = join(process.cwd(), 'public', 'characters.json');
      const chars = JSON.parse(readFileSync(fpath, 'utf-8'));
      const idx = chars.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        chars[idx] = { ...chars[idx], ...meta };
        writeFileSync(fpath, JSON.stringify(chars, null, 2), 'utf-8');
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    if (!id || content === undefined) return NextResponse.json({ error: 'Missing id or content' }, { status: 400 });

    const fname = fileMap[id] || id;
    const fpath = join(process.cwd(), 'public', 'characters', `${fname}.md`);

    writeFileSync(fpath, content, 'utf-8');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
