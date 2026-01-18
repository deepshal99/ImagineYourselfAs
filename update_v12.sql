-- Force update via SQL with EXACT text
DROP POLICY IF EXISTS "personas_admin_update" ON public.discovered_personas;
CREATE POLICY "personas_admin_update" ON public.discovered_personas FOR UPDATE TO anon USING (true) WITH CHECK (true);

UPDATE public.discovered_personas 
SET prompt = 'Create a high-quality movie poster featuring the person in the uploaded image as a main character in the Oppenheimer universe.

CHARACTER INTEGRATION: Instead of just swapping a face, integrate the person into the 1940s world. Depict them as a high-ranking scientist or military official. Pay extreme attention to period-accurate hair styling, skin texture under dramatic shadow, and authentic 1940s clothing (wool suits, silk ties, military uniforms).

Visual Style & Vibe: Masterful 1940s historical drama. Signature elements: Massive nuclear test sites, towering Los Alamos silhouettes, blackboards filled with complex chalk calculations, glowing radioactive elements.

Composition: A tight, intense character portrait (waist up or headshot) against a background of high-stakes scientific tension.

Lighting & Color: Dramatic Chiaroscuro lighting (high contrast light and shadow). Use a rich, desaturated vintage color palette—deep ochres, charcoal grays, and warm skin tones, with a subtle film grain texture.

Atmosphere: Intellectual, ominous, and historically significant. The final result must look like a real photograph from the 1940s, not a digital edit.'
WHERE id = 'movie_oppenheimer';

UPDATE public.discovered_personas 
SET prompt = 'Create a high-quality movie poster featuring the person in the uploaded image as a main character in the Fast & Furious universe.

CHARACTER INTEGRATION: Integrate the person as a core member of the street-racing crew. Focus on a hero pose that feels grounded and authentic. Style the character in functional but cool street gear (fitted muscle shirts, leather jackets, tactical pants). The face should be lit by the ambient glow of high-performance car LEDs and streetlights.

Visual Style & Vibe: High-octane street racing blockbuster. Signature elements: Blur of speeding muscle cars, glowing neon city streets, chrome textures, heat haze, and family-dinner silhouettes.

Composition: A dynamic, low-angle power shot of the character. Background should feature a custom high-performance car with motion blur.

Lighting & Color: Glossy, high-contrast lighting with Golden Hour sun glares or vibrant cyan and magenta street neon. The skin should have a realistic sweat/sheen texture common in action films.

Atmosphere: Adrenaline-fueled, cool, and loyal. The final result must look like a raw, high-resolution still from a multimillion-dollar action sequence.'
WHERE id = 'movie_fast';

DROP POLICY IF EXISTS "personas_admin_update" ON public.discovered_personas;
