// Agentic Dialogue Engine
// Reads character personality markdown files and uses Claude API
// to generate in-character reactions at each Seder moment

export interface Reaction {
  speaker: string;
  en: string;
  he: string;
}

export type AgentActivityCallback = (active: boolean) => void;

export class DialogueEngine {
  private profiles: Map<string, string> = new Map();
  private cache: Map<string, Reaction[]> = new Map();

  constructor(private readonly onAgentActivity?: AgentActivityCallback) {}

  // Load all character markdown profiles
  async loadProfiles(characterIds: string[]): Promise<void> {
    for (const id of characterIds) {
      try {
        // Map character IDs to file names
        const fileMap: Record<string, string> = {
          leader: 'leader', mother: 'mother', father: 'father',
          savta: 'savta', saba: 'saba', child_young: 'child-youngest',
          child_wise: 'child-wise', child_wicked: 'child-wicked',
          child_simple: 'child-simple', uncle: 'uncle', aunt: 'aunt', guest: 'guest'
        };
        const fileName = fileMap[id] || id;
        const resp = await fetch(`/characters/${fileName}.md`);
        if (resp.ok) {
          this.profiles.set(id, await resp.text());
        }
      } catch (e) {
        console.warn(`Could not load profile for ${id}`);
      }
    }
  }

  // Generate reactions for a reaction slot
  async generateReactions(
    context: string,
    characterIds: string[],
    maxReactions: number,
    phase: string
  ): Promise<Reaction[]> {
    // Cache key
    const key = `${phase}:${context.slice(0, 50)}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    // Pick random subset of characters
    const selected = characterIds
      .sort(() => Math.random() - 0.5)
      .slice(0, maxReactions);

    const reactions: Reaction[] = [];

    this.onAgentActivity?.(true);
    try {
      for (const charId of selected) {
        const profile = this.profiles.get(charId);
        if (!profile) continue;

        try {
          const reaction = await this.callAPI(context, profile, charId, phase);
          if (reaction) reactions.push(reaction);
        } catch (e) {
          console.warn(`API call failed for ${charId}, skipping`);
        }
      }

      this.cache.set(key, reactions);
      return reactions;
    } finally {
      this.onAgentActivity?.(false);
    }
  }

  private async callAPI(
    context: string,
    profile: string,
    charId: string,
    phase: string
  ): Promise<Reaction | null> {
    try {
      const response = await fetch('/api/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, profile, charId, phase }),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as {
        reaction?: { speaker: string; en: string; he: string };
      };
      if (!data.reaction) return null;
      return data.reaction;
    } catch {
      return null;
    }
  }

  // Fallback — generate without API (for offline/demo mode)
  generateFallback(charId: string, context: string): Reaction {
    // Simple pattern-matched fallbacks based on character archetypes
    const fallbacks: Record<string, string[]> = {
      child_young: ["I'm hungry!", "When do we eat?", "Are we almost done?", "That was SO cool!"],
      child_wicked: ["Can I go now?", "This is taking forever.", "Interesting... said no one ever.", "OK that was actually kind of cool."],
      child_simple: ["What's that?", "Why?", "Can I touch it?", "Wow!"],
      child_wise: ["Actually, the Rambam says...", "That connects to what we learned in school.", "Fascinating."],
      savta: ["My mother made it better.", "You're not eating enough!", "Beautiful, just beautiful.", "In my day..."],
      saba: ["What? What did they say?", "I wasn't sleeping!", "That was fast.", "Reminds me of the army..."],
      uncle: ["L'CHAIM!", "LOUDER! I can't hear you!", "Now THAT'S what I call a Seder!"],
      guest: ["That's so interesting!", "Wait, what just happened?", "This is incredible.", "Should I be doing something?"],
      mother: ["Sit down please.", "That was beautiful, sweetie.", "Who wants more?", "Shhh, Rabbi David is speaking."],
      father: ["This is my favorite part!", "You know what's interesting about this...", "Who touched the Afikoman?"],
      aunt: ["I love this tradition.", "Moshe, not so loud!", "Can I help with anything?"],
      leader: ["Nu?", "Beautiful question.", "Let me tell you a story...", "Pay attention, this is important."],
    };
    const lines = fallbacks[charId] || ["..."];
    return { speaker: charId, en: lines[Math.floor(Math.random() * lines.length)], he: '' };
  }
}
