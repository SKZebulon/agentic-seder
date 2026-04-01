# 🕯️ The Agentic Seder

**A fully autonomous, AI-powered 3D Passover Seder experience.**

Press play and watch 12 animated characters conduct a complete orthodox Seder — every blessing, every reading, every song — in Hebrew and English, with spoken audio. Characters have distinct genders, ages, appearances, and **AI-generated personalities** that make every viewing unique.

> *"In every generation, a person must see themselves as if they personally left Egypt."*
> This year, the AI is at the table too.

## 🎬 How It Works

This is not a slideshow. It's an **agentic experience**.

1. **You press play.** The Seder runs itself.
2. **12 characters sit around a 3D table** — rabbi, parents, grandparents, four children, uncle, aunt, and a guest.
3. **The Haggadah flows autonomously** — blessings in Hebrew, translations in English, spoken aloud via Web Speech API.
4. **At key moments, the AI generates dialogue** — each character has a personality profile (markdown file) that the AI reads to generate in-character reactions.
5. **Every viewing is different** — because the AI generates fresh dialogue each time.
6. **You can customize the characters** — edit the markdown personality files to match your real family.

## 🏗 Architecture

```
Director (state machine)
├── Liturgy beats → Fixed Haggadah text (Hebrew + English)
├── Action beats → Character animations (drink, eat, stand, sing)
└── Reaction slots → AI reads personality files → generates dialogue
    ├── Claude API for generation
    └── Fallback patterns for offline mode
```

## 📂 Project Structure

```
agentic-seder/
├── public/characters/        # ← EDIT THESE! Personality markdown files
│   ├── leader.md             # Rabbi David — Seder Leader
│   ├── mother.md             # Shira — the logistics engine
│   ├── father.md             # Avi — hides the Afikoman
│   ├── savta.md              # Grandmother — everything was better in her day
│   ├── saba.md               # Grandfather — falls asleep, denies it
│   ├── child-youngest.md     # Noa (8) — sings Ma Nishtana
│   ├── child-wise.md         # Yael (16) — the studious one
│   ├── child-wicked.md       # Dani (15) — sarcastic but secretly cares
│   ├── child-simple.md       # Eli (6) — "what is this?"
│   ├── uncle.md              # Dod Moshe — SINGS AT MAX VOLUME
│   ├── aunt.md               # Doda Leah — new to the family
│   └── guest.md              # Ben — first Seder ever
├── src/
│   ├── data/
│   │   ├── characters.ts     # Character definitions (appearance, voice)
│   │   └── haggadah-script.ts # The full Seder script
│   ├── engine/
│   │   ├── director.ts       # The brain — drives everything
│   │   ├── audio.ts          # Web Speech API wrapper
│   │   └── dialogue.ts       # AI dialogue generation
│   └── components/           # React/Three.js components
├── package.json
└── README.md
```

## 🎭 Character Profiles

Each character is defined by a **markdown file** that the AI reads to generate dialogue. Here's what makes them tick:

| Character | Personality | Why They're Funny |
|-----------|------------|-------------------|
| **Savta Esther** | Compares everything to her mother's Seder | "It's good. My mother's was better, but it's good." |
| **Saba Yosef** | Falls asleep, denies it | "I wasn't sleeping! I was thinking with my eyes closed." |
| **Dani** | Sarcastic teen, secretly moved | Gets caught singing Dayenu after eye-rolling all night |
| **Noa** | 8 years old, HUNGRY | Negotiates iPad for Afikoman, settles for ice cream |
| **Eli** | 6 years old, everything is new | 100% certain he saw Elijah drink from the cup |
| **Uncle Moshe** | SINGS AT MAXIMUM VOLUME | Other characters actively try to out-sing him |
| **Ben** | Non-Jewish friend, first Seder | "So it's like... religious hide and seek?" |

**Edit the markdown files to match YOUR family.** Change names, ages, quirks, personality traits — the AI adapts.

## 🕎 Ashkenazi / Sephardi

Toggle between traditions on the start screen. Changes include:
- Different melodies referenced in dialogue
- Sephardi customs (e.g., hitting each other with scallions during Dayenu)
- Uncle Moshe remembers Morocco vs. asking about kneidlach

## 🚀 Getting Started

```bash
git clone https://github.com/skzebulon/agentic-seder.git
cd agentic-seder
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables (optional)

**Use server-only names** (no `NEXT_PUBLIC_` prefix). Keys with `NEXT_PUBLIC_` are embedded in the browser bundle and can be stolen.

```bash
# .env.local (or Vercel → Environment Variables)
ANTHROPIC_API_KEY=your_claude_key          # AI dialogue via /api/dialogue
ELEVENLABS_API_KEY=your_elevenlabs_key     # optional; natural voices via /api/elevenlabs
```

Without `ANTHROPIC_API_KEY`, the app uses built-in fallback dialogue — still fun, just not AI-generated.

**Local `npm run dev`:** Environment variables from Vercel are **not** applied automatically. Copy the same keys into **`.env.local`** in the project root (you can duplicate from `.env.example`), then restart the dev server. Until then, dialogue falls back to scripted lines and audio uses the browser’s built-in speech (not ElevenLabs).

## 🔊 Audio

Audio uses the **Web Speech API** — free, built into every browser, no API key needed.

- Each character has a unique voice (different pitch + rate)
- Hebrew speech works in Chrome (Google Hebrew) and Safari (Carmit)
- English/Hebrew/Both toggle on the start screen
- Mute button if you prefer to just read

### Upgrading Audio

| Phase | Technology | Quality | Cost |
|-------|-----------|---------|------|
| v1 (current) | Web Speech API | OK | Free |
| v2 | Google Cloud TTS | Good | Free tier |
| v3 | ElevenLabs | Amazing | ~$5/mo |

## 📱 Social Media

Designed to be clipped and shared. Key viral moments:
- 🎵 The AI sings Dayenu (everyone waving arms)
- 📱 Dani's phone gets confiscated
- 😴 Saba falls asleep and gets pranked
- 🔍 Noa negotiates for the Afikoman prize
- 🚪 Opening the door for Elijah
- 💪 "Next Year in Jerusalem" — everyone standing

## 🤝 Contributing

1. **Add characters** — create a new markdown file in `public/characters/`
2. **Improve personalities** — edit existing markdown files
3. **Add traditions** — Sephardi, Mizrachi, Yemenite, Ethiopian customs
4. **Better audio** — help integrate ElevenLabs or Google TTS
5. **Add songs** — pre-rendered audio files for Dayenu, Chad Gadya, etc.
6. **More Haggadah** — the script covers the key sections; help add every line

## 📜 License

MIT — use it, remix it, bring it to your Seder table.

## ✡️ Credits

- Haggadah text from [Sefaria](https://www.sefaria.org) (CC-BY-SA)
- Built with [Three.js](https://threejs.org), [Next.js](https://nextjs.org), and [Claude](https://anthropic.com)
- Character profiles inspired by every Jewish family everywhere

---

*Chag Pesach Sameach! 🍷*

*Built by [Adam Solomon](https://github.com/skzebulon) — OpenVet / Special Character LLC*
