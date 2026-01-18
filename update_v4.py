import requests

SUPABASE_URL = "https://syemomuztccylkgjpjsy.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZW1vbXV6dGNjeWxrZ2pwanN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Mzk4NDIsImV4cCI6MjA4MDAxNTg0Mn0.leWIAincqFnt7hzICS3f6rI6__O_KT8j2MBlY0HF_es"
# Trying with full URL including schema
REST_URL = f"{SUPABASE_URL}/rest/v1/discovered_personas"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation" # Return the updated object
}

PROMPT_OPPEN = """Create a high-quality movie poster featuring the person in the uploaded image as a main character in the Oppenheimer universe.

CHARACTER INTEGRATION: Instead of just swapping a face, integrate the person into the 1940s world. Depict them as a high-ranking scientist or military official. Pay extreme attention to period-accurate hair styling, skin texture under dramatic shadow, and authentic 1940s clothing (wool suits, silk ties, military uniforms).

Visual Style & Vibe: Masterful 1940s historical drama. Signature elements: Massive nuclear test sites, towering Los Alamos silhouettes, blackboards filled with complex chalk calculations, glowing radioactive elements.

Composition: A tight, intense character portrait (waist up or headshot) against a background of high-stakes scientific tension.

Lighting & Color: Dramatic Chiaroscuro lighting (high contrast light and shadow). Use a rich, desaturated vintage color palette—deep ochres, charcoal grays, and warm skin tones, with a subtle film grain texture.

Atmosphere: Intellectual, ominous, and historically significant. The final result must look like a real photograph from the 1940s, not a digital edit."""

# Simple test update
r = requests.patch(f"{REST_URL}?id=eq.movie_oppenheimer", headers=headers, json={"prompt": PROMPT_OPPEN})
print(f"Status: {r.status_code}")
print(f"Response: {r.text}")
