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
