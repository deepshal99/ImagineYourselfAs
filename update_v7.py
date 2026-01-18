import requests

SUPABASE_URL = "https://syemomuztccylkgjpjsy.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZW1vbXV6dGNjeWxrZ2pwanN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Mzk4NDIsImV4cCI6MjA4MDAxNTg0Mn0.leWIAincqFnt7hzICS3f6rI6__O_KT8j2MBlY0HF_es"
REST_URL = f"{SUPABASE_URL}/rest/v1/discovered_personas"

headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
    "Content-Type": "application/json"
}

PROMPT_OPPEN = "TEST_UPDATE_OPPENHEIMER"

# Trying with exact ID, no quotes in payload
r = requests.patch(f"{REST_URL}?id=eq.movie_oppenheimer", headers=headers, json={"prompt": PROMPT_OPPEN})
print(f"Status: {r.status_code}")
print(f"Response Headers: {r.headers}")
print(f"Response: {r.text}")
