// Character type definitions and default configurations

export interface Character {
  id: string;
  name: string;
  gender: 'M' | 'F';
  age: 'child' | 'teen' | 'young' | 'adult' | 'elder';
  role: string;
  pitch: number;      // Web Speech API pitch (0.5 = deep, 1.8 = high)
  rate: number;       // Web Speech API rate (0.7 = slow, 1.2 = fast)
  color: number;      // Clothing color (hex)
  skin: number;       // Skin tone (hex)
  hair: number;       // Hair color (hex)
  hairType: 'short' | 'long' | 'bald' | 'short_curly';
  kippah?: boolean;
  beard?: boolean;
  bodyW: number;      // Body width
  bodyH: number;      // Body height
  headS: number;      // Head scale (children have bigger heads)
  profilePath: string; // Path to personality markdown file
}

export const DEFAULT_CHARACTERS: Character[] = [
  { id: "leader", name: "Rabbi David", gender: "M", age: "elder", role: "Seder Leader", pitch: 0.7, rate: 0.85, color: 0xF5F5DC, skin: 0xCBA882, hair: 0xAAAAAA, hairType: "bald", kippah: true, beard: true, bodyW: 0.19, bodyH: 0.50, headS: 1.0, profilePath: "/characters/leader.md" },
  { id: "mother", name: "Shira", gender: "F", age: "adult", role: "Mother", pitch: 1.05, rate: 0.9, color: 0x8B4582, skin: 0xD2A679, hair: 0x4A2F1C, hairType: "long", bodyW: 0.15, bodyH: 0.46, headS: 1.0, profilePath: "/characters/mother.md" },
  { id: "father", name: "Avi", gender: "M", age: "adult", role: "Father", pitch: 0.85, rate: 0.88, color: 0x2F4F4F, skin: 0xBE8C63, hair: 0x3B2F1C, hairType: "short", kippah: true, bodyW: 0.19, bodyH: 0.52, headS: 1.0, profilePath: "/characters/father.md" },
  { id: "savta", name: "Savta Esther", gender: "F", age: "elder", role: "Grandmother", pitch: 0.9, rate: 0.8, color: 0x800020, skin: 0xCBA882, hair: 0xC0C0C0, hairType: "short_curly", bodyW: 0.16, bodyH: 0.44, headS: 1.0, profilePath: "/characters/savta.md" },
  { id: "saba", name: "Saba Yosef", gender: "M", age: "elder", role: "Grandfather", pitch: 0.65, rate: 0.78, color: 0x2C2C54, skin: 0xC49B6C, hair: 0xAAAAAA, hairType: "bald", kippah: true, beard: true, bodyW: 0.18, bodyH: 0.46, headS: 1.0, profilePath: "/characters/saba.md" },
  { id: "child_young", name: "Noa", gender: "F", age: "child", role: "Youngest (Ma Nishtana)", pitch: 1.7, rate: 1.1, color: 0xFF69B4, skin: 0xDEB887, hair: 0x5C3317, hairType: "long", bodyW: 0.10, bodyH: 0.32, headS: 1.3, profilePath: "/characters/child-youngest.md" },
  { id: "child_wise", name: "Yael", gender: "F", age: "teen", role: "Wise Child", pitch: 1.25, rate: 0.95, color: 0x2E8B57, skin: 0xD2A679, hair: 0x3B2F1C, hairType: "long", bodyW: 0.13, bodyH: 0.42, headS: 1.1, profilePath: "/characters/child-wise.md" },
  { id: "child_wicked", name: "Dani", gender: "M", age: "teen", role: "Rebellious Child", pitch: 1.15, rate: 1.0, color: 0x1C1C1C, skin: 0xBE8C63, hair: 0x2B1F14, hairType: "short", bodyW: 0.15, bodyH: 0.44, headS: 1.1, profilePath: "/characters/child-wicked.md" },
  { id: "child_simple", name: "Eli", gender: "M", age: "child", role: "Simple Child", pitch: 1.6, rate: 1.05, color: 0x4169E1, skin: 0xDEB887, hair: 0x5C3317, hairType: "short", kippah: true, bodyW: 0.10, bodyH: 0.33, headS: 1.3, profilePath: "/characters/child-simple.md" },
  { id: "uncle", name: "Dod Moshe", gender: "M", age: "adult", role: "Uncle (Loud Singer)", pitch: 0.9, rate: 0.92, color: 0x556B2F, skin: 0xC49B6C, hair: 0x2B1F14, hairType: "short", kippah: true, bodyW: 0.20, bodyH: 0.52, headS: 1.0, profilePath: "/characters/uncle.md" },
  { id: "aunt", name: "Doda Leah", gender: "F", age: "young", role: "Aunt (New to family)", pitch: 1.15, rate: 0.95, color: 0xB8860B, skin: 0xBE8C63, hair: 0x8B4513, hairType: "long", bodyW: 0.14, bodyH: 0.46, headS: 1.0, profilePath: "/characters/aunt.md" },
  { id: "guest", name: "Ben", gender: "M", age: "young", role: "Non-Jewish Friend", pitch: 1.0, rate: 0.95, color: 0x708090, skin: 0xD2A679, hair: 0x463E2E, hairType: "short", kippah: true, bodyW: 0.17, bodyH: 0.50, headS: 1.0, profilePath: "/characters/guest.md" },
];

// Lookup map
export const charMap: Record<string, Character> = {};
DEFAULT_CHARACTERS.forEach(c => charMap[c.id] = c);
