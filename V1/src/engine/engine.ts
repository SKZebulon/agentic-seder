// Unified engine: Audio + Agentic Dialogue
// Audio: ElevenLabs via /api/elevenlabs server proxy, falls back to Web Speech
// Dialogue: Claude via /api/dialogue server proxy reading .md personality files

const VOICE_MAP: Record<string, { voiceId: string; stability: number; style: number }> = {
  leader:      { voiceId: 'TxGEqnHWrfWFTfGW9XjX', stability: 0.7, style: 0.3 },
  mother:      { voiceId: '21m00Tcm4TlvDq8ikWAM', stability: 0.6, style: 0.4 },
  father:      { voiceId: 'ErXwobaYiN019PkySvjV', stability: 0.65, style: 0.3 },
  savta:       { voiceId: 'MF3mGyEYCl7XYWbV9V6O', stability: 0.5, style: 0.6 },
  saba:        { voiceId: 'VR6AewLTigWG4xSOukaG', stability: 0.7, style: 0.2 },
  child_young: { voiceId: 'EXAVITQu4vr4xnSDxMaL', stability: 0.4, style: 0.7 },
  child_wise:  { voiceId: 'AZnzlk1XvdvUeBnXmlld', stability: 0.65, style: 0.3 },
  child_wicked:{ voiceId: 'pNInz6obpgDQGcFmaJgB', stability: 0.5, style: 0.6 },
  child_simple:{ voiceId: 'EXAVITQu4vr4xnSDxMaL', stability: 0.4, style: 0.7 },
  uncle:       { voiceId: 'TxGEqnHWrfWFTfGW9XjX', stability: 0.4, style: 0.8 },
  aunt:        { voiceId: '21m00Tcm4TlvDq8ikWAM', stability: 0.6, style: 0.3 },
  guest:       { voiceId: 'ErXwobaYiN019PkySvjV', stability: 0.65, style: 0.3 },
};

const PITCH_MAP: Record<string, number> = {
  leader:0.7, mother:1.05, father:0.85, savta:0.9, saba:0.65,
  child_young:1.7, child_wise:1.25, child_wicked:1.15, child_simple:1.6,
  uncle:0.9, aunt:1.15, guest:1.0
};

export class Engine {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  private hasEL = false;
  private hasAI = false;
  public audioEnabled = true;

  async init(): Promise<{ hasEL: boolean; hasAI: boolean }> {
    if (typeof window !== 'undefined') this.synth = window.speechSynthesis;
    // Check server config
    try {
      const r = await fetch('/api/config');
      const cfg = await r.json();
      this.hasEL = !!cfg.elevenlabs;
      this.hasAI = !!cfg.anthropic;
    } catch { }
    return { hasEL: this.hasEL, hasAI: this.hasAI };
  }

  // ── AUDIO ──
  async speak(text: string, charId: string): Promise<void> {
    if (!this.audioEnabled || !text?.trim() || text === '...zzz...') return;
    const id = charId === 'all' ? 'leader' : charId;

    // Try ElevenLabs proxy
    if (this.hasEL) {
      try {
        const v = VOICE_MAP[id] || VOICE_MAP.leader;
        const r = await fetch('/api/elevenlabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceId: v.voiceId, stability: v.stability, similarity_boost: 0.75, style: v.style })
        });
        if (r.ok && r.headers.get('content-type')?.includes('audio')) {
          if (!this.audioCtx) this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
          const buf = await this.audioCtx.decodeAudioData(await r.arrayBuffer());
          return new Promise(res => {
            const src = this.audioCtx!.createBufferSource();
            src.buffer = buf; src.connect(this.audioCtx!.destination);
            const to = setTimeout(res, buf.duration * 1000 + 1500);
            src.onended = () => { clearTimeout(to); res(); };
            src.start();
          });
        }
      } catch (e) { console.warn('EL proxy fail:', e); }
    }

    // Fallback: Web Speech
    if (!this.synth) return;
    return new Promise(res => {
      this.synth!.cancel();
      setTimeout(() => {
        const u = new SpeechSynthesisUtterance(text);
        u.pitch = PITCH_MAP[id] || 1; u.rate = 0.9;
        const to = setTimeout(res, text.length * 80 + 3000);
        u.onend = () => { clearTimeout(to); res(); };
        u.onerror = () => { clearTimeout(to); res(); };
        this.synth!.speak(u);
      }, 50);
    });
  }

  stop() { this.synth?.cancel(); }

  // ── AGENTIC DIALOGUE ──
  async generateReactions(context: string, characters: string[], phase: string, max: number): Promise<Array<{speaker:string;en:string;he:string}>> {
    // Pick random subset
    const selected = [...characters].sort(() => Math.random() - 0.5).slice(0, max);

    if (this.hasAI) {
      try {
        const r = await fetch('/api/dialogue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context, characters: selected, phase, maxReactions: max })
        });
        const data = await r.json();
        if (data.ok && data.reactions?.length) return data.reactions;
      } catch (e) { console.warn('AI dialogue fail:', e); }
    }

    // Fallback — context-aware varied lines
    return selected.map(id => this.fallback(id, context));
  }

  private usedLines = new Map<string, Set<number>>();

  private fallback(id: string, ctx: string): {speaker:string;en:string;he:string} {
    const c = ctx.toLowerCase();
    const pools: Record<string, Record<string, string[]>> = {
      child_young: { eat:["This charoset is SO good!","Can I have more?","My tummy is happy!"], sing:["DAY-DAY-ENU!","Can we sing it again?","This is my FAVORITE!"], afikoman:["I FOUND IT!","What's my prize??","iPad! ...fine, ice cream."], _:["How much longer?","I'm SO hungry!","What's happening now?","Can I sit on Saba's lap?","I need to go to the bathroom.","Is it almost time to eat?"] },
      child_wicked: { eat:["Finally, actual food.","Savta, this is... actually good. Don't tell anyone.","The horseradish is trying to kill me."], sing:["I'm not singing. ...OK fine.","Uncle Moshe is making my ears bleed.","Why is this song 12 minutes long?"], _:["Are we still on Maggid?","I could be on TikTok.","This is... fine.","How is it only 9:30?","I have thoughts but I'll keep them to myself.","Can I have my phone back?","*audible sigh*"] },
      child_simple: { _:["Why?","But WHY though?","What does that mean?","Can I see?","What's that?","Can I touch it?","Wow!","Is it magic?"] },
      child_wise: { _:["The Rambam has an interesting take...","In the original Aramaic...","My teacher says this connects to...","Actually, the Tosafot disagree...","There's a deeper reading here...","Fascinating parallel to last week's parsha."] },
      savta: { eat:["It's good. My mother's was better.","You barely ate! Are you sick?","I brought my own horseradish."], sing:["That's not the right melody!","Your grandfather had the most beautiful voice..."], nishtana:["She's an ANGEL! I need a tissue!","My heart!"], _:["In my day...","Nobody appreciates this.","Eat! You're too thin!","Your grandfather used to say...","We are so blessed.","My parents survived so we could be here."] },
      saba: { _:["What?","I wasn't sleeping!","Eh?","That was fast.","In my day the Seder lasted until MIDNIGHT.","Needs salt.","Reminds me of the army...","Who said that?","I've eaten worse."] },
      uncle: { sing:["*FULL VOLUME*","COME ON! I CAN'T HEAR YOU!","That's the wrong tune!","FROM THE TOP!","LOUDER!"], _:["L'CHAIM!","This is the BEST part!","Who wants more? I'm pouring.","SING ALONG!","Pass the EVERYTHING!"] },
      guest: { eat:["What is this? It's delicious!","The horseradish almost killed me."], sing:["I don't know the words but I'm clapping!","This song is a BANGER.","Day-ay-new?"], _:["That's so interesting!","I have so many questions.","Should I be doing something?","Is this the part where we eat?","I'm getting goosebumps.","Thank you for inviting me."] },
      mother: { nishtana:["*tears streaming* My baby.","She practiced for THREE WEEKS."], afikoman:["No iPad. ABSOLUTELY not.","Fine. Ice cream. ONE scoop."], _:["Phones away. That means you, Daniel.","Shhh!","Does everyone have a Haggadah?","Sit DOWN.","Beautiful.","It came out good this year. I think."] },
      father: { afikoman:["I spent THREE DAYS planning this hiding spot.","Deal. Final offer."], _:["This is my favorite part!","Interesting fact...","Can I share a thought?","You know what's interesting about this...","This matzah is from the fancy box."] },
      aunt: { _:["I'm still learning the customs.","Moshe, let someone else talk!","That's beautiful.","Can I help clear?","In my family we do it differently.","Shira, this is delicious!"] },
      leader: { nishtana:["Noa'le, magnificent.","Nu? Did everyone hear?"], _:["Nu?","Let us continue.","Pay attention, this is crucial.","A beautiful question.","We are here. Against all odds."] },
    };
    const p = pools[id] || pools.guest;
    let cat = '_';
    for (const k of Object.keys(p)) { if (k !== '_' && c.includes(k)) { cat = k; break; } }
    const lines = p[cat] || p._ || ['...'];
    const key = `${id}:${cat}`;
    if (!this.usedLines.has(key)) this.usedLines.set(key, new Set());
    const used = this.usedLines.get(key)!;
    let avail = lines.map((_,i)=>i).filter(i=>!used.has(i));
    if (!avail.length) { used.clear(); avail = lines.map((_,i)=>i); }
    const idx = avail[Math.floor(Math.random()*avail.length)];
    used.add(idx);
    return { speaker: id, en: lines[idx], he: '' };
  }
}
