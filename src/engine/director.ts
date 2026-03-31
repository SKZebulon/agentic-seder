// Director — FIXED
// Properly distributes speaking across characters
// Doesn't default everything to leader

import { Beat } from '@/data/haggadah-script';
import { AudioEngine } from './audio';
import { DialogueEngine, Reaction } from './dialogue';

export interface DirectorCallbacks {
  onPhase: (phase: string) => void;
  onSubtitle: (data: { he: string; en: string; speaker: string | null }) => void;
  onSpeaker: (speaker: string | null) => void;
  onAnimate: (speaker: string, action: string) => void;
  onResetCharacter: (speaker: string) => void;
  onBeatIndex: (index: number) => void;
  onFinished: () => void;
  onDoor: () => void;
}

export class Director {
  private beats: Beat[];
  private audio: AudioEngine;
  private dialogue: DialogueEngine;
  private cb: DirectorCallbacks;
  private idx: number = 0;
  private currentPhase: string = '';
  public paused: boolean = false;
  public speed: number = 1;
  private running: boolean = false;
  private useAI: boolean;

  constructor(beats: Beat[], audio: AudioEngine, dialogue: DialogueEngine, cb: DirectorCallbacks, useAI: boolean = true) {
    this.beats = beats; this.audio = audio; this.dialogue = dialogue; this.cb = cb; this.useAI = useAI;
  }

  async run(): Promise<void> {
    this.running = true;
    while (this.idx < this.beats.length && this.running) {
      while (this.paused && this.running) await this.wait(200);
      if (!this.running) break;

      const beat = this.beats[this.idx];
      if (!beat) break;
      this.cb.onBeatIndex(this.idx);

      if (beat.type === 'phase') {
        this.currentPhase = beat.phase || '';
        this.cb.onPhase(this.currentPhase);
        this.cb.onSubtitle({ he: '', en: '', speaker: null });
        this.cb.onSpeaker(null);
        await this.wait(beat.dur || 3000);
      }
      else if (beat.type === 'liturgy') {
        // FIXED: Use the actual speaker from the beat, not always 'leader'
        const spk = beat.speaker || 'leader';
        this.cb.onAnimate(spk, 'speak');
        this.cb.onSpeaker(spk);
        this.cb.onSubtitle({ he: beat.he || '', en: beat.en || '', speaker: spk });

        const txt = this.audio.speakLang === 'he' ? (beat.he || beat.en || '') : (beat.en || beat.he || '');
        const lang = this.audio.speakLang === 'he' ? 'he' as const : 'en' as const;
        
        // Wait for speech to complete OR duration timeout
        await Promise.race([
          this.audio.speak(txt, spk, lang),
          this.wait(beat.dur || 6000)
        ]);
        
        this.cb.onResetCharacter(spk);
        await this.wait(300); // Brief pause between liturgy lines
      }
      else if (beat.type === 'action') {
        const spk = beat.speaker || '';
        const action = beat.action || '';

        if (spk === 'all') this.cb.onAnimate('all', action);
        else if (spk) this.cb.onAnimate(spk, action);

        if (action === 'door') this.cb.onDoor();
        if (action === 'end') { this.running = false; this.cb.onFinished(); return; }

        this.cb.onSpeaker(spk || null);
        if (beat.he || beat.en) {
          this.cb.onSubtitle({ he: beat.he || '', en: beat.en || '', speaker: spk });
          // For actions with text (like "everyone drinks"), speak it
          const actionSpeaker = spk === 'all' ? 'leader' : (spk || 'leader');
          await Promise.race([
            this.audio.speak(beat.en || '', actionSpeaker),
            this.wait(beat.dur || 3000)
          ]);
        } else {
          await this.wait(beat.dur || 1500);
        }

        // Reset after drinking/eating actions
        if (['drink', 'eat', 'eat_meal', 'spill', 'celebrate'].includes(action)) {
          setTimeout(() => {
            if (spk === 'all') this.cb.onResetCharacter('all');
            else if (spk) this.cb.onResetCharacter(spk);
          }, 2000);
        }
      }
      else if (beat.type === 'reaction') {
        // AI-generated or fallback dialogue — this is where it gets agentic
        const reactions = await this.dialogue.generateReactions(
          beat.context || '', beat.characters || [], beat.maxReactions || 2, this.currentPhase
        );

        for (const r of reactions) {
          if (!r || (!r.en && !r.he)) continue;

          this.cb.onAnimate(r.speaker, 'speak');
          this.cb.onSpeaker(r.speaker);
          this.cb.onSubtitle({ he: r.he, en: r.en, speaker: r.speaker });

          const txt = r.en || r.he;
          await Promise.race([
            this.audio.speak(txt, r.speaker),
            this.wait(Math.max(txt.length * 75, 2500))
          ]);

          this.cb.onResetCharacter(r.speaker);
          await this.wait(500);
        }
      }

      this.idx++;
    }
    this.cb.onFinished();
  }

  private wait(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms / this.speed));
  }

  skipTo(index: number): void {
    this.idx = Math.max(0, Math.min(index, this.beats.length - 1));
    this.audio.stop();
  }

  stop(): void { this.running = false; this.audio.stop(); }
}
