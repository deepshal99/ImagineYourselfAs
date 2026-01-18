import requests
import json

SUPABASE_URL = "https://syemomuztccylkgjpjsy.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZW1vbXV6dGNjeWxrZ2pwanN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Mzk4NDIsImV4cCI6MjA4MDAxNTg0Mn0.leWIAincqFnt7hzICS3f6rI6__O_KT8j2MBlY0HF_es"
REST_URL = f"{SUPABASE_URL}/rest/v1/discovered_personas"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json"
}

UPDATES = [
    {
        "id": "movie_oppenheimer",
        "prompt": """Create a high-quality movie poster featuring the person in the uploaded image as a main character in the Oppenheimer universe.

CHARACTER INTEGRATION: Instead of just swapping a face, integrate the person into the 1940s world. Depict them as a high-ranking scientist or military official. Pay extreme attention to period-accurate hair styling, skin texture under dramatic shadow, and authentic 1940s clothing (wool suits, silk ties, military uniforms).

Visual Style & Vibe: Masterful 1940s historical drama. Signature elements: Massive nuclear test sites, towering Los Alamos silhouettes, blackboards filled with complex chalk calculations, glowing radioactive elements.

Composition: A tight, intense character portrait (waist up or headshot) against a background of high-stakes scientific tension.

Lighting & Color: Dramatic "Chiaroscuro" lighting (high contrast light and shadow). Use a rich, desaturated vintage color palette—deep ochres, charcoal grays, and warm skin tones, with a subtle film grain texture.

Atmosphere: Intellectual, ominous, and historically significant. The final result must look like a real photograph from the 1940s, not a digital edit."""
    },
    {
        "id": "movie_fast",
        "prompt": """Create a high-quality movie poster featuring the person in the uploaded image as a main character in the Fast & Furious universe.

CHARACTER INTEGRATION: Integrate the person as a core member of the street-racing crew. Focus on a "hero pose" that feels grounded and authentic. Style the character in functional but cool street gear (fitted muscle shirts, leather jackets, tactical pants). The face should be lit by the ambient glow of high-performance car LEDs and streetlights.

Visual Style & Vibe: High-octane street racing blockbuster. Signature elements: Blur of speeding muscle cars, glowing neon city streets, chrome textures, heat haze, and family-dinner silhouettes.

Composition: A dynamic, low-angle "power shot" of the character. Background should feature a custom high-performance car with motion blur.

Lighting & Color: Glossy, high-contrast lighting with "Golden Hour" sun glares or vibrant cyan and magenta street neon. The skin should have a realistic sweat/sheen texture common in action films.

Atmosphere: Adrenaline-fueled, cool, and loyal. The final result must look like a raw, high-resolution still from a multimillion-dollar action sequence."""
    }
]

def update():
    for item in UPDATES:
        print(f"Updating {item['id']}...")
        r = requests.patch(f"{REST_URL}?id=eq.{item['id']}", headers=headers, json={"prompt": item['prompt']})
        print(f"  Status: {r.status_code}")

if __name__ == "__main__":
    update()
