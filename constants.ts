import { Persona } from "./types.ts";

// STRICT PROMPT TEMPLATE
export const buildPrompt = (universe: string, style: string) => 
  `Create a high-quality movie poster featuring the person in the uploaded image as a main character in the ${universe} universe.
   
   CRITICAL INSTRUCTION: Analyze the uploaded person's gender and features. Generate a character design (costume, hair, styling) that fits them perfectly into this world. Do NOT force a specific existing character's identity if it conflicts with the user's appearance. The character should look like an original cast member.

   Visual Style & Vibe: ${style}.
   
   Maintain the face identity from the photo exactly, blending it seamlessly with the cinematic lighting and texture of the poster. High detail, 8k resolution, official key art style.`;

// Fallback generator
export const getFallbackCoverUrl = (prompt: string) => {
    const vibePrompt = `${prompt}. Atmospheric background, high quality, 8k, wallpaper, no people, photorealistic`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(vibePrompt)}?width=300&height=450&nologo=true&seed=42&model=flux`;
};

export const PERSONAS: Persona[] = [
  // --- MOVIES ---
  {
    id: "movie_dune",
    name: "Dune",
    category: "Movie",
    cover: "/personas/movie_dune.webp",
    prompt: buildPrompt("Dune", "Cinematic sci-fi desert aesthetic. Signature elements: Stillsuits, desert robes, vast sand dunes, spice particles, brutalist architecture, ornithopters. Lighting: Golden hour sun or cool blue shadows. Atmosphere: Epic, serious, mysterious.")
  },
  {
    id: "movie_batman",
    name: "The Dark Knight",
    category: "Movie",
    cover: "/personas/movie_batman.webp",
    prompt: buildPrompt("The Dark Knight", "Gritty realistic superhero noir. Signature elements: Tactical kevlar armor, long trench coats, Gotham City rooftops, rain, steam, gargoyles. Lighting: High contrast chiaroscuro, dark blues, blacks, sodium vapor orange. Atmosphere: Brooding, intense, cinematic.")
  },
  {
    id: "movie_oppenheimer",
    name: "Oppenheimer",
    category: "Movie",
    cover: "/personas/movie_oppenheimer.webp",
    prompt: buildPrompt("Oppenheimer", "1940s historical biopic drama. Signature elements: Period accurate suits, fedoras, laboratory settings, blackboards with equations, nuclear test sites. Lighting: High contrast black and white OR rich vintage color grading with film grain. Atmosphere: Intellectual, dramatic, tense.")
  },
  {
    id: "movie_barbie",
    name: "Barbie World",
    category: "Movie",
    cover: "/personas/movie_barbie.webp",
    prompt: buildPrompt("Barbie", "Plastic fantastic pop-surrealism. Signature elements: Over-the-top stylish pink outfits, dreamhouse architecture, perfectly groomed styling, plastic textures. Lighting: Bright, high-key, sunny, technicolor. Atmosphere: Fun, energetic, artificial perfection.")
  },

  // --- SERIES ---
  {
    id: "series_stranger",
    name: "Stranger Things",
    category: "Series",
    cover: "/personas/series_stranger.webp",
    prompt: buildPrompt("Stranger Things", "80s retro sci-fi horror. Signature elements: 80s fashion (denim, colorful shirts, vests), bicycles, flashlights, dark forests, The Upside Down (red lightning, spores, vines). Lighting: Neon reds and blues against deep shadows. Atmosphere: Nostalgic, spooky, adventurous.")
  },
  {
    id: "series_thrones",
    name: "Game of Thrones",
    category: "Series",
    cover: "/personas/series_thrones.webp",
    prompt: buildPrompt("Game of Thrones", "Medieval dark fantasy. Signature elements: Fur cloaks, leather armor, medieval gowns, valyrian steel swords, iron throne, snowy castles, dragons. Lighting: Cold winter light or warm torchlight. Atmosphere: Gritty, royal, dangerous.")
  },
  {
    id: "series_squid",
    name: "Squid Game",
    category: "Series",
    cover: "/personas/series_squid.webp",
    prompt: buildPrompt("Squid Game", "Dystopian survival thriller. Signature elements: Green tracksuits with player numbers, pink soldier jumpsuits with masks, colorful playground structures, minimal geometry. Lighting: Eerie pastel daylight or harsh institutional fluorescent. Atmosphere: Tense, psychological, surreal.")
  },
  {
    id: "series_breaking",
    name: "Breaking Bad",
    category: "Series",
    cover: "/personas/series_breaking.webp",
    prompt: buildPrompt("Breaking Bad", "Gritty crime drama. Signature elements: Yellow hazmat suits, gas masks, desert landscapes, RVs, green shirts, pork pie hats. Lighting: Harsh desert sun, yellow color grading, wide angles. Atmosphere: Intense, dangerous, raw.")
  },

  // --- YOUTUBE ---
  {
    id: "yt_mrbeast",
    name: "MrBeast Challenge",
    category: "YouTube",
    cover: "/personas/yt_mrbeast.webp",
    prompt: buildPrompt("MrBeast", "High-energy YouTube Thumbnail. Signature elements: Shocked or hyped facial expression, piles of cash, expensive cars, private islands, bold outlines, arrows. Lighting: Oversaturated, bright, high contrast studio lighting. Atmosphere: Chaotic, exciting, viral.")
  },
  {
    id: "yt_tech",
    name: "Tech Reviewer",
    category: "YouTube",
    cover: "/personas/yt_tech.webp",
    prompt: buildPrompt("Tech Reviewer", "Premium Tech YouTube channel. Signature elements: Holding latest high-tech gadgets (phones, cameras), clean matte black studio, RGB accent lights, carbon fiber textures. Lighting: Soft professional cinematic lighting, shallow depth of field. Atmosphere: Crisp, modern, authoritative.")
  }
];
