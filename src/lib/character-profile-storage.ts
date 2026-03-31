const PREFIX = 'agentic-seder-profile-';

export function getProfileOverride(characterId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(PREFIX + characterId);
  } catch {
    return null;
  }
}

export function setProfileOverride(characterId: string, markdown: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + characterId, markdown);
  } catch {
    /* quota */
  }
}

export function clearProfileOverride(characterId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PREFIX + characterId);
  } catch {
    /* */
  }
}
