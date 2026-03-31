export type Tradition = 'ashkenazi' | 'sephardi';
export type SpeakLang = 'en' | 'he' | 'both';
export type SubtitleScale = 'sm' | 'md' | 'lg';

export interface SederPrefs {
  tradition: Tradition;
  speakLang: SpeakLang;
  useAI: boolean;
  subtitleScale: SubtitleScale;
  cinematicCamera: boolean;
  reducedMotion: boolean;
}

const KEY = 'agentic-seder-prefs-v1';

export const defaultPrefs: SederPrefs = {
  tradition: 'ashkenazi',
  speakLang: 'en',
  useAI: true,
  subtitleScale: 'md',
  cinematicCamera: true,
  reducedMotion: false,
};

export function loadPrefs(): SederPrefs {
  if (typeof window === 'undefined') return defaultPrefs;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultPrefs;
    const p = JSON.parse(raw) as Partial<SederPrefs>;
    return { ...defaultPrefs, ...p };
  } catch {
    return defaultPrefs;
  }
}

export function savePrefs(p: Partial<SederPrefs>): void {
  if (typeof window === 'undefined') return;
  try {
    const next = { ...loadPrefs(), ...p };
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode etc. */
  }
}

export function subtitleFontPx(scale: SubtitleScale): { he: number; en: number } {
  switch (scale) {
    case 'sm':
      return { he: 15, en: 12 };
    case 'lg':
      return { he: 22, en: 16 };
    default:
      return { he: 18, en: 14 };
  }
}
