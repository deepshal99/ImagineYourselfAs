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
    name: "Barbie The Movie",
    category: "Movie",
    cover: "/personas/movie_barbie.webp",
    prompt: buildPrompt("Barbie (2023 Movie)", "Margot Robbie style live-action movie aesthetic. Signature elements: Western pink cowgirl/cowboy outfits or pink gingham dresses, plastic textures mixed with real fabrics, 'Barbieland' pastel architecture, blue sky with painted clouds, pink convertibles. Lighting: Bright, sunny, high-key studio lighting with a soft dreamlike glow. Atmosphere: Fun, feminist, self-aware, cinematic pop-art.")
  },
  {
    id: "movie_f1",
    name: "F1 Racing",
    category: "Movie",
    cover: "/personas/movie_f1.webp",
    prompt: buildPrompt("F1 Racing Movie", "High-octane motorsport cinematic style. Signature elements: Professional racing suit with sponsor logos, holding a racing helmet, pit lane or race track background, motion blur of cars. Lighting: Harsh sunlight or dramatic stadium floodlights. Atmosphere: Adrenaline, speed, intense focus, competitive.")
  },
  {
    id: "movie_harrypotter",
    name: "Harry Potter",
    category: "Movie",
    cover: "/personas/movie_harrypotter.webp",
    prompt: buildPrompt("Wizarding World", "Magical fantasy academy aesthetic. Signature elements: Hogwarts house robes (Gryffindor/Slytherin style), wands, floating candles, magical sparks, ancient stone castle background. Lighting: Warm torchlight or mysterious moonlight. Atmosphere: Magical, wondrous, historical, whimsical.")
  },

  // --- SERIES ---
  {
    id: "series_stranger",
    name: "Stranger Things",
    category: "Series",
    cover: "/personas/series_stranger.webp",
    prompt: buildPrompt("Stranger Things", "sci-fi horror. Signature elements: 80s fashion similar to stranger things characters, bicycles, flashlights, dark forests, The Upside Down (red lightning, spores, vines), mysterious demogorgon-like creature in background, Lighting: Neon reds and blues against deep shadows. Atmosphere: Nostalgic, spooky, adventurous, NOT Illustration")
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
  {
    id: "series_friends",
    name: "Friends",
    category: "Series",
    cover: "/personas/series_friends.webp",
    prompt: buildPrompt("Friends (90s Sitcom)", "Classic 90s sitcom aesthetic. Signature elements: 90s casual fashion (denim vests, turtlenecks, oversized sweaters), coffee mugs, Central Perk orange couch background or NYC apartment. Lighting: Warm, cozy, high-key sitcom lighting. Atmosphere: Friendly, nostalgic, cheerful, ensemble cast vibe.")
  },
  {
    id: "series_office",
    name: "The Office",
    category: "Series",
    cover: "/personas/series_office.webp",
    prompt: buildPrompt("The Office (US)", "Mockumentary workplace comedy. Signature elements: Business casual office wear (ties, button-downs), Dunder Mifflin office background, looking directly at the camera (breaking the fourth wall). Lighting: Flat, realistic fluorescent office lighting. Atmosphere: Awkward, mundane, comedic, deadpan.")
  },
  {
    id: "series_twd",
    name: "The Walking Dead",
    category: "Series",
    cover: "/personas/series_twd.webp",
    prompt: buildPrompt("The Walking Dead", "Post-apocalyptic survival horror. Signature elements: Grimy survival clothes, tactical gear, weapons (crossbow/revolver), sweat and dirt textures, abandoned overgrown streets or forest background. Lighting: Desaturated, gritty, high contrast, golden hour dust. Atmosphere: Desperate, rugged, intense survival.")
  },
  {
    id: "series_bcs",
    name: "Better Call Saul",
    category: "Series",
    cover: "/personas/series_bcs.webp",
    prompt: buildPrompt("Better Call Saul", "Legal tragicomedy noir. Signature elements: Colorful flashy suits OR clean lawyer attire, desert background or courtroom, scales of justice. Lighting: Dramatic noir shadows or sun-bleached desert brightness, unique camera angles. Atmosphere: Slick, cunning, moral ambiguity.")
  },
  {
    id: "series_tmkoc",
    name: "TMKOC",
    category: "Series",
    cover: "/personas/series_tmkoc.webp",
    prompt: buildPrompt("Tarak Mehta Ka Ooltah Chashmah", "Indian sitcom style. Signature elements: Vibrant colorful traditional or casual Indian clothing, Gokuldham society compound background. Lighting: Very bright, high saturation, flat TV lighting. Atmosphere: Joyful, chaotic, family-friendly, expressive.")
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
