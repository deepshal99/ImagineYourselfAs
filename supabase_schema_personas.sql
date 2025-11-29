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

-- Allow authenticated users (or service role) to insert
-- For now, allowing any authenticated user to "discover" helps the agent logic run client-side
create policy "Authenticated users can add personas"
  on discovered_personas for insert
  to authenticated
  with check ( true );

