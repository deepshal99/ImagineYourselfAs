import requests

SUPABASE_URL = "https://syemomuztccylkgjpjsy.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZW1vbXV6dGNjeWxrZ2pwanN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Mzk4NDIsImV4cCI6MjA4MDAxNTg0Mn0.leWIAincqFnt7hzICS3f6rI6__O_KT8j2MBlY0HF_es"
RPC_URL = f"{SUPABASE_URL}/rest/v1/rpc/update_persona_prompt"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json"
}

UPDATES = [
    {
        "p_id": "movie_oppenheimer",
        "p_prompt": """Create a high-quality movie poster featuring the person in the uploaded image as a main character in the Oppenheimer universe.

CHARACTER INTEGRATION: Instead of just swapping a face, integrate the person into the 1940s world. Depict them as a high-ranking scientist or military official. Pay extreme attention to period-accurate hair styling, skin texture under dramatic shadow, and authentic 1940s clothing (wool suits, silk ties, military uniforms).

Visual Style & Vibe: Masterful 1940s historical drama. Signature elements: Massive nuclear test sites, towering Los Alamos silhouettes, blackboards filled with complex chalk calculations, glowing radioactive elements.

Composition: A tight, intense character portrait (waist up or headshot) against a background of high-stakes scientific tension.

Lighting & Color: Dramatic Chiaroscuro lighting (high contrast light and shadow). Use a rich, desaturated vintage color palette—deep ochres, charcoal grays, and warm skin tones, with a subtle film grain texture.

Atmosphere: Intellectual, ominous, and historically significant. The final result must look like a real photograph from the 1940s, not a digital edit."""
    }
]

# This will only work if the RPC exists and is executable by anon
for item in UPDATES:
    print(f"Updating {item['p_id']} via RPC...")
    r = requests.post(RPC_URL, headers=headers, json=item)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
