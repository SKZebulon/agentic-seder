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
  if (!charId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

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
    const { id, content } = await req.json();
    if (!id || content === undefined) return NextResponse.json({ error: 'Missing id or content' }, { status: 400 });

    const fname = fileMap[id] || id;
    const fpath = join(process.cwd(), 'public', 'characters', `${fname}.md`);

    writeFileSync(fpath, content, 'utf-8');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
