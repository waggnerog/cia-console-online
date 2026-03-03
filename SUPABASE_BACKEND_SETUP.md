# CIA — Supabase Backend Setup

Complete guide to provision the Supabase project that backs CIA Console Online.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon public key** (Settings → API).
3. Create a `.env.local` at the repo root (never commit this file):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_BUCKET=cia-files
```

---

## 2. Storage Bucket

In Supabase Dashboard → Storage:

1. Create a **private** bucket named `cia-files`.
2. Enable RLS policies (see Section 4).

---

## 3. Database Schema

Run the following SQL in the Supabase SQL editor:

```sql
-- Organizations
create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('agency','industry','commerce')),
  created_at timestamptz default now()
);

-- Workspaces (belong to an org)
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  name text not null,
  slug text unique,
  trade_owner_user_id uuid,
  created_at timestamptz default now()
);

-- Profiles (link auth.user → org + role)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references orgs(id),
  display_name text,
  role text not null default 'viewer' check (role in ('master','global_admin','admin','analyst','viewer')),
  created_at timestamptz default now()
);

-- Workspace members
create table workspace_users (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  unique(workspace_id, user_id)
);

-- Org feature entitlements
create table org_entitlements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id) on delete cascade,
  feature text not null,
  unique(org_id, feature)
);

-- Per-user feature overrides (restrictions only)
create table user_features (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  feature text not null,
  enabled boolean not null default false,
  unique(user_id, feature)
);

-- Observations (sync'd from client)
create table observations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  week text not null,
  key text not null,
  data jsonb,
  updated_at timestamptz default now(),
  unique(workspace_id, week, key)
);

-- Uploaded weeks manifest
create table weeks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  week text not null,
  files jsonb,
  created_at timestamptz default now(),
  unique(workspace_id, week)
);
```

---

## 4. Row Level Security Policies

Enable RLS on every table, then add policies:

```sql
-- Profiles: users can read their own profile
alter table profiles enable row level security;
create policy "Own profile" on profiles for select using (id = auth.uid());

-- Observations: workspace members can read/write
alter table observations enable row level security;
create policy "Workspace member read" on observations for select
  using (workspace_id in (
    select workspace_id from workspace_users where user_id = auth.uid()
  ));
create policy "Workspace member write" on observations for insert with check (
  workspace_id in (
    select workspace_id from workspace_users where user_id = auth.uid()
  )
);
create policy "Workspace member update" on observations for update
  using (workspace_id in (
    select workspace_id from workspace_users where user_id = auth.uid()
  ));

-- Weeks: workspace members can read; admins can write
alter table weeks enable row level security;
create policy "Workspace member read weeks" on weeks for select
  using (workspace_id in (
    select workspace_id from workspace_users where user_id = auth.uid()
  ));

-- Storage: cia-files — authenticated users in the workspace can read/write
-- Create via Dashboard: Storage → cia-files → Policies
```

A complete storage policy example (SQL):
```sql
create policy "Authenticated upload" on storage.objects
  for insert with check (
    bucket_id = 'cia-files' and auth.role() = 'authenticated'
  );

create policy "Authenticated download" on storage.objects
  for select using (
    bucket_id = 'cia-files' and auth.role() = 'authenticated'
  );
```

---

## 5. Edge Functions

The Admin screen invokes a Supabase Edge Function named `cia-admin` for privileged operations (creating auth users with service_role). Deploy it with the Supabase CLI:

```bash
supabase functions deploy cia-admin
```

The function source should live in `supabase/functions/cia-admin/index.ts` in this repo (if present).

---

## 6. Bootstrap a Master User

The first `master` user must be created manually:

1. Create an auth user in Supabase Dashboard → Authentication → Users.
2. Insert a profile row with `role = 'master'` directly in SQL:

```sql
insert into profiles (id, org_id, display_name, role)
values ('<user-uuid>', '<org-uuid>', 'Master', 'master');
```

After that, the Admin screen (role: master / global_admin) handles all subsequent provisioning.

---

## 7. Environment Variables Reference

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Project URL from Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `anon` public key (safe for browser) |
| `VITE_SUPABASE_BUCKET` | Storage bucket name (default: `cia-files`) |
-- MIGRATION: 001_hc_pdv_products.sql
-- Descrição: Criação das tabelas HC (People), PDVs, Products, Assignments e PdvProducts

-- Tabela: people (Headcount/Time)
create table people (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  role text not null check (role in ('promotor', 'supervisor', 'coordenador', 'gerente', 'admin', 'bko')),
  email text,
  phone_whatsapp text,
  manager_id uuid references people(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela: pdvs (Pontos de Venda)
create table pdvs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  pdv_code text,
  cnpj text,
  name text not null,
  address text,
  city text,
  uf varchar(2),
  lat double precision,
  lng double precision,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela: products (Produtos / SKUs)
create table products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  sku_code text,
  ean text,
  name text not null,
  brand text,
  category text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tabela: assignments (Alocações HC <-> PDV)
create table assignments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  pdv_id uuid not null references pdvs(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  assignment_role text not null check (assignment_role in ('promotor_principal', 'backup', 'supervisor', 'coordenador')),
  is_primary boolean default false,
  start_at timestamptz default now(),
  end_at timestamptz,
  created_at timestamptz default now()
);

-- Tabela: pdv_products (Mix de Produtos no PDV)
create table pdv_products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  pdv_id uuid not null references pdvs(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  is_listed boolean default true,
  priority int default 0,
  notes text,
  created_at timestamptz default now(),
  unique(pdv_id, product_id)
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Regra geral: Usuários podem ler e escrever apenas dados que pertençam
-- aos workspaces nos quais estão inseridos (tabela `workspace_users`).
-- (As restrições extras por role, como "promotor vê apenas os dele",
-- podem ser refinadas conforme necessidade; aqui mantemos isolamento por tenant como base segura)
-- ==========================================

-- Enable RLS
alter table people enable row level security;
alter table pdvs enable row level security;
alter table products enable row level security;
alter table assignments enable row level security;
alter table pdv_products enable row level security;

-- Policies for people
create policy "Workspace member read people" on people for select using (
  workspace_id in (select workspace_id from workspace_users where user_id = auth.uid())
);
create policy "Workspace member write people" on people for all using (
  workspace_id in (select workspace_id from workspace_users where user_id = auth.uid())
);

-- Policies for pdvs
create policy "Workspace member read pdvs" on pdvs for select using (
  workspace_id in (select workspace_id from workspace_users where user_id = auth.uid())
);
create policy "Workspace member write pdvs" on pdvs for all using (
  workspace_id in (select workspace_id from workspace_users where user_id = auth.uid())
);

-- Policies for products
create policy "Workspace member read products" on products for select using (
  workspace_id in (select workspace_id from workspace_users where user_id = auth.uid())
);
create policy "Workspace member write products" on products for all using (
  workspace_id in (select workspace_id from workspace_users where user_id = auth.uid())
);

-- Policies for assignments
create policy "Workspace member read assignments" on assignments for select using (
  workspace_id in (select workspace_id from workspace_users where user_id = auth.uid())
);
create policy "Workspace member write assignments" on assignments for all using (
  workspace_id in (select workspace_id from workspace_users where user_id = auth.uid())
);

-- Policies for pdv_products
create policy "Workspace member read pdv_products" on pdv_products for select using (
  workspace_id in (select workspace_id from workspace_users where user_id = auth.uid())
);
create policy "Workspace member write pdv_products" on pdv_products for all using (
  workspace_id in (select workspace_id from workspace_users where user_id = auth.uid())
);
