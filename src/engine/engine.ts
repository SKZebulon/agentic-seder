// Engine: Audio (ElevenLabs via proxy + Web Speech) + Agentic Dialogue (Claude via proxy)
// Supports Hebrew and English speech

/** One shared context — mobile Safari requires resume() during a user gesture; we unlock on "Start" before any async work. */
let sharedAudioContext: AudioContext | null = null;

function getSharedAudioContext(): AudioContext {
  if (typeof window === 'undefined') {
    throw new Error('AudioContext requires window');
  }
  if (!sharedAudioContext) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) throw new Error('No AudioContext');
    sharedAudioContext = new AC();
  }
  return sharedAudioContext;
}

/**
 * Call synchronously from a click/touch handler (e.g. "Light the Candles").
 * iOS/Android often block AudioContext until this runs inside the gesture chain — not after setTimeout/network.
 */
export function unlockWebAudio(): void {
  if (typeof window === 'undefined') return;
  try {
    void getSharedAudioContext().resume();
  } catch {
    /* ignore */
  }
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance('\u00A0');
    u.volume = 0;
    s.speak(u);
    s.cancel();
  } catch {
    /* ignore */
  }
}

const VOICE_POOL: Record<string, Record<string, string>> = {
  M: {
    child: 'EXAVITQu4vr4xnSDxMaL', // Bella (pitched up)
    teen: 'ErXwobaYiN019PkySvjV',  // Antoni
    adult: 'ErXwobaYiN019PkySvjV', // Antoni
    elder: 'TxGEqnHWrfWFTfGW9XjX', // Josh
  },
  F: {
    child: 'EXAVITQu4vr4xnSDxMaL', // Bella
    teen: 'AZnzlk1XvdvUeBnXmlld',  // Domi
    adult: '21m00Tcm4TlvDq8ikWAM', // Rachel
    elder: 'MF3mGyEYCl7XYWbV9V6O', // Elli
  }
};

const DEFAULT_VOICES: Record<string, { voiceId: string; stability: number; style: number }> = {
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
  /** Active ElevenLabs buffer source (so stop/pause can target it). */
  private activeBufferSource: AudioBufferSourceNode | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  public hasEL = false;
  public hasAI = false;
  public audioEnabled = true;
  public speakLang: 'en' | 'he' | 'both' = 'en'; // which language to SPEAK aloud
  /** Playback rate for TTS (1 = normal). Synced from UI speed control. */
  public playbackSpeed = 1;
  public chars: any[] = [];

  async init(): Promise<{
    hasEL: boolean;
    hasAI: boolean;
    elevenlabsCustomVoice: boolean;
  }> {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
      this.audioCtx = getSharedAudioContext();
      this.ambientGain = this.audioCtx.createGain();
      this.ambientGain.gain.value = 0.15;
      this.ambientGain.connect(this.audioCtx.destination);
    }
    let elevenlabsCustomVoice = false;
    try {
      const r = await fetch('/api/config');
      const cfg = await r.json();
      this.hasEL = !!cfg.elevenlabs;
      this.hasAI = !!cfg.anthropic;
      elevenlabsCustomVoice = !!cfg.elevenlabsCustomVoice;

      const cr = await fetch('/api/characters?type=all');
      this.chars = await cr.json();
    } catch {
      /* ignore */
    }
    return { hasEL: this.hasEL, hasAI: this.hasAI, elevenlabsCustomVoice };
  }

  private getVoice(charId: string) {
    const char = this.chars.find(c => c.id === charId);
    if (!char) return DEFAULT_VOICES.leader;
    
    const pool = VOICE_POOL[char.gender] || VOICE_POOL.M;
    const voiceId = pool[char.age] || pool.adult;
    
    // Use default settings but custom voiceId if metadata changed
    return { 
      voiceId, 
      stability: DEFAULT_VOICES[charId]?.stability || 0.6, 
      style: DEFAULT_VOICES[charId]?.style || 0.4 
    };
  }

  // Speak text — picks language based on speakLang setting
  // If both he and en provided, speaks based on preference
  async speakLine(en: string, he: string, charId: string): Promise<void> {
    if (!this.audioEnabled) return;
    this.duckAmbient(true);
    const id = charId === 'all' ? 'leader' : charId;
    
    // Logic:
    // 1. If it's a prayer (he exists and it's fixed liturgy), always speak Hebrew.
    // 2. If it's conversation (react), speak based on speakLang setting.
    // 3. If speakLang is 'both', speak Hebrew then English.
    
    const isPrayer = !!he && !en.includes(':'); // Heuristic: conversation usually has "Name: ..." or is generated
    
    let text = '';
    let lang: 'en' | 'he' = 'en';

    if (he && (this.speakLang === 'he' || this.speakLang === 'both' || isPrayer)) {
      await this.speakRaw(he, id, 'he');
      if (this.speakLang === 'both' && en) {
        await this.speakRaw(en, id, 'en');
      }
    } else if (en) {
      await this.speakRaw(en, id, 'en');
    }

    this.duckAmbient(false);
  }

  private duckAmbient(duck: boolean) {
    if (!this.ambientGain || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    this.ambientGain.gain.setTargetAtTime(duck ? 0.05 : 0.15, now, 0.5);
  }

  async startAmbient() {
    if (!this.audioCtx || this.ambientSource) return;
    try {
      // White noise / room tone generator as placeholder since we have no assets
      const bufferSize = 2 * this.audioCtx.sampleRate;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      // Filter the noise to make it a soft "room tone"
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      
      const src = this.audioCtx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.connect(filter);
      filter.connect(this.ambientGain!);
      src.start();
      this.ambientSource = src;
    } catch (e) { console.warn('Ambient fail:', e); }
  }

  private async speakRaw(text: string, charId: string, lang: 'en' | 'he'): Promise<void> {
    // ElevenLabs (works for both languages — their multilingual model handles Hebrew)
    if (this.hasEL) {
      try {
        const v = this.getVoice(charId);
        const r = await fetch('/api/elevenlabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voiceId: v.voiceId,
            stability: v.stability,
            similarity_boost: 0.75,
            style: v.style,
            // ISO 639-1 — required or ElevenLabs treats text as English and Hebrew sounds like gibberish
            language_code: lang === 'he' ? 'he' : 'en',
          }),
        });
        const ct = r.headers.get('content-type') || '';
        if (r.ok && ct.includes('application/json')) {
          try {
            const j = await r.json() as { ok?: boolean; error?: string; detail?: string };
            if (j?.ok === false) {
              if (j.error === 'paid_plan_required') {
                console.warn(
                  'ElevenLabs: paid plan required for default library voices via API. Fix: (1) Regenerate API key at elevenlabs.io after your subscription is active and paste into Vercel as ELEVENLABS_API_KEY. (2) Or set ELEVENLABS_DEFAULT_VOICE_ID to a Voice ID from *your* account (Voices → your voice → copy ID).',
                  j.detail ? `\n${j.detail.slice(0, 400)}` : ''
                );
              } else {
                console.warn('ElevenLabs:', j.error || 'failed', j.detail ? `— ${j.detail.slice(0, 200)}` : '');
              }
            }
          } catch { /* ignore */ }
        } else if (r.ok && ct.includes('audio')) {
          this.audioCtx = getSharedAudioContext();
          if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();
          const ab = await r.arrayBuffer();
          if (ab.byteLength > 100) {
            const buf = await this.audioCtx.decodeAudioData(ab);
            return new Promise(res => {
              const src = this.audioCtx!.createBufferSource();
              this.activeBufferSource = src;
              const rate = Math.min(4, Math.max(0.5, this.playbackSpeed));
              src.playbackRate.value = rate;
              src.buffer = buf;
              src.connect(this.audioCtx!.destination);
              const wallMs = (buf.duration / rate) * 1000 + 800;
              const to = setTimeout(res, wallMs);
              src.onended = () => {
                clearTimeout(to);
                if (this.activeBufferSource === src) this.activeBufferSource = null;
                res();
              };
              src.start();
            });
          }
        }
      } catch (e) { console.warn('EL error:', e); }
    }

    // Fallback: Web Speech (Hebrew voices load async in Chrome — wait for voiceschanged)
    if (!this.synth) return;
    return new Promise(res => {
      const synth = this.synth!;
      const run = () => {
        synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang === 'he' ? 'he-IL' : 'en-US';
        if (lang === 'he') {
          const voices = synth.getVoices();
          const heVoice = voices.find(v => {
            const l = (v.lang || '').toLowerCase();
            return l.startsWith('he') || l.startsWith('iw'); // iw = legacy Hebrew
          });
          if (heVoice) u.voice = heVoice;
        } else {
          // Explicitly set English voice if available to avoid getting stuck on Hebrew voice
          const voices = synth.getVoices();
          const enVoice = voices.find(v => {
            const l = (v.lang || '').toLowerCase();
            return l.startsWith('en-us') || l.startsWith('en-gb') || l.startsWith('en');
          });
          if (enVoice) u.voice = enVoice;
        }
        const char = this.chars.find(c => c.id === charId);
        u.pitch = PITCH[charId] || (char?.age === 'child' ? 1.5 : char?.age === 'elder' ? 0.8 : 1);
        const base = lang === 'he' ? 0.85 : 0.9;
        u.rate = Math.min(2, Math.max(0.3, base * Math.min(4, Math.max(0.5, this.playbackSpeed))));
        const to = setTimeout(res, text.length * 80 + 3000);
        u.onend = () => { clearTimeout(to); res(); };
        u.onerror = () => { clearTimeout(to); res(); };
        synth.speak(u);
      };

      if (synth.getVoices().length === 0) {
        synth.addEventListener('voiceschanged', () => setTimeout(run, 0), { once: true });
        return;
      }
      setTimeout(run, 50);
    });
  }

  /** Stop TTS immediately (buffer + Web Speech). */
  stop() {
    this.stopBufferOnly();
    try {
      this.synth?.cancel();
    } catch {
      /* ignore */
    }
  }

  private stopBufferOnly() {
    if (this.activeBufferSource) {
      try {
        this.activeBufferSource.stop();
      } catch {
        /* ignore */
      }
      this.activeBufferSource = null;
    }
  }

  /** Pause ongoing speech (ElevenLabs buffer + Web Speech). */
  pausePlayback() {
    try {
      void this.audioCtx?.suspend();
    } catch {
      /* ignore */
    }
    try {
      this.synth?.pause();
    } catch {
      /* ignore */
    }
  }

  /** Resume after pause. */
  resumePlayback() {
    try {
      void this.audioCtx?.resume();
    } catch {
      /* ignore */
    }
    try {
      this.synth?.resume();
    } catch {
      /* ignore */
    }
  }

  /** Apply speed to live ElevenLabs buffer if playing. */
  syncPlaybackSpeed() {
    const r = Math.min(4, Math.max(0.5, this.playbackSpeed));
    if (this.activeBufferSource) {
      try {
        this.activeBufferSource.playbackRate.value = r;
      } catch {
        /* ignore */
      }
    }
  }

  async playMelody(name: string) {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const g = this.audioCtx.createGain();
    osc.connect(g);
    g.connect(this.audioCtx.destination);
    
    // Simple melodies using frequency sequences
    const melodies: Record<string, number[]> = {
      'Ma Nishtana': [261, 329, 392, 523, 392, 329, 261],
      'Dayenu': [392, 392, 392, 440, 349, 349, 349, 392, 329],
      'Chad Gadya': [261, 293, 329, 349, 392, 440, 493, 523]
    };

    const notes = melodies[name] || melodies['Dayenu'];
    let time = now;
    notes.forEach(freq => {
      osc.frequency.setValueAtTime(freq, time);
      g.gain.setValueAtTime(0.1, time);
      g.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
      time += 0.5;
    });

    osc.type = 'triangle';
    osc.start(now);
    osc.stop(time);
  }

  public tradition: 'ashkenazi' | 'sephardi' = 'ashkenazi';

  // Agentic dialogue — calls Claude via server proxy
  async react(ctx: string, chars: string[], phase: string, max: number, history: string[] = []): Promise<Array<{speaker:string;en:string;he:string}>> {
    const selected = [...chars].sort(() => Math.random() - 0.5).slice(0, max);
    if (this.hasAI) {
      try {
        const r = await fetch('/api/dialogue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context: ctx, characters: selected, phase, maxReactions: max, tradition: this.tradition, speakLang: this.speakLang, history })
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
