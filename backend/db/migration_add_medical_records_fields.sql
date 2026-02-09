-- Add missing columns to medical_records to match API usage
-- Run this in Supabase SQL Editor if medical_records already exists.

alter table public.medical_records
  add column if not exists photo_url text,
  add column if not exists updated_at timestamptz not null default now();

do $$
declare
  users_id_type text;
begin
  select data_type
  into users_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'users'
    and column_name = 'id';

  if users_id_type is null then
    users_id_type := 'uuid';
  end if;

  execute format(
    'alter table public.medical_records add column if not exists updated_by %s references public.users(id) on delete set null',
    users_id_type
  );
end $$;
