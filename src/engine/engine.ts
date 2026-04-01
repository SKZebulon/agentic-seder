// Engine: Audio (ElevenLabs via proxy + Web Speech) + Agentic Dialogue (Claude via proxy)
// Supports Hebrew and English speech

const VOICES: Record<string, { voiceId: string; stability: number; style: number }> = {
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

const PITCH: Record<string, number> = {
  leader:0.7, mother:1.05, father:0.85, savta:0.9, saba:0.65,
  child_young:1.7, child_wise:1.25, child_wicked:1.15, child_simple:1.6,
  uncle:0.9, aunt:1.15, guest:1.0
};

export class Engine {
  private synth: SpeechSynthesis | null = null;
  private audioCtx: AudioContext | null = null;
  public hasEL = false;
  public hasAI = false;
  public audioEnabled = true;
  public speakLang: 'en' | 'he' | 'both' = 'en'; // which language to SPEAK aloud

  async init(): Promise<{ hasEL: boolean; hasAI: boolean }> {
    if (typeof window !== 'undefined') this.synth = window.speechSynthesis;
    try {
      const r = await fetch('/api/config');
      const cfg = await r.json();
      this.hasEL = !!cfg.elevenlabs;
      this.hasAI = !!cfg.anthropic;
    } catch {}
    return { hasEL: this.hasEL, hasAI: this.hasAI };
  }

  // Speak text — picks language based on speakLang setting
  // If both he and en provided, speaks based on preference
  async speakLine(en: string, he: string, charId: string): Promise<void> {
    if (!this.audioEnabled) return;
    const id = charId === 'all' ? 'leader' : charId;
    let text = '';
    let lang: 'en' | 'he' = 'en';

    if (this.speakLang === 'he' && he) { text = he; lang = 'he'; }
    else if (this.speakLang === 'both' && he) { text = he; lang = 'he'; } // speak Hebrew first
    else if (en) { text = en; lang = 'en'; }
    else if (he) { text = he; lang = 'he'; }

    if (!text.trim() || text === '...zzz...') return;
    await this.speakRaw(text, id, lang);

    // If "both", also speak English after Hebrew
    if (this.speakLang === 'both' && he && en) {
      await this.speakRaw(en, id, 'en');
    }
  }

  private async speakRaw(text: string, charId: string, lang: 'en' | 'he'): Promise<void> {
    // ElevenLabs (works for both languages — their multilingual model handles Hebrew)
    if (this.hasEL) {
      try {
        const v = VOICES[charId] || VOICES.leader;
        const r = await fetch('/api/elevenlabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voiceId: v.voiceId, stability: v.stability, similarity_boost: 0.75, style: v.style })
        });
        const ct = r.headers.get('content-type') || '';
        if (r.ok && ct.includes('application/json')) {
          try {
            const j = await r.json() as { ok?: boolean; error?: string; detail?: string };
            if (j?.ok === false) {
              console.warn('ElevenLabs:', j.error || 'failed', j.detail ? `— ${j.detail.slice(0, 120)}` : '');
            }
          } catch { /* ignore */ }
        } else if (r.ok && ct.includes('audio')) {
          if (!this.audioCtx) this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
          const ab = await r.arrayBuffer();
          if (ab.byteLength > 100) {
            const buf = await this.audioCtx.decodeAudioData(ab);
            return new Promise(res => {
              const src = this.audioCtx!.createBufferSource();
              src.buffer = buf; src.connect(this.audioCtx!.destination);
              const to = setTimeout(res, buf.duration * 1000 + 1500);
              src.onended = () => { clearTimeout(to); res(); };
              src.start();
            });
          }
        }
      } catch (e) { console.warn('EL error:', e); }
    }

    // Fallback: Web Speech
    if (!this.synth) return;
    return new Promise(res => {
      this.synth!.cancel();
      setTimeout(() => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang === 'he' ? 'he-IL' : 'en-US';
        // Try to find a Hebrew voice
        if (lang === 'he') {
          const heVoice = this.synth!.getVoices().find(v => v.lang?.startsWith('he'));
          if (heVoice) u.voice = heVoice;
        }
        u.pitch = PITCH[charId] || 1;
        u.rate = lang === 'he' ? 0.85 : 0.9;
        const to = setTimeout(res, text.length * 80 + 3000);
        u.onend = () => { clearTimeout(to); res(); };
        u.onerror = () => { clearTimeout(to); res(); };
        this.synth!.speak(u);
      }, 50);
    });
  }

  stop() { this.synth?.cancel(); }

  public tradition: 'ashkenazi' | 'sephardi' = 'ashkenazi';

  // Agentic dialogue — calls Claude via server proxy
  async react(ctx: string, chars: string[], phase: string, max: number): Promise<Array<{speaker:string;en:string;he:string}>> {
    const selected = [...chars].sort(() => Math.random() - 0.5).slice(0, max);
    if (this.hasAI) {
      try {
        const r = await fetch('/api/dialogue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: ctx, characters: selected, phase, maxReactions: max, tradition: this.tradition, speakLang: this.speakLang })
        });
        const d = await r.json();
        if (d.ok && d.reactions?.length) return d.reactions;
      } catch (e) { console.warn('AI dialogue fail:', e); }
    }
    return selected.map(id => this.fallback(id, ctx));
  }

  private used = new Map<string, Set<number>>();
  private fallback(id: string, ctx: string): {speaker:string;en:string;he:string} {
    const c = ctx.toLowerCase();
    const P: Record<string, Record<string, string[]>> = {
      child_young:{eat:["This charoset is SO good!","Can I have more?"],sing:["DAY-DAY-ENU!","This is my FAVORITE!"],afikoman:["I FOUND IT!","What's my prize??"],nishtana:["Did I do good??","I was so nervous!"],_:["How much longer?","I'm SO hungry!","What's happening now?","I need to go to the bathroom.","Can I sit on Saba's lap?"]},
      child_wicked:{eat:["Finally, actual food.","The horseradish is trying to kill me."],sing:["I'm not singing. ...OK fine.","Uncle Moshe is making my ears bleed."],_:["Are we still on Maggid?","I could be on TikTok.","*audible sigh*","How is it only 9:30?","Can I have my phone back?"]},
      child_simple:{_:["Why?","But WHY though?","What does that mean?","Can I see?","What's that?","Wow!","Is it magic?"]},
      child_wise:{_:["The Rambam has an interesting take...","In the original Aramaic...","Actually, the Tosafot disagree...","Fascinating parallel to last week's parsha."]},
      savta:{eat:["It's good. My mother's was better.","You barely ate!"],sing:["That's not the right melody!"],nishtana:["She's an ANGEL! I need a tissue!"],_:["In my day...","Eat! You're too thin!","We are so blessed.","My parents survived so we could be here."]},
      saba:{_:["What?","I wasn't sleeping!","Eh?","That was fast.","Needs salt.","Reminds me of the army..."]},
      uncle:{sing:["*FULL VOLUME*","COME ON! I CAN'T HEAR YOU!","LOUDER!"],_:["L'CHAIM!","This is the BEST part!","SING ALONG!","Pass the EVERYTHING!"]},
      guest:{eat:["What is this? It's delicious!","The horseradish almost killed me."],sing:["This song is a BANGER.","Day-ay-new?"],_:["That's so interesting!","Should I be doing something?","Thank you for inviting me.","I'm getting goosebumps."]},
      mother:{nishtana:["*tears streaming* My baby.","She practiced for THREE WEEKS."],afikoman:["No iPad. ABSOLUTELY not.","Fine. Ice cream. ONE scoop."],_:["Phones away. That means you, Daniel.","Shhh!","Sit DOWN.","Beautiful."]},
      father:{afikoman:["I spent THREE DAYS planning this hiding spot.","Deal. Final offer."],_:["This is my favorite part!","Interesting fact...","You know what's interesting about this..."]},
      aunt:{_:["I'm still learning the customs.","Moshe, let someone else talk!","That's beautiful.","In my family we do it differently."]},
      leader:{nishtana:["Noa'le, magnificent."],_:["Nu?","Let us continue.","Pay attention, this is crucial.","We are here. Against all odds."]},
    };
    const p=P[id]||P.guest;
    let cat='_';for(const k of Object.keys(p)){if(k!=='_'&&c.includes(k)){cat=k;break;}}
    const lines=p[cat]||p._||['...'];
    const key=`${id}:${cat}`;
    if(!this.used.has(key))this.used.set(key,new Set());
    const u=this.used.get(key)!;
    let av=lines.map((_,i)=>i).filter(i=>!u.has(i));
    if(!av.length){u.clear();av=lines.map((_,i)=>i);}
    const idx=av[Math.floor(Math.random()*av.length)];
    u.add(idx);
    return {speaker:id,en:lines[idx],he:''};
  }
}
