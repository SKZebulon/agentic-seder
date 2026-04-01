// Audio Engine — ElevenLabs TTS with Web Speech API fallback
// Each character gets a distinct, carefully chosen voice

import { charMap } from '@/data/characters';

// ElevenLabs premade voice IDs mapped to Seder characters
// Chosen to match age, gender, and personality
const ELEVEN_VOICE_MAP: Record<string, string> = {
  // Rabbi David (72, male elder) — deep, authoritative, warm narrator
  leader:       'TxGEqnHWrfWFTfGW9XjX', // Josh — deep, authoritative male

  // Shira (42, female adult) — warm, expressive mother
  mother:       '21m00Tcm4TlvDq8ikWAM', // Rachel — calm, warm female

  // Avi (44, male adult) — friendly dad voice
  father:       'ErXwobaYiN019PkySvjV', // Antoni — professional, warm male

  // Savta Esther (74, female elder) — older, emotional woman
  savta:        'MF3mGyEYCl7XYWbV9V6O', // Elli — emotional, expressive female

  // Saba Yosef (78, male elder) — gruff, old, wise
  saba:         'VR6AewLTigWG4xSOukaG', // Arnold — crisp, middle-aged male (older feel)

  // Noa (8, female child) — young, high, excited
  child_young:  'EXAVITQu4vr4xnSDxMaL', // Bella — soft, young female

  // Yael (16, female teen) — studious, clear
  child_wise:   'AZnzlk1XvdvUeBnXmlld', // Domi — strong, clear young female

  // Dani (15, male teen) — sarcastic teen
  child_wicked: 'pNInz6obpgDQGcFmaJgB', // Adam — deep young male

  // Eli (6, male child) — small, curious
  child_simple: 'EXAVITQu4vr4xnSDxMaL', // Bella — soft young (highest pitch setting)

  // Uncle Moshe (48, male) — loud, booming
  uncle:        'TxGEqnHWrfWFTfGW9XjX', // Josh — deep, powerful

  // Aunt Leah (35, female) — warm, modern
  aunt:         '21m00Tcm4TlvDq8ikWAM', // Rachel — calm female

  // Ben (28, male) — friendly, curious
  guest:        'ErXwobaYiN019PkySvjV', // Antoni — warm male
};

// Voice settings per character — stability + similarity + style
const VOICE_SETTINGS: Record<string, { stability: number; similarity_boost: number; style?: number }> = {
  leader:       { stability: 0.7, similarity_boost: 0.8, style: 0.3 },
  mother:       { stability: 0.6, similarity_boost: 0.75, style: 0.4 },
  father:       { stability: 0.65, similarity_boost: 0.75, style: 0.3 },
  savta:        { stability: 0.5, similarity_boost: 0.7, style: 0.6 },  // more emotional
  saba:         { stability: 0.7, similarity_boost: 0.8, style: 0.2 },
  child_young:  { stability: 0.4, similarity_boost: 0.7, style: 0.7 },  // expressive
  child_wise:   { stability: 0.65, similarity_boost: 0.8, style: 0.3 },
  child_wicked: { stability: 0.5, similarity_boost: 0.75, style: 0.6 }, // sarcastic range
  child_simple: { stability: 0.4, similarity_boost: 0.65, style: 0.7 }, // wonder
  uncle:        { stability: 0.4, similarity_boost: 0.7, style: 0.8 },  // LOUD and expressive
  aunt:         { stability: 0.6, similarity_boost: 0.75, style: 0.3 },
  guest:        { stability: 0.65, similarity_boost: 0.8, style: 0.3 },
};

export class AudioEngine {
  private elevenLabsKey: string = '';
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  
  // Fallback: Web Speech API
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  
  public enabled: boolean = true;
  public speakLang: 'en' | 'he' | 'both' = 'en';
  public useElevenLabs: boolean = false;

  async init(elevenLabsKey?: string): Promise<void> {
    // Web Speech fallback
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
      this.voices = await new Promise<SpeechSynthesisVoice[]>(resolve => {
        let attempts = 0;
        const check = () => {
          const v = this.synth!.getVoices();
          if (v.length > 0 || attempts > 30) resolve(v);
          else { attempts++; setTimeout(check, 100); }
        };
        check();
      });
    }

    // ElevenLabs
    if (elevenLabsKey) {
      this.elevenLabsKey = elevenLabsKey;
      this.useElevenLabs = true;
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('ElevenLabs audio initialized');
    }
    
    console.log(`Audio: ElevenLabs=${this.useElevenLabs}, WebSpeech voices=${this.voices.length}`);
  }

  async speak(text: string, characterId: string, lang?: 'he' | 'en'): Promise<void> {
    if (!this.enabled || !text?.trim() || text.startsWith('*')) return;

    // Try ElevenLabs first
    if (this.useElevenLabs) {
      try {
        await this.speakElevenLabs(text, characterId);
        return;
      } catch (e) {
        console.warn('ElevenLabs failed, falling back to Web Speech:', e);
      }
    }

    // Fallback to Web Speech API
    return this.speakWebSpeech(text, characterId, lang);
  }

  private async speakElevenLabs(text: string, characterId: string): Promise<void> {
    const voiceId = ELEVEN_VOICE_MAP[characterId] || ELEVEN_VOICE_MAP['leader'];
    const settings = VOICE_SETTINGS[characterId] || VOICE_SETTINGS['leader'];

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.elevenLabsKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_flash_v2_5', // Fast model for low latency
        voice_settings: {
          stability: settings.stability,
          similarity_boost: settings.similarity_boost,
          style: settings.style || 0.3,
          use_speaker_boost: true,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    
    return new Promise<void>((resolve) => {
      // Stop any currently playing audio
      if (this.currentSource) {
        try { this.currentSource.stop(); } catch {}
      }

      const source = this.audioContext!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext!.destination);
      this.currentSource = source;

      source.onended = () => {
        this.currentSource = null;
        resolve();
      };

      // Safety timeout
      const timeout = setTimeout(() => resolve(), audioBuffer.duration * 1000 + 2000);
      source.onended = () => { clearTimeout(timeout); this.currentSource = null; resolve(); };

      source.start(0);
    });
  }

  private speakWebSpeech(text: string, characterId: string, lang?: 'he' | 'en'): Promise<void> {
    if (!this.synth) return Promise.resolve();

    return new Promise(resolve => {
      this.synth!.cancel();
      
      setTimeout(() => {
        const ch = charMap[characterId] || charMap['leader'];
        const u = new SpeechSynthesisUtterance(text);

        const effectiveLang = lang || this.speakLang;
        const heVoice = this.voices.find(v => v.lang?.startsWith('he'));
        const enVoices = this.voices.filter(v => v.lang?.startsWith('en'));

        if (effectiveLang === 'he' && heVoice) {
          u.voice = heVoice;
          u.lang = 'he-IL';
        } else if (enVoices.length > 0) {
          const hash = characterId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
          u.voice = enVoices[hash % enVoices.length];
          u.lang = 'en-US';
        }

        u.pitch = ch?.pitch || 1;
        u.rate = ch?.rate || 0.9;

        const timeout = setTimeout(() => resolve(), Math.max(text.length * 85, 2000) + 3000);
        u.onend = () => { clearTimeout(timeout); resolve(); };
        u.onerror = () => { clearTimeout(timeout); resolve(); };

        this.synth!.speak(u);
      }, 50);
    });
  }

  stop(): void {
    if (this.currentSource) {
      try { this.currentSource.stop(); } catch {}
      this.currentSource = null;
    }
    this.synth?.cancel();
  }
}
