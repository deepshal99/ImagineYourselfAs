import { Persona } from './types';

// STRICT PROMPT TEMPLATE
export const buildPrompt = (name: string, style: string) => 
  `Transform this person into a ${name}. Maintain the face identity but completely change the clothing, background, and lighting to match this style: ${style}. Use centered portrait composition, 50mm lens look, shallow depth of field, photorealistic texture.`;

// Base model: Neutral, realistic, "iPhone photo" style to ensure diversity in results
const BASE_MODEL = "a raw iphone photo of a handsome young Indian man, well groomed, short beard, neutral expression, looking at camera, realistic skin texture, no filter";

// Fallback generator if local file is missing (used by Agent as well)
export const getFallbackCoverUrl = (name: string, style: string) => {
  const promptForCover = `Transform ${BASE_MODEL} into a ${name}. Maintain the face identity but completely change the clothing, background, and lighting to match this style: ${style}. Use centered portrait composition, 50mm lens look, shallow depth of field, photorealistic texture.`;
  // Use flux for best quality
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(promptForCover)}?width=300&height=450&nologo=true&seed=42&model=flux`;
};

// Massive list based on your requests
export const PERSONAS: Persona[] = [
  // --- MOVIE & SERIES POSTERS ---
  {
    id: "stranger_things_poster",
    name: "Stranger Things",
    category: "Artistic",
    cover: "/personas/stranger_things_poster.jpg",
    prompt: buildPrompt("Stranger Things Poster Character", "80s retro horror poster style, neon red glowing fog, shadowy monster silhouette in background, wearing 80s denim jacket, frightened but heroic expression, synthwave color palette")
  },
  {
    id: "inception_poster",
    name: "Inception",
    category: "Futuristic",
    cover: "/personas/inception_poster.jpg",
    prompt: buildPrompt("Inception Movie Poster", "mind-bending cityscape folding onto itself in background, wearing sharp grey suit, holding a spinning top, dramatic blue and orange color grading, dream-like atmosphere")
  },
  {
    id: "black_mirror_poster",
    name: "Black Mirror",
    category: "Futuristic",
    cover: "/personas/black_mirror_poster.jpg",
    prompt: buildPrompt("Black Mirror Episode", "dystopian sci-fi aesthetic, cracked glass screen effect overlay, wearing futuristic minimal clothing, cold sterile lighting, technological horror vibe, glitch effects")
  },
  {
    id: "predestination_poster",
    name: "Time Traveler",
    category: "Artistic",
    cover: "/personas/predestination_poster.jpg",
    prompt: buildPrompt("Predestination Poster", "noir time travel mystery style, shadows covering half face, wearing trench coat and fedora, clock gears faint overlay, moody sepia and blue lighting, mysterious gaze")
  },
  {
    id: "avengers_endgame",
    name: "Avengers Hero",
    category: "Fantasy",
    cover: "/personas/avengers_endgame.jpg",
    prompt: buildPrompt("Avengers Poster", "epic superhero ensemble style, wearing quantum realm suit or high-tech armor, cosmic galaxy background with debris, heroic rim lighting, intense determination")
  },
  {
    id: "dune_poster",
    name: "Dune Warrior",
    category: "Futuristic",
    cover: "/personas/dune_poster.jpg",
    prompt: buildPrompt("Dune Movie Poster", "wearing stillsuit desert armor, blue glowing eyes (spice effect), vast sand dunes background, floating spice particles, cinematic gold and orange desert lighting")
  },
  {
    id: "money_heist",
    name: "The Professor",
    category: "Modern",
    cover: "/personas/money_heist.jpg",
    prompt: buildPrompt("Money Heist Character", "wearing red jumpsuit and Dali mask (held in hand), bank vault background with floating money, dramatic heist movie lighting, rebellious vibe")
  },

  // --- POLITICS & LEADERS ---
  {
    id: "indian_pm",
    name: "The PM",
    category: "Historical",
    cover: "/personas/indian_pm.jpg",
    prompt: buildPrompt("Indian Prime Minister", "wearing signature half-sleeve kurta and jacket (Modi vest), well-groomed white beard style, standing at a podium, indian flag colors in background blur, charismatic leadership vibe")
  },
  {
    id: "us_president",
    name: "The President",
    category: "Historical",
    cover: "/personas/us_president.jpg",
    prompt: buildPrompt("US President", "wearing a navy blue suit, red tie, american flag pin, white house background, blonde hair styling, confident presidential pose")
  },
  
  // --- CHARACTERS ---
  {
    id: "jack_sparrow",
    name: "Pirate Captain",
    category: "Fantasy",
    cover: "/personas/jack_sparrow.jpg",
    prompt: buildPrompt("Jack Sparrow", "wearing pirate captain hat, dreadlocks with beads, heavy eyeliner, caribbean beach background, holding a compass, eccentric expression")
  },
  {
    id: "superman",
    name: "Man of Steel",
    category: "Fantasy",
    cover: "/personas/superman.jpg",
    prompt: buildPrompt("Superman", "wearing blue kryptonian suit with red cape and S symbol, hovering in the sky, clouds background, heroic lighting, wind in hair")
  },
  {
    id: "avenger_iron",
    name: "Iron Hero",
    category: "Futuristic",
    cover: "/personas/avenger_iron.jpg",
    prompt: buildPrompt("Tony Stark", "wearing high-tech nanotechnology suit, glowing arc reactor on chest, hud display reflection on face, futuristic lab background, goatee beard")
  },
  {
    id: "bollywood_don",
    name: "Bollywood Don",
    category: "Artistic",
    cover: "/personas/bollywood_don.jpg",
    prompt: buildPrompt("Bollywood Don", "wearing cool sunglasses, leather jacket, slow motion walk away from explosion, intense swag, cinematic teal and orange lighting")
  },

  // --- SPORTS ---
  {
    id: "lando_norris",
    name: "F1 Star",
    category: "Modern",
    cover: "/personas/lando_norris.jpg",
    prompt: buildPrompt("F1 Driver", "wearing mclaren orange racing suit, holding a helmet, race track paddock background, cap, sporty and youthful vibe")
  },
  {
    id: "football_legend",
    name: "Football Legend",
    category: "Modern",
    cover: "/personas/football_legend.jpg",
    prompt: buildPrompt("Footballer", "wearing striped football jersey (argentina or barcelona style), stadium lights background, sweat on face, victorious expression")
  },
  {
    id: "cricket_icon",
    name: "Cricket Icon",
    category: "Modern",
    cover: "/personas/cricket_icon.jpg",
    prompt: buildPrompt("Cricket Batsman", "wearing blue india cricket jersey, helmet off, holding bat on shoulder, stadium crowd background, intense sports lighting")
  },

  // --- LIFESTYLE & SCENES ---
  {
    id: "beach_vacation",
    name: "Beach Vacation",
    category: "Aesthetic",
    cover: "/personas/beach_vacation.jpg",
    prompt: buildPrompt("Vacationer", "wearing unbuttoned tropical floral shirt, sunglasses, maldives ocean background, bright sunlight, relaxed holiday vibe, cocktail in hand")
  },
  {
    id: "wedding_groom",
    name: "Indian Groom",
    category: "Historical",
    cover: "/personas/wedding_groom.jpg",
    prompt: buildPrompt("Indian Groom", "wearing grand sherwani with embroidery, turban (sehra), flower garland, royal wedding mandap background, golden lighting")
  },
  {
    id: "magazine_cover",
    name: "Vogue Cover",
    category: "Artistic",
    cover: "/personas/magazine_cover.jpg",
    prompt: buildPrompt("Supermodel", "high fashion editorial shot, bold outfit, studio lighting, text overlay style of a magazine cover, sharp cheekbones, confident gaze")
  },
  {
    id: "ceo_forbes",
    name: "Tech Billionaire",
    category: "Modern",
    cover: "/personas/ceo_forbes.jpg",
    prompt: buildPrompt("Tech CEO", "wearing simple black t-shirt, arms crossed, silicon valley office glass background, confident smirk, forbes photoshoot style")
  },
  {
    id: "monk_peace",
    name: "Zen Monk",
    category: "Aesthetic",
    cover: "/personas/monk_peace.jpg",
    prompt: buildPrompt("Buddhist Monk", "wearing saffron robes, bald or shaved head, sitting in meditation in a garden, soft sunlight, peaceful serene expression")
  },
  {
    id: "singer_concert",
    name: "Pop Star",
    category: "Artistic",
    cover: "/personas/singer_concert.jpg",
    prompt: buildPrompt("Pop Singer", "holding a microphone, performing on stage, dramatic spotlight, smoke effects, emotional singing expression, concert atmosphere")
  },
  {
    id: "saree_glam",
    name: "Saree Glam",
    category: "Historical",
    cover: "/personas/saree_glam.jpg",
    prompt: buildPrompt("Saree Model", "wearing a luxurious silk saree, traditional jewelry, bindis, temple background or royal palace, elegant cinematic lighting")
  },
  {
    id: "suit_corporate",
    name: "Corporate Sharp",
    category: "Modern",
    cover: "/personas/suit_corporate.jpg",
    prompt: buildPrompt("Corporate Executive", "wearing a tailored three-piece suit, tie, luxury watch, skyscraper boardroom background, power pose, succesful vibe")
  },
  {
    id: "chef_ramsay",
    name: "Head Chef",
    category: "Modern",
    cover: "/personas/chef_ramsay.jpg",
    prompt: buildPrompt("Head Chef", "wearing crisp white chef whites, apron, crossing arms, busy kitchen background with flames, stern perfectionist expression")
  }
];