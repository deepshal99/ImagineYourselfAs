-- Migration: Add 15 new personas
-- Author: Antigravity
-- Date: 2026-01-20

-- Upsert function to make adding easier and idempotent
CREATE OR REPLACE FUNCTION upsert_persona(
    p_id TEXT,
    p_name TEXT,
    p_category TEXT,
    p_prompt TEXT,
    p_display_order INTEGER
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.discovered_personas (id, name, category, prompt, display_order, is_visible, created_at, updated_at)
    VALUES (
        p_id, 
        p_name, 
        p_category, 
        p_prompt, 
        p_display_order,
        true, -- Always visible
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        prompt = EXCLUDED.prompt,
        display_order = EXCLUDED.display_order,
        is_visible = true, -- Re-enable if hidden
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 1. The Godfather
SELECT upsert_persona(
    'movie_godfather',
    'The Godfather',
    'Movie',
    'Create a movie poster for "The Godfather" featuring the person in the uploaded image as the Don.

CRITICAL INSTRUCTION: Analyze the uploaded person''s gender and features. Generate a character design (tuxedo, red rose in lapel, shadowy office setting) that fits them perfectly into the Corleone family. The character should command respect and power.

Visual Style & Vibe: Francis Ford Coppola''s masterpiece. Low-key lighting (chiaroscuro), warm amber and brown tones, intense shadows, vintage 1940s aesthetic. Atmosphere: Menacing, elegant, powerful, dramatic.

Maintain the face identity from the photo exactly. High detail, 8k resolution, official key art style.',
    100
);

-- 2. Anaconda (2025)
SELECT upsert_persona(
    'movie_anaconda_2025',
    'Anaconda',
    'Movie',
    'Create a movie poster for the 2025 reimagining of "Anaconda" featuring the person in the uploaded image as a rugged explorer.

CRITICAL INSTRUCTION: Analyze the uploaded person''s gender and features. Generate a character design (sweaty skin, mud-stained explorer gear, utility vest) in a dense Amazonian rainforest. A massive, terrifying giant snake scale or eye should be visible in the background or foreground, implying danger.

Visual Style & Vibe: High-octane survival thriller. Green and murky yellow color palette, wet textures, intense sunlight breaking through canopy, cinematic motion blur. Atmosphere: Tense, humid, dangerous, action-packed.

Maintain the face identity from the photo exactly. High detail, 8k resolution, official key art style.',
    101
);

-- 3. Black Mirror
SELECT upsert_persona(
    'series_black_mirror',
    'Black Mirror',
    'Series',
    'Create a promotional poster for "Black Mirror" featuring the person in the uploaded image.

CRITICAL INSTRUCTION: Analyze the uploaded person''s gender and features. Generate a character design that reflects a near-future dystopia. Perhaps they are holding a cracked device, or have a subtle digital glitch effect on part of their clothing, or are staring blankly into a screen.

Visual Style & Vibe: Tech-dystopia. Cold blues, greys, and blacks. Reflection effects, cracked glass motifs, sterile environments vs. dark reality. Atmosphere: Unsettling, psychological, futuristic, cynical.

Maintain the face identity from the photo exactly. High detail, 8k resolution, official key art style.',
    102
);

-- 4. The Last of Us
SELECT upsert_persona(
    'series_last_of_us',
    'The Last of Us',
    'Series',
    'Create a poster for "The Last of Us" featuring the person in the uploaded image as a survivor.

CRITICAL INSTRUCTION: Analyze the uploaded person''s gender and features. Generate a character design (worn flannel or tactical jacket, backpack, dirt and grime on face) in a post-apocalyptic city overgrown with nature. Cordyceps fungi details in the background.

Visual Style & Vibe: Naughty Dog / HBO aesthetic. Earthy tones (greens, browns, greys), soft diffused lighting, overgrown ruins. Atmosphere: Emotional, gritty, survivalist, beautiful decay.

Maintain the face identity from the photo exactly. High detail, 8k resolution, official key art style.',
    103
);

-- 5. Peaky Blinders
SELECT upsert_persona(
    'series_peaky_blinders',
    'Peaky Blinders',
    'Series',
    'Create a poster for "Peaky Blinders" featuring the person in the uploaded image as a Shelby family member.

CRITICAL INSTRUCTION: Analyze the uploaded person''s gender and features. Generate a character design (1920s three-piece wool suit, newsboy cap/flat cap, overcoat) walking through the smoky streets of Birmingham.

Visual Style & Vibe: Industrial cool. High contrast, desaturated colors with pops of fire orange/gold, smoke, fog, industrial soot. Atmosphere: Badass, vintage, gritty, stylish.

Maintain the face identity from the photo exactly. High detail, 8k resolution, official key art style.',
    104
);

-- 6. Now You See Me
SELECT upsert_persona(
    'movie_now_you_see_me',
    'Now You See Me',
    'Movie',
    'Create a movie poster for "Now You See Me" featuring the person in the uploaded image as a master illusionist.

CRITICAL INSTRUCTION: Analyze the uploaded person''s gender and features. Generate a character design (sleek modern clothing, leather jacket or suit) performing a magic trick (floating cards, light illusion, or handcuffs). The Horsemen symbol/eye logo in the background.

Visual Style & Vibe: Modern magic heist. Neon blues and purples, lens flares, dynamic angles, floating particles. Atmosphere: Mysterious, energetic, clever, showman-like.

Maintain the face identity from the photo exactly. High detail, 8k resolution, official key art style.',
    105
);

-- 7. Blade Runner
SELECT upsert_persona(
    'movie_blade_runner',
    'Blade Runner',
    'Movie',
    'Create a movie poster for "Blade Runner" featuring the person in the uploaded image as a Blade Runner or Replicant.

CRITICAL INSTRUCTION: Analyze the uploaded person''s gender and features. Generate a character design (futuristic trench coat, high collar, possibly transparent plastic rain gear) standing in a soaked, neon-lit cyberpunk street.

Visual Style & Vibe: Cyberpunk noir. Neon pinks, cyans, and deep shadows. Rain, wet pavement reflections, holograms in background. Atmosphere: Melancholic, futuristic, visually stunning.

Maintain the face identity from the photo exactly. High detail, 8k resolution, official key art style.',
    106
);

-- 8. Dark Matter (Apple TV)
SELECT upsert_persona(
    'series_dark_matter',
    'Dark Matter',
    'Series',
    'Create a poster for "Dark Matter" (Apple TV+) featuring the person in the uploaded image traveling the multiverse.

CRITICAL INSTRUCTION: Analyze the uploaded person''s gender and features. Generate a character design (modern casual or scientific gear) standing in the "Box" corridor—an infinite hallway of doors.

Visual Style & Vibe: Sci-fi mystery. Cold sterile greys, symmetrical composition, infinite perspective, soft creepy lighting. Atmosphere: Mind-bending, tense, scientific, lonely.

Maintain the face identity from the photo exactly. High detail, 8k resolution, official key art style.',
    107
);

-- 9. Emily in Paris
SELECT upsert_persona(
    'series_emily_in_paris',
    'Emily in Paris',
    'Series',
    'Create a poster for "Emily in Paris" featuring the person in the uploaded image living their best life in Paris.

CRITICAL INSTRUCTION: Analyze the uploaded person''s gender and features. Generate a character design (bold, colorful high-fashion outfit, beret or chic hat) with the Eiffel Tower or a charming Parisian cafe in the background.

Visual Style & Vibe: Romantic comedy chic. Bright, vibrant colors, soft flattering lighting, dreamy aesthetics. Atmosphere: Fun, romantic, fashionable, optimistic.

Maintain the face identity from the photo exactly. High detail, 8k resolution, official key art style.',
    108
);

-- 10. The Big Bang Theory
SELECT upsert_persona(
    'series_big_bang_theory',
    'Big Bang Theory',
    'Series',
    'Create a poster for "The Big Bang Theory" featuring the person in the uploaded image as a member of the gang.

CRITICAL INSTRUCTION: Analyze the uploaded person''s gender and features. Generate a character design (geek culture t-shirt, layers, maybe glasses) sitting on the famous couch or standing in the apartment with a whiteboard of equations behind them.

Visual Style & Vibe: Sitcom brightness. High-key lighting, warm colors, busy detailed background (comics, collectibles). Atmosphere: Smart, funny, geeky, friendly.

Maintain the face identity from the photo exactly. High detail, 8k resolution, official key art style.',
    109
);

-- 11. Wednesday (Update existing)
SELECT upsert_persona(
    'series_wednesday',
    'Wednesday',
    'Series',
    'Create a movie poster for the Netflix series "WEDNESDAY" featuring the person in the uploaded image as a student at Nevermore Academy.

CRITICAL INSTRUCTION: Analyze the uploaded person''s gender and features. Generate a character design (Nevermore uniform - purple/black stripes, gothic styling) that fits them perfectly into this world.

Visual Style & Vibe: Tim Burton''s gothic teen aesthetic. Black, white, and deep purple styling. Gothic architecture, foggy background, perhaps Thing (the hand) on their shoulder. Atmosphere: Dark, witty, macabre, mysterious.

Maintain the face identity from the photo exactly. High detail, 8k resolution, official key art style.',
    110
);

-- 12. Mission: Impossible (2025)
SELECT upsert_persona(
    'movie_mission_impossible_2025',
    'Mission: Impossible',
    'Movie',
    'Create a movie poster for "Mission: Impossible" featuring the person in the uploaded image as an IMF agent.

CRITICAL INSTRUCTION: Analyze the uploaded person''s gender and features. Generate a character design (tactical stealth gear or sleek suit) in a high-stakes action pose (running, jumping, or hanging from a wire).

Visual Style & Vibe: Spy thriller. Blue and orange color grading, motion blur, sparks, fuse burning wick graphic element. Atmosphere: Intense, fast-paced, explosive.

Maintain the face identity from the photo exactly. High detail, 8k resolution, official key art style.',
    111
);

-- 13. Inception
SELECT upsert_persona(
    'movie_inception',
    'Inception',
    'Movie',
    'Create a movie poster for "Inception" featuring the person in the uploaded image as a dream architect.

CRITICAL INSTRUCTION: Analyze the uploaded person''s gender and features. Generate a character design (sharp business suit) standing in a city that is folding onto itself in the sky. Maybe holding a spinning top.

Visual Style & Vibe: Mind-bending thriller. Steel blues, greys, surreal architecture, impossible geometry. Atmosphere: Intelligent, surreal, epic, dreamlike.

Maintain the face identity from the photo exactly. High detail, 8k resolution, official key art style.',
    112
);

-- 14. Vikings
SELECT upsert_persona(
    'series_vikings',
    'Vikings',
    'Series',
    'Create a poster for "Vikings" featuring the person in the uploaded image as a legendary Norse warrior.

CRITICAL INSTRUCTION: Analyze the uploaded person''s gender and features. Generate a character design (leather armor, fur, shield, war paint/dirt) standing on a rocky shore with longships in the background.

Visual Style & Vibe: Historical epic. Desaturated, cold blue/grey color palette, gritty textures, mist and rain. Atmosphere: Brutal, epic, primal, warrior-like.

Maintain the face identity from the photo exactly. High detail, 8k resolution, official key art style.',
    113
);

-- 15. Spartacus
SELECT upsert_persona(
    'series_spartacus',
    'Spartacus',
    'Series',
    'Create a poster for "Spartacus" featuring the person in the uploaded image as a gladiator or rebel.

CRITICAL INSTRUCTION: Analyze the uploaded person''s gender and features. Generate a character design (gladiator armor, red cape, sword) in the sandy arena. Note: Kept tasteful but gritty.

Visual Style & Vibe: Graphic novel style violence/action. High contrast, hyper-real stylized blood splatter effects (artistic), golden sunlight mixed with dirt and sweat. Atmosphere: Visceral, heroic, intense.

Maintain the face identity from the photo exactly. High detail, 8k resolution, official key art style.',
    114
);

-- Clean up definition
DROP FUNCTION upsert_persona;
