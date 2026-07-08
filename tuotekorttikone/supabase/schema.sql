-- Tuotekorttikone · PostgreSQL-skeema Supabaselle
-- Aja Supabase SQL Editorissa. RLS-politiikat roolipohjaisesti (admin/editor/viewer).

-- ── Käyttäjät ──────────────────────────────────────────────────────────────
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'viewer' check (role in ('admin','editor','viewer')),
  created_at timestamptz not null default now()
);

-- ── Brändit ────────────────────────────────────────────────────────────────
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  slogan text,
  footer_text text,
  logo_url text,
  colors jsonb not null default '{}'::jsonb,
  font_style text not null default 'sans',
  heading_style text not null default 'uppercase',
  card_style text not null default 'minimal',
  image_style text not null default 'rounded',
  default_template text not null default 'product',
  version text not null default '1.0',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.brand_templates (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  kind text not null,   -- a4-portrait | a4-landscape | kitchen | product | misa | allergen | compact | showcase
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  unique (brand_id, kind)
);

-- ── Tuotteet ───────────────────────────────────────────────────────────────
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete restrict,
  name text not null,
  category text,
  description text,
  image_url text,
  image_focus jsonb,
  portion_size text,
  portion_weight text,
  price text,
  cost text,
  ingredients jsonb not null default '[]'::jsonb,
  instructions text,
  assembly text,
  serving text,
  storage text,
  shelf_life text,
  temperatures text,
  prep_time text,
  preps text,
  equipment text,
  allergen_other text,
  allergens_unknown boolean not null default false,
  diets text[] not null default '{}',
  warnings text,
  owner text,
  approver text,
  internal_note text,
  not_applicable text[] not null default '{}',
  version text not null default '1.0',
  status text not null default 'draft' check (status in ('draft','review','approved','archived')),
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.product_versions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  version text not null,
  snapshot jsonb not null,
  changed text[] not null default '{}',
  note text,
  saved_by uuid references public.users(id),
  saved_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  storage_path text not null,  -- Supabase Storage: bucket "cards"
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

-- ── Misat ──────────────────────────────────────────────────────────────────
create table if not exists public.misas (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete restrict,
  name text not null,
  used_in text,
  yield_amount text,
  image_url text,
  image_focus jsonb,
  ingredients jsonb not null default '[]'::jsonb,
  instructions text,
  container text,
  storage_temp text,
  shelf_life text,
  dating text,
  dosing text,
  allergen_other text,
  allergens_unknown boolean not null default false,
  owner text,
  not_applicable text[] not null default '{}',
  version text not null default '1.0',
  status text not null default 'draft' check (status in ('draft','review','approved','archived')),
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.misa_versions (
  id uuid primary key default gen_random_uuid(),
  misa_id uuid not null references public.misas(id) on delete cascade,
  version text not null,
  snapshot jsonb not null,
  changed text[] not null default '{}',
  note text,
  saved_by uuid references public.users(id),
  saved_at timestamptz not null default now()
);

-- ── Allergeenit (EU 14 + laajennettavat) ───────────────────────────────────
create table if not exists public.allergens (
  key text primary key,
  label text not null,
  short text not null
);

insert into public.allergens (key, label, short) values
  ('gluten','Gluteeni','G'), ('milk','Maito','M'), ('egg','Kananmuna','Mu'),
  ('fish','Kala','Ka'), ('crustacean','Äyriäiset','Äy'), ('soy','Soija','So'),
  ('nuts','Pähkinät','P'), ('peanut','Maapähkinä','Mp'), ('celery','Selleri','Se'),
  ('mustard','Sinappi','Si'), ('sesame','Seesami','Ss'),
  ('sulphite','Rikkidioksidi/sulfiitit','Su'), ('lupin','Lupiini','L'),
  ('mollusc','Nilviäiset','N')
on conflict (key) do nothing;

create table if not exists public.product_allergens (
  product_id uuid references public.products(id) on delete cascade,
  misa_id uuid references public.misas(id) on delete cascade,
  allergen_key text not null references public.allergens(key),
  primary key (allergen_key, coalesce(product_id, misa_id)),
  check (num_nonnulls(product_id, misa_id) = 1)
);

-- ── Exportit & audit ───────────────────────────────────────────────────────
create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  kind text not null,          -- pdf-product | pdf-kitchen | pdf-misa | pdf-allergens | pdf-brand
  target_id uuid,
  brand_id uuid references public.brands(id),
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  by_user uuid references public.users(id),
  action text not null,
  target text not null,
  detail text
);

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.brands enable row level security;
alter table public.brand_templates enable row level security;
alter table public.products enable row level security;
alter table public.product_versions enable row level security;
alter table public.product_images enable row level security;
alter table public.misas enable row level security;
alter table public.misa_versions enable row level security;
alter table public.allergens enable row level security;
alter table public.product_allergens enable row level security;
alter table public.exports enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.current_role() returns text
language sql stable security definer as
$$ select coalesce((select role from public.users where id = auth.uid()), 'viewer') $$;

-- Luku kaikille kirjautuneille
do $$
declare t text;
begin
  foreach t in array array['brands','brand_templates','products','product_versions',
    'product_images','misas','misa_versions','allergens','product_allergens','exports']
  loop
    execute format(
      'create policy "%s_read" on public.%I for select to authenticated using (true)', t, t);
  end loop;
end $$;

-- Kirjoitus: editor + admin (brändit ja poistot vain admin)
create policy brands_write on public.brands
  for all to authenticated
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

do $$
declare t text;
begin
  foreach t in array array['products','product_versions','product_images',
    'misas','misa_versions','product_allergens','exports']
  loop
    execute format(
      'create policy "%s_write" on public.%I for insert to authenticated
         with check (public.current_role() in (''admin'',''editor''))', t, t);
    execute format(
      'create policy "%s_update" on public.%I for update to authenticated
         using (public.current_role() in (''admin'',''editor''))', t, t);
    execute format(
      'create policy "%s_delete" on public.%I for delete to authenticated
         using (public.current_role() = ''admin'')', t, t);
  end loop;
end $$;

create policy users_self on public.users
  for select to authenticated using (id = auth.uid() or public.current_role() = 'admin');

-- Storage: luo bucket "cards" (julkinen luku) Supabase-hallinnasta tai:
-- insert into storage.buckets (id, name, public) values ('cards','cards', true);
