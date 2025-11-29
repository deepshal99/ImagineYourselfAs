create table discovered_personas (
  id text primary key,
  name text not null,
  category text not null,
  cover text not null,
  prompt text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table discovered_personas enable row level security;

-- Allow everyone to read
create policy "Everyone can see discovered personas"
  on discovered_personas for select
  using ( true );

-- Restrict insert to service_role only (no policy for authenticated users)
-- This ensures only the admin script (using service key) can add new personas
