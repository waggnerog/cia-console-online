-- ============================================================
-- 003_db_views_and_planning.sql
-- CIA Console — DB-backed views and Planejamento tables
-- Run this on Supabase SQL Editor.
-- ============================================================

-- ── effectiveness_records ─────────────────────────────────
-- Raw effectiveness data uploaded via admin-import or future
-- mobile-sync. Replaces the legacy Excel-upload flow.
CREATE TABLE IF NOT EXISTS effectiveness_records (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  date          date        NOT NULL,
  week          text,
  pdv_id        text,
  pdv_name      text,
  promoter_id   uuid        REFERENCES people(id) ON DELETE SET NULL,
  promoter_name text,
  visited       boolean     NOT NULL DEFAULT false,
  tasks_done    int         NOT NULL DEFAULT 0,
  tasks_total   int         NOT NULL DEFAULT 0,
  photos_count  int         NOT NULL DEFAULT 0,
  uf            text,
  cidade        text,
  regional      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE effectiveness_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "efet_workspace_members" ON effectiveness_records
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_efet_ws_date
  ON effectiveness_records (workspace_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_efet_ws_week
  ON effectiveness_records (workspace_id, week);


-- ── data_critica_records ──────────────────────────────────
-- Raw critical-date data uploaded via admin-import.
-- Replaces the legacy Excel-upload flow.
CREATE TABLE IF NOT EXISTS data_critica_records (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  week          text,
  collected_at  date,
  pdv_id        text,
  pdv_name      text,
  product_ean   text,
  product_name  text,
  validade      date,
  qty           int         NOT NULL DEFAULT 0,
  days_to_exp   int,
  status        text        NOT NULL DEFAULT 'pendente',
  obs           text,
  uf            text,
  cidade        text,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE data_critica_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dcrit_workspace_members" ON data_critica_records
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_dcrit_ws
  ON data_critica_records (workspace_id);
CREATE INDEX IF NOT EXISTS idx_dcrit_ws_week
  ON data_critica_records (workspace_id, week);
CREATE INDEX IF NOT EXISTS idx_dcrit_ws_validade
  ON data_critica_records (workspace_id, validade ASC);


-- ── photos_records ─────────────────────────────────────────
-- Photo records pointing to Supabase Storage paths.
-- Replaces the legacy Excel-upload flow.
CREATE TABLE IF NOT EXISTS photos_records (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  week          text,
  date          date,
  pdv_id        text,
  pdv_name      text,
  promoter_id   uuid        REFERENCES people(id) ON DELETE SET NULL,
  promoter_name text,
  photo_url     text,            -- public or signed URL
  storage_path  text,            -- relative path in Supabase Storage
  category      text,            -- e.g. 'planograma', 'exposicao', 'preco'
  rating        int,             -- 1-5
  obs           text,
  uploaded_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE photos_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_workspace_members" ON photos_records
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_photos_ws_week
  ON photos_records (workspace_id, week);


-- ── Views (simple pass-through — add joins/aggregations later) ─
CREATE OR REPLACE VIEW vw_effectiveness_daily AS
  SELECT * FROM effectiveness_records;

CREATE OR REPLACE VIEW vw_data_critica_radar AS
  SELECT * FROM data_critica_records;

CREATE OR REPLACE VIEW vw_photos_feed AS
  SELECT * FROM photos_records;


-- ── visit_plans ────────────────────────────────────────────
-- Planejamento: one plan per week per workspace.
CREATE TABLE IF NOT EXISTS visit_plans (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  week          text        NOT NULL,
  status        text        NOT NULL DEFAULT 'draft',  -- draft | active | closed
  notes         text,
  created_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE visit_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_workspace_members" ON visit_plans
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_plans_ws_week
  ON visit_plans (workspace_id, week DESC);


-- ── visit_plan_items ────────────────────────────────────────
-- Individual PDV assignments inside a plan.
CREATE TABLE IF NOT EXISTS visit_plan_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid        NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_id       uuid        NOT NULL REFERENCES visit_plans(id) ON DELETE CASCADE,
  pdv_id        uuid        REFERENCES pdvs(id) ON DELETE CASCADE,
  person_id     uuid        REFERENCES people(id) ON DELETE SET NULL,
  day_of_week   int,               -- 0=Dom … 6=Sáb
  visit_time    text,              -- "09:00"
  frequency     text        NOT NULL DEFAULT 'weekly',  -- weekly | biweekly | monthly
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE visit_plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_items_workspace_members" ON visit_plan_items
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_users WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_plan_items_plan
  ON visit_plan_items (plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_items_ws
  ON visit_plan_items (workspace_id);
