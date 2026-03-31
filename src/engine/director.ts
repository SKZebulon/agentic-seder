// The Director — orchestrates the entire Seder autonomously
// Processes liturgy beats, triggers animations, speaks audio,
// and calls the AI dialogue engine for reaction slots

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
  private callbacks: DirectorCallbacks;
  private currentIndex: number = 0;
  private currentPhase: string = '';
  public paused: boolean = false;
  public speed: number = 1;
  private running: boolean = false;
  private useAI: boolean = true;

  constructor(
    beats: Beat[],
    audio: AudioEngine,
    dialogue: DialogueEngine,
    callbacks: DirectorCallbacks,
    useAI: boolean = true
  ) {
    this.beats = beats;
    this.audio = audio;
    this.dialogue = dialogue;
    this.callbacks = callbacks;
    this.useAI = useAI;
  }

  async run(): Promise<void> {
    this.running = true;

    while (this.currentIndex < this.beats.length && this.running) {
      // Wait if paused
      while (this.paused && this.running) {
        await this.wait(200);
      }
      if (!this.running) break;

      const beat = this.beats[this.currentIndex];
      if (!beat) break;

      this.callbacks.onBeatIndex(this.currentIndex);

      switch (beat.type) {
        case 'phase':
          this.currentPhase = beat.phase || '';
          this.callbacks.onPhase(this.currentPhase);
          this.callbacks.onSubtitle({ he: '', en: '', speaker: null });
          await this.wait(beat.dur || 3000);
          break;

        case 'liturgy':
          await this.processLiturgy(beat);
          break;

        case 'action':
          await this.processAction(beat);
          break;

        case 'reaction':
          await this.processReaction(beat);
          break;
      }

      this.currentIndex++;
    }

    this.callbacks.onFinished();
  }

  private async processLiturgy(beat: Beat): Promise<void> {
    const speaker = beat.speaker || 'leader';

    // Animate speaker
    this.callbacks.onAnimate(speaker, 'speak');
    this.callbacks.onSpeaker(speaker);

    // Show subtitles
    this.callbacks.onSubtitle({ he: beat.he || '', en: beat.en || '', speaker });

    // Speak audio
    const textToSpeak = this.audio.speakLang === 'he' ? (beat.he || beat.en || '') : (beat.en || beat.he || '');
    const lang = this.audio.speakLang === 'he' ? 'he' : 'en';

    await Promise.race([
      this.audio.speak(textToSpeak, speaker, lang),
      this.wait(beat.dur || 5000)
    ]);

    this.callbacks.onResetCharacter(speaker);
  }

  private async processAction(beat: Beat): Promise<void> {
    const speaker = beat.speaker || '';
    const action = beat.action || '';

    if (speaker === 'all') {
      this.callbacks.onAnimate('all', action);
    } else if (speaker) {
      this.callbacks.onAnimate(speaker, action);
    }

    if (action === 'door') {
      this.callbacks.onDoor();
    }

    this.callbacks.onSpeaker(speaker || null);

    if (beat.he || beat.en) {
      this.callbacks.onSubtitle({ he: beat.he || '', en: beat.en || '', speaker });
      // Speak action descriptions
      if (beat.en && this.audio.enabled) {
        await Promise.race([
          this.audio.speak(beat.en, speaker === 'all' ? 'leader' : speaker),
          this.wait(beat.dur || 3000)
        ]);
      } else {
        await this.wait(beat.dur || 3000);
      }
    } else {
      await this.wait(beat.dur || 1000);
    }

    if (action === 'end') {
      this.running = false;
    }

    if (speaker && speaker !== 'all') {
      this.callbacks.onResetCharacter(speaker);
    }
  }

  private async processReaction(beat: Beat): Promise<void> {
    const characters = beat.characters || [];
    const maxReactions = beat.maxReactions || 2;
    const context = beat.context || '';

    let reactions: Reaction[] = [];

    if (this.useAI) {
      try {
        reactions = await this.dialogue.generateReactions(
          context, characters, maxReactions, this.currentPhase
        );
      } catch (e) {
        console.warn('AI reaction generation failed, using fallbacks');
      }
    }

    // Fallback if AI didn't produce enough reactions
    if (reactions.length < maxReactions) {
      const remaining = characters
        .filter(c => !reactions.find(r => r.speaker === c))
        .sort(() => Math.random() - 0.5)
        .slice(0, maxReactions - reactions.length);

      for (const charId of remaining) {
        reactions.push(this.dialogue.generateFallback(charId, context));
      }
    }

    // Play each reaction
    for (const reaction of reactions) {
      if (!reaction || (!reaction.en && !reaction.he)) continue;

      this.callbacks.onAnimate(reaction.speaker, 'speak');
      this.callbacks.onSpeaker(reaction.speaker);
      this.callbacks.onSubtitle({ he: reaction.he, en: reaction.en, speaker: reaction.speaker });

      const text = reaction.en || reaction.he;
      await Promise.race([
        this.audio.speak(text, reaction.speaker),
        this.wait(Math.max(text.length * 70, 2000))
      ]);

      this.callbacks.onResetCharacter(reaction.speaker);
      await this.wait(400); // Brief pause between reactions
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms / this.speed));
  }

  skipTo(index: number): void {
    this.currentIndex = Math.max(0, Math.min(index, this.beats.length - 1));
    this.audio.stop();
  }

  stop(): void {
    this.running = false;
    this.audio.stop();
  }
}
