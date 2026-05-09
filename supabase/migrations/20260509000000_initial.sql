-- SwipeMarket: profiles, products, auth trigger, RLS
-- Run in Supabase SQL Editor or via supabase db push

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('customer', 'supplier')),
  full_name text,
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid (),
  supplier_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  price_label text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  image_url text not null,
  stock integer not null default 0 check (stock >= 0),
  parent_category text,
  sub_category text,
  category text,
  attributes text[] not null default '{}',
  variants text[] not null default '{}',
  unit text,
  qty_allocated integer not null default 0 check (qty_allocated >= 0),
  published boolean not null default true,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create index products_supplier_id_idx on public.products (supplier_id);
create index products_stock_published_idx on public.products (stock, published)
  where stock > 0 and published = true;

-- New auth user → profile row (role from metadata; only customer/supplier allowed)
create or replace function public.handle_new_user ()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
  as $$
declare
  r text;
begin
  r := coalesce(NEW.raw_user_meta_data ->> 'role', 'customer');
  if r not in ('customer', 'supplier') then
    r := 'customer';
  end if;

  insert into public.profiles (id, role, full_name)
  values (
    NEW.id,
    r,
    nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'full_name', '')), '')
  );
  return NEW;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user ();

alter table public.profiles enable row level security;
alter table public.products enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid () = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid () = id);

create policy "products_select_browse_or_own"
  on public.products for select
  using (
    auth.role () = 'authenticated'
    and (
      (published = true and stock > 0)
      or supplier_id = auth.uid ()
    )
  );

create policy "products_insert_supplier_own"
  on public.products for insert
  with check (
    supplier_id = auth.uid ()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid ()
        and p.role = 'supplier'
    )
  );

create policy "products_update_own"
  on public.products for update
  using (supplier_id = auth.uid ());

create policy "products_delete_own"
  on public.products for delete
  using (supplier_id = auth.uid ());
