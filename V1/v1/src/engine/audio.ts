// Audio Engine — ElevenLabs TTS (client key or /api/elevenlabs server proxy) + Web Speech fallback

import { charMap } from '@/data/characters';
import { ELEVEN_VOICE_MAP, ELEVEN_VOICE_SETTINGS } from '@/lib/elevenlabs-config';

export class AudioEngine {
  private elevenLabsKey: string = '';
  private useServerElevenLabs = false;
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  
  // Fallback: Web Speech API
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  
  public enabled: boolean = true;
  public speakLang: 'en' | 'he' | 'both' = 'en';
  public useElevenLabs: boolean = false;

  /**
   * @param elevenLabsKey — optional; if set, calls ElevenLabs directly from the browser
   * @param useServerElevenLabs — if true (and no client key), audio goes through POST /api/elevenlabs (Vercel env)
   */
  async init(elevenLabsKey?: string, useServerElevenLabs?: boolean): Promise<void> {
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

    if (elevenLabsKey) {
      this.elevenLabsKey = elevenLabsKey;
      this.useServerElevenLabs = false;
      this.useElevenLabs = true;
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } else if (useServerElevenLabs) {
      this.useServerElevenLabs = true;
      this.useElevenLabs = true;
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
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
    let response: Response;

    if (this.useServerElevenLabs) {
      response = await fetch('/api/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, characterId }),
      });
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const j = (await response.json()) as { ok?: boolean };
        if (j.ok === false) {
          throw new Error('ElevenLabs not configured on server (add ELEVENLABS_API_KEY to .env.local for local dev)');
        }
        throw new Error('Unexpected JSON from /api/elevenlabs');
      }
    } else {
      const voiceId = ELEVEN_VOICE_MAP[characterId] || ELEVEN_VOICE_MAP.leader;
      const settings = ELEVEN_VOICE_SETTINGS[characterId] || ELEVEN_VOICE_SETTINGS.leader;
      response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_flash_v2_5',
          voice_settings: {
            stability: settings.stability,
            similarity_boost: settings.similarity_boost,
            style: settings.style || 0.3,
            use_speaker_boost: true,
          },
        }),
      });
    }

    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.status}`);
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
