-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Drop existing resources to rebuild cleanly if needed
drop trigger if exists on_participant_change on public.participants;
drop function if exists public.notify_sms_trigger();
drop function if exists public.verify_admin(text);
drop function if exists public.get_participants_admin(text);
drop function if exists public.get_admin_settings_admin(text);
drop function if exists public.update_participant_status_admin(text, uuid, text);
drop function if exists public.delete_participant_admin(text, uuid);
drop function if exists public.save_admin_settings_admin(text, text, text, text, boolean);
drop function if exists public.get_participant_by_id(uuid);
drop function if exists public.register_participant_guest(text, text, text, text, text, boolean, text, text, boolean, text);
drop function if exists public.update_participant_guest(uuid, text, text, text, text, text, boolean, text, text, boolean, text);
drop table if exists public.admin_secrets cascade;
drop table if exists public.participants cascade;
drop table if exists public.admins cascade;

-- Create participants table
create table public.participants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  start_location text,
  arrival_date text,
  departure_date text,
  transport_mode text,
  has_seats boolean default false,
  schlafplatz text,
  phone text,
  hide_phone boolean default false,
  notes text,
  status text default 'Ausstehend',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create admins table to store admin numbers
create table public.admins (
  id uuid default gen_random_uuid() primary key,
  phone text not null,
  is_primary boolean default false,
  receive_sms boolean default true
);

-- Create admin_secrets table (strictly database-only, no RLS policies)
create table public.admin_secrets (
  id integer primary key default 1 check (id = 1),
  password_hash text not null
);

-- Insert default admin credentials (bcrypt hash of 'cassone2026')
insert into public.admin_secrets (password_hash)
values (extensions.crypt('cassone2026', extensions.gen_salt('bf')));

-- Enable RLS for all tables
alter table public.participants enable row level security;
alter table public.admins enable row level security;
alter table public.admin_secrets enable row level security;

-- RLS Policies: Lock tables completely from direct public mutation
-- Anon can only SELECT public columns of participants
revoke all on public.participants from anon;
grant select (name, start_location, arrival_date, departure_date, transport_mode, has_seats, schlafplatz, status, notes, created_at) on public.participants to anon;

-- Anon has NO direct access to admins or admin_secrets
revoke all on public.admins from anon;
revoke all on public.admin_secrets from anon;

-- Create select policy to satisfy RLS for granted columns
create policy "Allow select on public columns" on public.participants
  for select
  using ( true );

-- =========================================================================
-- DATABASE FUNCTIONS & SECURITY DEFINERS (RPCs)
-- =========================================================================

-- Helper to verify admin password
create or replace function public.verify_admin(entered_password text)
returns boolean
language plpgsql
security definer
as $$
declare
  is_valid boolean;
begin
  select (password_hash = extensions.crypt(entered_password, password_hash)) into is_valid
  from public.admin_secrets
  where id = 1;
  return coalesce(is_valid, false);
end;
$$;

-- Guest Signup RPC
create or replace function public.register_participant_guest(
  p_name text,
  p_start_location text,
  p_arrival_date text,
  p_departure_date text,
  p_transport_mode text,
  p_has_seats boolean,
  p_schlafplatz text,
  p_phone text,
  p_hide_phone boolean,
  p_notes text
)
returns uuid
language plpgsql
security definer
as $$
declare
  new_id uuid;
  formatted_phone text;
begin
  -- Keep only digits and '+'
  formatted_phone := regexp_replace(p_phone, '[^0-9+]', '', 'g');
  
  if formatted_phone like '00%' then
    formatted_phone := '+' || substr(formatted_phone, 3);
  elsif formatted_phone like '0%' then
    formatted_phone := '+49' || substr(formatted_phone, 2);
  elsif not (formatted_phone like '+%') then
    formatted_phone := '+49' || formatted_phone;
  end if;

  insert into public.participants (
    name,
    start_location,
    arrival_date,
    departure_date,
    transport_mode,
    has_seats,
    schlafplatz,
    phone,
    hide_phone,
    notes,
    status
  ) values (
    p_name,
    p_start_location,
    p_arrival_date,
    p_departure_date,
    p_transport_mode,
    p_has_seats,
    p_schlafplatz,
    formatted_phone,
    p_hide_phone,
    p_notes,
    'Ausstehend'
  )
  returning id into new_id;
  
  return new_id;
end;
$$;

-- Guest Fetch by ID RPC
create or replace function public.get_participant_by_id(participant_id uuid)
returns table (
  id uuid,
  name text,
  start_location text,
  arrival_date text,
  departure_date text,
  transport_mode text,
  has_seats boolean,
  schlafplatz text,
  phone text,
  hide_phone boolean,
  notes text,
  status text,
  created_at timestamp with time zone
)
language plpgsql
security definer
as $$
begin
  return query select p.id, p.name, p.start_location, p.arrival_date, p.departure_date, p.transport_mode, p.has_seats, p.schlafplatz, p.phone, p.hide_phone, p.notes, p.status, p.created_at
               from public.participants p
               where p.id = participant_id;
end;
$$;

-- Guest Edit RPC
create or replace function public.update_participant_guest(
  participant_id uuid,
  p_name text,
  p_start_location text,
  p_arrival_date text,
  p_departure_date text,
  p_transport_mode text,
  p_has_seats boolean,
  p_schlafplatz text,
  p_phone text,
  p_hide_phone boolean,
  p_notes text
)
returns void
language plpgsql
security definer
as $$
declare
  old_status text;
  new_status text;
  formatted_phone text;
begin
  select status into old_status from public.participants where id = participant_id;
  
  if old_status is null then
    raise exception 'Participant not found';
  end if;
  
  if old_status = 'Genehmigt' then
    new_status := 'Ausstehend';
  else
    new_status := old_status;
  end if;

  formatted_phone := regexp_replace(p_phone, '[^0-9+]', '', 'g');
  if formatted_phone like '00%' then
    formatted_phone := '+' || substr(formatted_phone, 3);
  elsif formatted_phone like '0%' then
    formatted_phone := '+49' || substr(formatted_phone, 2);
  elsif not (formatted_phone like '+%') then
    formatted_phone := '+49' || formatted_phone;
  end if;

  update public.participants
  set
    name = p_name,
    start_location = p_start_location,
    arrival_date = p_arrival_date,
    departure_date = p_departure_date,
    transport_mode = p_transport_mode,
    has_seats = p_has_seats,
    schlafplatz = p_schlafplatz,
    phone = formatted_phone,
    hide_phone = p_hide_phone,
    notes = p_notes,
    status = new_status
  where id = participant_id;
end;
$$;

-- Admin View Participants RPC
create or replace function public.get_participants_admin(admin_password text)
returns table (
  id uuid,
  name text,
  start_location text,
  arrival_date text,
  departure_date text,
  transport_mode text,
  has_seats boolean,
  schlafplatz text,
  phone text,
  hide_phone boolean,
  notes text,
  status text,
  created_at timestamp with time zone
)
language plpgsql
security definer
as $$
begin
  if public.verify_admin(admin_password) then
    return query select p.id, p.name, p.start_location, p.arrival_date, p.departure_date, p.transport_mode, p.has_seats, p.schlafplatz, p.phone, p.hide_phone, p.notes, p.status, p.created_at
                 from public.participants p
                 order by p.created_at asc;
  else
    raise exception 'Invalid admin password';
  end if;
end;
$$;

-- Admin View Settings RPC
create or replace function public.get_admin_settings_admin(admin_password text)
returns table (
  id uuid,
  phone text,
  hide_phone boolean,
  is_primary boolean,
  receive_sms boolean
)
language plpgsql
security definer
as $$
begin
  if public.verify_admin(admin_password) then
    return query select a.id, a.phone, false as hide_phone, a.is_primary, a.receive_sms
                 from public.admins a
                 order by a.id asc;
  else
    raise exception 'Invalid admin password';
  end if;
end;
$$;

-- Admin Update Participant Status RPC
create or replace function public.update_participant_status_admin(admin_password text, participant_id uuid, new_status text)
returns void
language plpgsql
security definer
as $$
begin
  if public.verify_admin(admin_password) then
    update public.participants
    set status = new_status
    where id = participant_id;
  else
    raise exception 'Invalid admin password';
  end if;
end;
$$;

-- Admin Delete Participant RPC
create or replace function public.delete_participant_admin(admin_password text, participant_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if public.verify_admin(admin_password) then
    delete from public.participants
    where id = participant_id;
  else
    raise exception 'Invalid admin password';
  end if;
end;
$$;

-- Admin Save Settings RPC
create or replace function public.save_admin_settings_admin(
  admin_password text,
  phone1 text,
  phone2 text,
  phone3 text,
  notify boolean
)
returns void
language plpgsql
security definer
as $$
begin
  if public.verify_admin(admin_password) then
    delete from public.admins;
    
    if phone1 is not null and phone1 <> '' then
      insert into public.admins (phone, is_primary, receive_sms) values (phone1, true, notify);
    end if;
    if phone2 is not null and phone2 <> '' then
      insert into public.admins (phone, is_primary, receive_sms) values (phone2, false, notify);
    end if;
    if phone3 is not null and phone3 <> '' then
      insert into public.admins (phone, is_primary, receive_sms) values (phone3, false, notify);
    end if;
  else
    raise exception 'Invalid admin password';
  end if;
end;
$$;

-- =========================================================================
-- DATABASE BACKGROUND SMS NOTIFICATION TRIGGER
-- =========================================================================

create or replace function public.notify_sms_trigger()
returns trigger
language plpgsql
security definer
as $$
declare
  sms_url text := 'https://cqeqfiuswdvpokgznwpk.supabase.co/functions/v1/send-sms';
  sms_token text := 'secret_cassone_sms_token_2026';
  admin_rec record;
  msg text;
  edit_link text;
  primary_admin text := '';
  req_headers text;
  origin text := 'https://casa-cassone.vercel.app';
begin
  -- Resolve request origin for guest edit links
  req_headers := current_setting('request.headers', true);
  if req_headers is not null then
    origin := coalesce(req_headers::jsonb->>'origin', origin);
  end if;

  -- 1. On INSERT: Notify admins and Guest
  if TG_OP = 'INSERT' then
    -- Notify admins
    for admin_rec in select phone from public.admins where receive_sms = true loop
      msg := 'Neue Buchung von ' || new.name || '. Bitte prüfen!';
      begin
        perform net.http_post(
          url := sms_url,
          headers := jsonb_build_object('Content-Type', 'application/json', 'X-SMS-API-KEY', sms_token),
          body := jsonb_build_object('to', admin_rec.phone, 'body', msg)
        );
      exception when others then
        raise warning 'SMS failed for admin %: %', admin_rec.phone, SQLERRM;
      end;
    end loop;
    
    -- Notify guest with link
    edit_link := origin || '/?edit=' || new.id;
    select phone into primary_admin from public.admins where is_primary = true limit 1;
    msg := 'Cassone: Buchung eingegangen! Dein Status ist in Bearbeitung. Kontakt: ' || coalesce(primary_admin, '-') || '. Bearbeiten/Löschen: ' || edit_link;
    
    begin
      perform net.http_post(
        url := sms_url,
        headers := jsonb_build_object('Content-Type', 'application/json', 'X-SMS-API-KEY', sms_token),
        body := jsonb_build_object('to', new.phone, 'body', msg)
      );
    exception when others then
      raise warning 'SMS failed for guest: %', SQLERRM;
    end;

  -- 2. On UPDATE: Notify admins on edits, and Guest on status changes
  elsif TG_OP = 'UPDATE' then
    -- Guest edited (status went from Approved back to Pending)
    if old.status = 'Genehmigt' and new.status = 'Ausstehend' then
      for admin_rec in select phone from public.admins where receive_sms = true loop
        msg := new.name || ' hat den Eintrag bearbeitet. Status wieder auf Ausstehend gesetzt!';
        begin
          perform net.http_post(
            url := sms_url,
            headers := jsonb_build_object('Content-Type', 'application/json', 'X-SMS-API-KEY', sms_token),
            body := jsonb_build_object('to', admin_rec.phone, 'body', msg)
          );
        exception when others then
          raise warning 'SMS failed for admin %: %', admin_rec.phone, SQLERRM;
        end;
      end loop;
    
    -- Admin approved or rejected
    elsif old.status != new.status and new.status in ('Genehmigt', 'Abgelehnt') then
      msg := 'Hallo ' || new.name || ', deine Buchung wurde: ' || (case when new.status = 'Genehmigt' then 'Genehmigt' else 'Abgelehnt' end) || '!';
      begin
        perform net.http_post(
          url := sms_url,
          headers := jsonb_build_object('Content-Type', 'application/json', 'X-SMS-API-KEY', sms_token),
          body := jsonb_build_object('to', new.phone, 'body', msg)
        );
      exception when others then
        raise warning 'SMS failed for guest: %', SQLERRM;
      end;
    end if;
  end if;
  
  return new;
end;
$$;

-- Create the background SMS trigger
create trigger on_participant_change
  after insert or update on public.participants
  for each row execute function public.notify_sms_trigger();

-- Insert default admin record so guest SMS has a contact number out-of-the-box
insert into public.admins (phone, is_primary) values ('+4917612345678', true);
