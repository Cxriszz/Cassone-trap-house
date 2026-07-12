-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create participants table
create table public.participants (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  start_location text,
  arrival_date text,
  departure_date text,
  transport_mode text,
  has_seats boolean default false,
  schlafplatz text,
  phone text,
  notes text,
  status text default 'Ausstehend',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.participants enable row level security;

-- Create policies (Allow everyone to read and insert, but only allow updates if needed)
-- Note: For a private event, we can allow open access for simplicity, or restrict it later.
create policy "Allow public read access"
  on public.participants for select
  using ( true );

create policy "Allow public insert access"
  on public.participants for insert
  with check ( true );

create policy "Allow public update access"
  on public.participants for update
  using ( true );

create policy "Allow public delete access"
  on public.participants for delete
  using ( true );

-- Create admins table to store admin numbers
create table public.admins (
  id uuid default uuid_generate_v4() primary key,
  phone text not null,
  is_primary boolean default false,
  receive_sms boolean default true
);

-- Enable RLS for admins
alter table public.admins enable row level security;
create policy "Allow public read access to admins"
  on public.admins for select using ( true );
create policy "Allow public insert to admins"
  on public.admins for insert with check ( true );
create policy "Allow public update to admins"
  on public.admins for update using ( true );
create policy "Allow public delete to admins"
  on public.admins for delete using ( true );

-- Insert default admin number (as an example)
insert into public.admins (phone, is_primary) values ('+49123456789', true);
