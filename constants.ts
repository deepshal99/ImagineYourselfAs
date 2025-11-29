import { Persona } from "./types.ts";

// STRICT PROMPT TEMPLATE
export const buildPrompt = (name: string, style: string) => 
  `Create a high-quality movie poster or cover art featuring this person as ${name}. Maintain the face identity exactly but completely change the clothing, background, and lighting to match this style: ${style}. The image should look like official promotional key art, highly detailed, dramatic lighting, 8k resolution.`;

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
    prompt: buildPrompt("Dune Warrior", "Official Dune movie poster style, wearing stillsuit desert armor, blue glowing eyes, vast sand dunes background with floating spice particles, cinematic gold and orange desert lighting, epic scale, center composition")
  },
  {
    id: "movie_batman",
    name: "The Dark Knight",
    category: "Movie",
    cover: "/personas/movie_batman.webp",
    prompt: buildPrompt("Gotham Vigilante", "The Dark Knight movie poster style, wearing high-tech black tactical armor, rainy Gotham City rooftop background, moody dark blue and black lighting, intense expression, rain droplets on armor, cinematic rim light")
  },
  {
    id: "movie_oppenheimer",
    name: "Oppenheimer",
    category: "Movie",
    cover: "/personas/movie_oppenheimer.webp",
    prompt: buildPrompt("Physics Professor", "Oppenheimer movie poster style, wearing 1940s suit and fedora, blackboard with equations background, vintage film grain, dramatic profile lighting, nuclear fire reflection in eyes, imax cinematography style")
  },
  {
    id: "movie_barbie",
    name: "Barbie World",
    category: "Movie",
    cover: "/personas/movie_barbie.webp",
    prompt: buildPrompt("Doll Character", "Barbie movie poster style, wearing bright pink stylish outfit, plastic fantastic pink world background, bright high-key lighting, perfect skin texture, pastel colors, fun and energetic vibe")
  },

  // --- SERIES ---
  {
    id: "series_stranger",
    name: "Stranger Things",
    category: "Series",
    cover: "/personas/series_stranger.webp",
    prompt: buildPrompt("80s Hero", "Official Stranger Things season poster, photorealistic cinematic photography, wearing 80s denim jacket, dark spooky forest background with red fog and floating particles, dramatic rim lighting, mysterious atmosphere, film grain, 8k resolution, NOT illustration")
  },
  {
    id: "series_thrones",
    name: "Game of Thrones",
    category: "Series",
    cover: "/personas/series_thrones.webp",
    prompt: buildPrompt("Northern Lord", "Game of Thrones character poster style, wearing heavy fur cloak and leather armor, sitting on Iron Throne or snowy Winterfell background, cold blue lighting, medieval fantasy vibe, sharp details")
  },
  {
    id: "series_squid",
    name: "Squid Game",
    category: "Series",
    cover: "/personas/series_squid.webp",
    prompt: buildPrompt("Player 456", "Squid Game promotional poster style, wearing green tracksuit with white number, playground background, eerie pastel lighting, intense survival drama vibe, high contrast")
  },
  {
    id: "series_breaking",
    name: "Breaking Bad",
    category: "Series",
    cover: "/personas/series_breaking.webp",
    prompt: buildPrompt("Chemistry Kingpin", "Breaking Bad series poster style, wearing yellow hazmat suit and gas mask (held in hand), rv lab background with blue smoke, gritty desert lighting, intense gaze, wide angle lens")
  },

  // --- YOUTUBE ---
  {
    id: "yt_mrbeast",
    name: "MrBeast Challenge",
    category: "YouTube",
    cover: "/personas/yt_mrbeast.webp",
    prompt: buildPrompt("YouTuber", "MrBeast youtube thumbnail style, shocked expression with open mouth, holding stacks of cash, bright blue background with lightning effects, high saturation, high contrast, outlines around person, 4k ultra hd")
  },
  {
    id: "yt_tech",
    name: "Tech Reviewer",
    category: "YouTube",
    cover: "/personas/yt_tech.webp",
    prompt: buildPrompt("Tech Reviewer", "MKBHD style youtube thumbnail, holding latest smartphone, futuristic studio background with RGB lights, professional clean lighting, sharp focus, 'REVIEW' text overlay style, shallow depth of field")
  }
];
