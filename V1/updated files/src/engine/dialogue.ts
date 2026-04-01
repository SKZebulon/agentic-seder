// Agentic Dialogue Engine — FIXED
// Proper API key passing, no caching, context-aware varied fallbacks

export interface Reaction {
  speaker: string;
  en: string;
  he: string;
}

export class DialogueEngine {
  private profiles: Map<string, string> = new Map();
  private usedFallbacks: Map<string, Set<number>> = new Map();
  public apiKey: string = '';

  async loadProfiles(characterIds: string[]): Promise<void> {
    const fileMap: Record<string, string> = {
      leader: 'leader', mother: 'mother', father: 'father',
      savta: 'savta', saba: 'saba', child_young: 'child-youngest',
      child_wise: 'child-wise', child_wicked: 'child-wicked',
      child_simple: 'child-simple', uncle: 'uncle', aunt: 'aunt', guest: 'guest'
    };
    await Promise.all(characterIds.map(async (id) => {
      try {
        const resp = await fetch(`/characters/${fileMap[id] || id}.md`);
        if (resp.ok) this.profiles.set(id, await resp.text());
      } catch {}
    }));
    console.log(`Loaded ${this.profiles.size} character profiles`);
  }

  async generateReactions(context: string, characterIds: string[], maxReactions: number, phase: string): Promise<Reaction[]> {
    const selected = [...characterIds].sort(() => Math.random() - 0.5).slice(0, maxReactions);
    
    // Try API if key is available
    if (this.apiKey) {
      const profiles = selected.map(id => {
        const p = this.profiles.get(id);
        return p ? `### ${id}\n${p}` : null;
      }).filter(Boolean).join('\n---\n');

      if (profiles) {
        try {
          const resp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': this.apiKey,
              'anthropic-version': '2023-06-01',
              'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 1000,
              system: `Generate natural dialogue for Passover Seder characters. For EACH character, write ONE short reaction (1-2 sentences). Vary tone: funny, touching, sarcastic, mundane. Return ONLY a JSON array: [{"speaker":"id","en":"line","he":""},...]. No markdown.`,
              messages: [{ role: 'user', content: `Phase: ${phase}\nContext: ${context}\nCharacters: ${selected.join(', ')}\nProfiles:\n${profiles}` }]
            })
          });
          if (resp.ok) {
            const data = await resp.json();
            const text = data.content?.map((c: any) => c.text || '').join('') || '';
            const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
            const arr = Array.isArray(parsed) ? parsed : [parsed];
            const reactions = arr.filter((r: any) => r.en || r.he).map((r: any) => ({
              speaker: r.speaker || selected[0], en: r.en || '', he: r.he || ''
            }));
            if (reactions.length > 0) return reactions;
          }
        } catch (e) { console.warn('API call failed:', e); }
      }
    }

    return selected.map(id => this.generateFallback(id, context));
  }

  generateFallback(charId: string, context: string): Reaction {
    const ctx = context.toLowerCase();
    const pools: Record<string, Record<string, string[]>> = {
      child_young: {
        eat: ["This charoset is SO good!", "Mommy, I need a napkin!", "Can I have more?", "My tummy is happy!"],
        sing: ["DAY-DAY-ENU!", "Can we sing it again?", "I know this one!", "LOUDER!"],
        drink: ["The grape juice is yummy!", "I spilled a little..."],
        afikoman: ["I FOUND IT!", "What's my prize?? I want something BIG!", "That's not fair!"],
        plague: ["Frogs are cute though!", "Ewww, boils!", "Ten is a LOT!"],
        nishtana: ["Did I do good?? Did everyone hear me?", "I was so nervous!"],
        _: ["How much longer?", "I'm SO hungry!", "Can I sit on Saba's lap?", "What's happening now?", "I need to go to the bathroom."]
      },
      child_wicked: {
        eat: ["Finally, actual food.", "Savta, this is... actually pretty good. Don't tell anyone.", "The horseradish is trying to kill me."],
        sing: ["I'm not singing. ...OK fine, one verse.", "Uncle Moshe is making my ears bleed.", "Why is this song twelve minutes long?"],
        drink: ["Four cups? I respect the commitment.", "At least the wine is good."],
        afikoman: ["I knew where it was the whole time.", "An iPad was a reasonable ask.", "She can have it."],
        emotional: ["...OK that part got me a little. Don't look at me.", "I'm not crying, it's the horseradish."],
        plague: ["Death of the firstborn is pretty metal.", "The frogs one is iconic."],
        _: ["Are we still on Maggid?", "I could be on TikTok right now.", "This is... fine.", "How is it only 9:30?", "I have thoughts but I'll keep them to myself."]
      },
      child_simple: {
        eat: ["What's this green stuff?", "It's SO crunchy!", "Why is it flat?"],
        sing: ["Day-day... what are the words?", "I like the clapping part!"],
        elijah: ["I SEE HIM! Wait... that's a shadow.", "Did the cup move?! IT MOVED!", "Is Elijah invisible?"],
        plague: ["What's pestilence?", "Did the frogs go inside houses?", "Why is God angry?"],
        _: ["Why?", "But WHY though?", "What does that mean?", "Can I see?", "What's that?"]
      },
      child_wise: {
        eat: ["The Rambam has an interesting take on the required amount...", "In the Jerusalem Talmud, the order is different."],
        sing: ["This melody is 16th century Ashkenazi.", "Fifteen stanzas matching the fifteen steps."],
        plague: ["D'TzaKH ADaSH B'AHaV groups them by intensity.", "The Midrash says each plague lasted a month."],
        _: ["There's a deeper reading here...", "In the original Aramaic...", "My teacher says this connects to...", "Actually, the Tosafot disagree..."]
      },
      savta: {
        eat: ["It's good. My mother's was better, but it's good.", "You barely ate! Are you sick?", "I brought my own horseradish."],
        sing: ["That's not the right melody!", "Your grandfather had the most beautiful voice..."],
        emotional: ["My parents survived so we could sit here tonight.", "Every year I think of Mama...", "We are so blessed."],
        nishtana: ["She's an ANGEL! I need a tissue!", "My heart!"],
        drink: ["A little wine never hurt anyone. Pour me more."],
        _: ["In my day...", "Nobody appreciates this.", "Eat! You're too thin!", "Your grandfather used to say..."]
      },
      saba: {
        eat: ["Needs salt.", "I've eaten worse. In the army.", "This is good. What is it?"],
        sing: ["*hums slightly off-key*", "LOUDER! I can't hear!", "I remember this one! Wait, which one?"],
        emotional: ["*removes glasses quietly*", "We fought for this.", "When I was in the Sinai..."],
        nishtana: ["*tears up* She sounds just like Shira at that age..."],
        _: ["What?", "I wasn't sleeping!", "Eh?", "That was fast.", "In my day the Seder lasted until MIDNIGHT."]
      },
      uncle: {
        eat: ["Pass the EVERYTHING!", "This kugel is OUTSTANDING!", "More! There's more, right?"],
        sing: ["*FULL VOLUME*", "COME ON! I CAN'T HEAR YOU!", "That's the wrong tune! Follow ME!", "FROM THE TOP!"],
        drink: ["L'CHAIM!", "Four cups is a MINIMUM!"],
        _: ["This is the BEST part!", "Who wants more? I'm pouring.", "SING ALONG!"]
      },
      guest: {
        eat: ["What is this? It's delicious!", "The horseradish almost killed me.", "So we eat bread AND not-bread?"],
        sing: ["I don't know the words but I'm clapping!", "This song is a BANGER.", "Day-ay-new?"],
        drink: ["Four mandatory cups? That's a feature, not a bug."],
        emotional: ["I'm getting goosebumps.", "Thank you for inviting me. Seriously."],
        plague: ["There are TEN? And you memorize them?", "The wine spilling thing is so thoughtful."],
        elijah: ["Did the cup move or am I on cup three?", "Every family opens a door for the same prophet? Beautiful."],
        _: ["That's so interesting!", "I have so many questions.", "Should I be doing something?", "Is this the part where we eat?"]
      },
      mother: {
        eat: ["Everyone has enough?", "Noa, use your napkin.", "It came out good this year. I think."],
        sing: ["Eli, those are not the words.", "Moshe, you're drowning everyone out!"],
        nishtana: ["*tears streaming* My baby.", "She practiced for THREE WEEKS."],
        afikoman: ["No iPad. ABSOLUTELY not.", "Fine. Ice cream. ONE scoop."],
        _: ["Phones away. That means you, Daniel.", "Shhh!", "Does everyone have a Haggadah?", "Sit DOWN."]
      },
      father: {
        eat: ["You know what's interesting about charoset...", "This matzah is from the fancy box. Don't tell."],
        sing: ["This is my favorite!", "I think the key is different from what Moshe is singing..."],
        afikoman: ["I spent THREE DAYS planning this hiding spot.", "Deal. Final offer.", "The price of Afikoman prizes has inflated."],
        _: ["This is my favorite part!", "Interesting fact...", "Can I share a thought?", "Let me tell you what I read..."]
      },
      aunt: {
        eat: ["Shira, this is delicious!", "In my family we add dates to charoset."],
        sing: ["The melody is different from my family but I love it!"],
        _: ["I'm still learning the customs.", "Moshe, let someone else talk!", "That's beautiful.", "Can I help clear?"]
      },
      leader: {
        sing: ["Beautiful! Once more, with feeling!", "The melody comes from Cantor Rosenblatt."],
        nishtana: ["Noa'le, magnificent. Your great-grandmother would be proud."],
        emotional: ["*voice cracks* This part always...", "We are here. Against all odds."],
        _: ["Nu?", "Let us continue.", "Pay attention, this next part is crucial.", "A beautiful question."]
      }
    };

    const p = pools[charId] || pools['guest'];
    let cat = '_';
    for (const [key, _] of Object.entries(p)) {
      if (key !== '_' && ctx.includes(key)) { cat = key; break; }
    }
    const lines = p[cat] || p['_'] || ['...'];
    const key = `${charId}:${cat}`;
    if (!this.usedFallbacks.has(key)) this.usedFallbacks.set(key, new Set());
    const used = this.usedFallbacks.get(key)!;
    let avail = lines.map((_, i) => i).filter(i => !used.has(i));
    if (!avail.length) { used.clear(); avail = lines.map((_, i) => i); }
    const idx = avail[Math.floor(Math.random() * avail.length)];
    used.add(idx);
    return { speaker: charId, en: lines[idx], he: '' };
  }
}
