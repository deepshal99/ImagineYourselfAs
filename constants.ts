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
    prompt: buildPrompt("Harry Potter", "Cinematic poster-style transformation inside the Wizarding World universe. The character should match the user's gender. Signature elements may appear naturally: magical sparks, floating candles, castle stone halls, robes, wands, enchanted ambience. Lighting: warm torchlight or cool moonlit magic. Atmosphere: wondrous, historical, whimsical, cinematic."
)
  },

  {
    id: "movie_minecraft",
    name: "A Minecraft Movie",
    category: "Movie",
    cover: "/personas/movie_minecraft.webp",
    prompt: buildPrompt("Minecraft Movie", "Live-action adaptation of Minecraft aesthetic. Signature elements: Realistic textures on blocky geometry, blue sheep, piglins, crafting tables, Steve's blue shirt, Overworld landscape with blocky trees and mountains. Lighting: Bright, cinematic outdoor lighting, vibrant colors. Atmosphere: Adventurous, quirky, surreal.")
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
  // --- NEW ADDITIONS ---
  {
    id: "movie_fast",
    name: "Fast & Furious",
    category: "Movie",
    cover: "/personas/movie_fast.webp",
    prompt: buildPrompt("Fast & Furious", "High-octane action blockbuster. Signature elements: Muscle cars, street racing scenes, tank tops, cross necklaces, family gatherings, explosions. Lighting: Glossy, high-contrast, sun-drenched Miami or gritty street neon. Atmosphere: Intense, cool, family-oriented, adrenaline-fueled.")
  },
  {
    id: "movie_dictator",
    name: "The Dictator",
    category: "Movie",
    cover: "/personas/movie_dictator.webp",
    prompt: buildPrompt("The Dictator", "Satirical comedy. Signature elements: Extravagant military uniform with excessive medals, big beard, dark sunglasses, golden palace background, Wadiya flag. Lighting: Bright, sunny, opulent gold tones. Atmosphere: Comedic, outrageous, royal, absurd.")
  },
  {
    id: "movie_jurassic",
    name: "Jurassic Park",
    category: "Movie",
    cover: "/personas/movie_jurassic.webp",
    prompt: buildPrompt("Jurassic Park", "Sci-fi adventure. Signature elements: Khaki safari gear, raincoats, flares, jungle ferns, T-Rex or Raptors lurking in background, iconic park gates. Lighting: Moody rainstorm darkness or bright tropical sun. Atmosphere: Awe-inspiring, terrifying, primal, epic.")
  },
  {
    id: "series_money",
    name: "Money Heist",
    category: "Series",
    cover: "/personas/series_money.webp",
    prompt: buildPrompt("Money Heist (La Casa de Papel)", "Heist thriller. Signature elements: Red jumpsuits, Dali masks, Bank of Spain interior, floating money, weapons, team grouping. Lighting: Dramatic, high contrast, warm reddish tones. Atmosphere: Rebellious, tense, strategic, passionate.")
  },
  {
    id: "series_alice",
    name: "Alice in Borderland",
    category: "Series",
    cover: "/personas/series_alice.webp",
    prompt: buildPrompt("Alice in Borderland", "Survival thriller. Signature elements: Dystopian deserted Tokyo streets, playing cards floating in air, survival gear, intense expressions, lasers. Lighting: Neon lights against abandoned city darkness. Atmosphere: Desperate, psychological, high-stakes, surreal.")
  },
  {
    id: "series_mirzapur",
    name: "Mirzapur",
    category: "Series",
    cover: "/personas/series_mirzapur.webp",
    prompt: buildPrompt("Mirzapur", "Indian crime thriller. Signature elements: Rugged kurtas, shawls, aviator sunglasses, guns (desi kattas), carpets (kaleen), throne chair. Lighting: Warm, dusty, interior yellow bulbs or harsh sunlight. Atmosphere: Raw, power-hungry, violent, rustic.")
  },
  {
    id: "series_panchayat",
    name: "Panchayat",
    category: "Series",
    cover: "/personas/series_panchayat.webp",
    prompt: buildPrompt("Panchayat", "Indian comedy-drama. Signature elements: Casual checked shirts, village office (Panchayat Bhawan) background, water tank, lauki (bottle gourd), rustic village setting. Lighting: Bright natural daylight, simple and unpretentious. Atmosphere: Heartwarming, funny, simple, realistic.")
  },
  {
    id: "series_familyman",
    name: "The Family Man",
    category: "Series",
    cover: "/personas/series_familyman.webp",
    prompt: buildPrompt("The Family Man", "Espionage thriller. Signature elements: Generic middle-class office shirt but holding a gun hidden, Mumbai local train or city chaos background, TASC badge. Lighting: Gritty, realistic, slightly desaturated or blue-tinted. Atmosphere: Tense, dual-life, action-packed, grounded.")
  },

  // --- GAMES ---
  {
    id: "game_minecraft",
    name: "Minecraft",
    category: "Other",
    cover: "/personas/game_minecraft.webp",
    prompt: buildPrompt("Minecraft Game", "Voxel sandbox game aesthetic. Signature elements: Pixelated textures, blocky character model, diamond armor, sword/pickaxe, creeper in background, nether portal or village. Lighting: Bright day cycle or torch-lit cave darkness. Atmosphere: Creative, survival, blocky, retro-modern.")
  },
  {
    id: "game_valorant",
    name: "Valorant",
    category: "Other",
    cover: "/personas/game_valorant.webp",
    prompt: buildPrompt("Valorant", "Transform into a new Valorant agent with unique style and implied abilities, Cinematic poster-style portrait of agent matching the user's gender; rendering must strictly follow official Riot Games Valorant art style, include authentic Valorant poster composition with diagonal shards, layered graphic map shapes, crisp color blocking, stylized UI accents, signature elements may appear such as agent ability motifs; final result must look like a real Valorant agent." 




)
  },
  {
    id: "game_cs",
    name: "Counter-Strike",
    category: "Other",
    cover: "/personas/game_cs.webp",
    prompt: buildPrompt("CS:GO / CS2 / Counter-Strike", "Realistic tactical shooter aesthetic. Signature elements: Tactical vests, helmets, AK-47 or M4A4, Dust II or Mirage map background, smoke grenades, bomb defusal kit. Lighting: Realistic outdoor sun or harsh industrial lighting. Atmosphere: Intense, gritty, military, competitive.")
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
