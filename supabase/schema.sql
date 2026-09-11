-- ==============================================================================
-- CampusBorrow Database Schema & Security Configuration
-- ==============================================================================

-- 1. Extensions
create extension if not exists pgcrypto;

-- 2. Types & Enums
do $$ begin
  create type item_type as enum ('need', 'offer');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type item_status as enum (
    'open',
    'claimed',
    'borrowed',
    'returned',
    'closed'
  );
exception
  when duplicate_object then null;
end $$;

-- 3. Application Table: items
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  claimed_by uuid
    references auth.users(id)
    on delete set null,

  type item_type not null,

  title text not null,

  description text not null,

  category text not null,

  location text not null,

  contact text not null,

  image_url text,

  status item_status not null default 'open',

  expires_at date,

  created_at timestamptz not null default now()
);

-- 4. Indexes for fast query performance
create index if not exists idx_items_created_at on public.items (created_at desc);
create index if not exists idx_items_type on public.items (type);
create index if not exists idx_items_status on public.items (status);
create index if not exists idx_items_category on public.items (category);
create index if not exists idx_items_user_id on public.items (user_id);
create index if not exists idx_items_claimed_by on public.items (claimed_by);

-- 5. Row Level Security (RLS)
alter table public.items enable row level security;

-- Policy: SELECT - Anyone, including anonymous users, can read all items
drop policy if exists "Anyone can read items" on public.items;
create policy "Anyone can read items"
  on public.items
  for select
  using (true);

-- Policy: INSERT - Only authenticated users can insert items for themselves
drop policy if exists "Authenticated users can create items" on public.items;
create policy "Authenticated users can create items"
  on public.items
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and status = 'open'
    and claimed_by is null
  );

-- Policy: UPDATE - Owner can update item content and status transitions
drop policy if exists "Owners can update their items" on public.items;
create policy "Owners can update their items"
  on public.items
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      -- Prevent owner from changing ownership
      user_id = (select i.user_id from public.items i where i.id = items.id)
    )
  );

-- Policy: DELETE - Only the item owner can delete the item
drop policy if exists "Owners can delete their items" on public.items;
create policy "Owners can delete their items"
  on public.items
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- 6. Atomic Secure Claiming RPC Function
-- This function runs with SECURITY DEFINER to atomically verify and update the item
-- while preventing race conditions (using SELECT FOR UPDATE).
create or replace function public.claim_item(item_id uuid)
returns public.items
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid;
  target_item public.items;
begin
  -- Identify the caller
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Authentication required to claim an item.';
  end if;

  -- Lock row to guarantee atomicity and avoid concurrent claims
  select * into target_item
  from public.items
  where id = item_id
  for update;

  -- Check item exists
  if not found then
    raise exception 'Item not found.';
  end if;

  -- Check item is open
  if target_item.status <> 'open' or target_item.claimed_by is not null then
    raise exception 'This item is no longer available to be claimed.';
  end if;

  -- Check caller is not the owner
  if target_item.user_id = caller_id then
    raise exception 'You cannot claim your own item.';
  end if;

  -- Atomically update item
  update public.items
  set
    claimed_by = caller_id,
    status = 'claimed'
  where id = item_id
  returning * into target_item;

  return target_item;
end;
$$;

-- Grant execution permissions
grant execute on function public.claim_item(uuid) to authenticated;

-- 7. Realtime Configuration
-- Enable realtime publication for items table
do $$ begin
  alter publication supabase_realtime add table public.items;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- 8. Storage Configuration (Bucket and Policies)
-- Insert storage bucket 'item-images' if not already existing
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  true,
  5242880, -- 5 MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage Policies for item-images bucket
drop policy if exists "Public images are accessible to all" on storage.objects;
create policy "Public images are accessible to all"
  on storage.objects for select
  using (bucket_id = 'item-images');

drop policy if exists "Authenticated users can upload item images" on storage.objects;
create policy "Authenticated users can upload item images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update their own item images" on storage.objects;
create policy "Users can update their own item images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete their own item images" on storage.objects;
create policy "Users can delete their own item images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'item-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
