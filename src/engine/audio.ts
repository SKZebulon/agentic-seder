// Audio Engine — Web Speech API with per-character voice differentiation

import { Character, charMap } from '@/data/characters';

export class AudioEngine {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private hebrewVoice: SpeechSynthesisVoice | null = null;
  private englishVoices: SpeechSynthesisVoice[] = [];
  public enabled: boolean = true;
  public speakLang: 'en' | 'he' | 'both' = 'en';

  constructor() {
    this.synth = window.speechSynthesis;
  }

  async init(): Promise<void> {
    // Voices load asynchronously in some browsers
    this.voices = await new Promise<SpeechSynthesisVoice[]>(resolve => {
      const check = () => {
        const v = this.synth.getVoices();
        if (v.length > 0) resolve(v);
        else setTimeout(check, 100);
      };
      check();
      // Safety timeout — some environments have no voices
      setTimeout(() => resolve(this.synth.getVoices()), 3000);
    });

    this.hebrewVoice = this.voices.find(v => v.lang?.startsWith('he')) || null;
    this.englishVoices = this.voices.filter(v => v.lang?.startsWith('en'));

    console.log(`Audio initialized: ${this.voices.length} voices, Hebrew: ${!!this.hebrewVoice}`);
  }

  speak(text: string, characterId: string, lang?: 'he' | 'en'): Promise<void> {
    if (!this.enabled || !text || text.startsWith('*') || !text.trim()) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.synth.cancel(); // Cancel any ongoing speech

      const ch = charMap[characterId] || charMap['leader'];
      const utterance = new SpeechSynthesisUtterance(text);

      // Set language and voice
      const effectiveLang = lang || this.speakLang;
      if (effectiveLang === 'he' && this.hebrewVoice) {
        utterance.voice = this.hebrewVoice;
        utterance.lang = 'he-IL';
      } else if (this.englishVoices.length > 0) {
        // Pick a consistent voice for this character
        const voiceIdx = Math.abs(characterId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % this.englishVoices.length;
        utterance.voice = this.englishVoices[voiceIdx];
        utterance.lang = 'en-US';
      }

      // Character-specific voice settings
      utterance.pitch = ch.pitch;
      utterance.rate = ch.rate;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      // Safety timeout — don't block forever
      const timeout = setTimeout(() => resolve(), (text.length * 80) + 5000);
      utterance.onend = () => { clearTimeout(timeout); resolve(); };

      this.synth.speak(utterance);
    });
  }

  stop(): void {
    this.synth.cancel();
  }

  pause(): void {
    this.synth.pause();
  }

  resume(): void {
    this.synth.resume();
  }
}
