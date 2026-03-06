-- MIGRATION: 002_pdv_contacts_workspace_settings.sql
-- Descrição: pdv_contacts (contatos por loja), workspace_settings (configurações por workspace)
--            e ajuste dos roles de assignment para incluir promotor_backup, supervisor_resp, coord_resp

-- ============================================================
-- Table: pdv_contacts (Contatos do PDV — gerente, encarregado…)
-- ============================================================
create table if not exists pdv_contacts (
  id              uuid        primary key default gen_random_uuid(),
  workspace_id    uuid        not null references workspaces(id) on delete cascade,
  pdv_id          uuid        not null references pdvs(id) on delete cascade,
  name            text        not null,
  contact_role    text        not null default 'gerente'
    check (contact_role in ('gerente','encarregado','subgerente','repositor','outro')),
  phone_whatsapp  text,         -- dígitos puros (ex.: 5511999999999)
  phone_display   text,         -- formato legível (ex.: +55 (11) 99999-9999)
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table pdv_contacts enable row level security;

create policy "Workspace member read pdv_contacts" on pdv_contacts for select using (
  workspace_id in (select workspace_id from workspace_users where user_id = auth.uid())
);
create policy "Workspace member write pdv_contacts" on pdv_contacts for all using (
  workspace_id in (select workspace_id from workspace_users where user_id = auth.uid())
);

-- ============================================================
-- Table: workspace_settings (Configurações por workspace)
-- ============================================================
create table if not exists workspace_settings (
  id                              uuid    primary key default gen_random_uuid(),
  workspace_id                    uuid    not null unique references workspaces(id) on delete cascade,
  require_geo_for_pdvs            boolean not null default false,
  default_assignment_duration_days int    default 365,
  created_at                      timestamptz default now(),
  updated_at                      timestamptz default now()
);

alter table workspace_settings enable row level security;

create policy "Workspace member read ws_settings" on workspace_settings for select using (
  workspace_id in (select workspace_id from workspace_users where user_id = auth.uid())
);
-- Only admins/owners can update workspace settings (workspace_users.role)
create policy "Workspace admin write ws_settings" on workspace_settings for all using (
  workspace_id in (
    select workspace_id from workspace_users
    where user_id = auth.uid()
      and role in ('admin','owner','manager')
  )
);

-- ============================================================
-- Assignments: adicionar novos papéis ao check constraint
-- (drop e re-create para incluir todos os valores novos)
-- ============================================================
-- NOTE: Executar apenas se a tabela assignments já existe.
-- Se estiver rodando do zero junto com 001, use apenas a versão abaixo.

-- Para projetos novos (sem a constraint anterior em conflito):
-- ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_assignment_role_check;
-- ALTER TABLE assignments ADD CONSTRAINT assignments_assignment_role_check
--   CHECK (assignment_role IN (
--     'promotor_principal','promotor_backup',
--     'supervisor_resp','coord_resp',
--     -- Compatibilidade com valores legados:
--     'backup','supervisor','coordenador'
--   ));

-- Para projetos existentes (não quebrar linhas já salvas):
do $$
begin
  -- Remove constraint antiga se existir
  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'assignments'
      and constraint_name = 'assignments_assignment_role_check'
  ) then
    execute 'alter table assignments drop constraint assignments_assignment_role_check';
  end if;

  -- Adiciona constraint nova com todos os papéis
  execute $c$
    alter table assignments
      add constraint assignments_assignment_role_check
      check (assignment_role in (
        'promotor_principal', 'promotor_backup',
        'supervisor_resp',    'coord_resp',
        'backup', 'supervisor', 'coordenador'
      ))
  $c$;
exception when others then
  -- Se falhar (ex.: valores inválidos existentes), log e continua
  raise notice 'Could not update assignments_assignment_role_check: %', sqlerrm;
end;
$$;

-- ============================================================
-- Assignments: coluna is_required (opcional p/ vigência obrigatória)
-- ============================================================
alter table assignments add column if not exists notes text;
