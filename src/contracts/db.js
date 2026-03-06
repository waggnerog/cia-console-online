/**
 * src/contracts/db.js
 * ─────────────────────────────────────────────────────────────────────
 * CIA Console — DB Field Contracts
 *
 * Single source of truth for all view/table names and their fields.
 * Import these in any module that queries Supabase so column renames
 * are caught in one place.
 * ─────────────────────────────────────────────────────────────────────
 */

export const DB_VIEWS = {
  /** Daily effectiveness aggregated per PDV/promoter */
  vw_effectiveness_daily: {
    table: 'effectiveness_records',
    fields: [
      'id', 'workspace_id', 'date', 'week',
      'pdv_id', 'pdv_name',
      'promoter_id', 'promoter_name',
      'visited', 'tasks_done', 'tasks_total', 'photos_count',
      'uf', 'cidade', 'regional'
    ]
  },

  /** Critical-date radar per PDV/product */
  vw_data_critica_radar: {
    table: 'data_critica_records',
    fields: [
      'id', 'workspace_id', 'week', 'collected_at',
      'pdv_id', 'pdv_name',
      'product_ean', 'product_name',
      'validade', 'qty', 'days_to_exp',
      'status', 'obs', 'updated_at',
      'uf', 'cidade'
    ]
  },

  /** Photos feed per PDV/promoter */
  vw_photos_feed: {
    table: 'photos_records',
    fields: [
      'id', 'workspace_id', 'week', 'date',
      'pdv_id', 'pdv_name',
      'promoter_id', 'promoter_name',
      'photo_url', 'storage_path',
      'category', 'rating', 'obs', 'uploaded_at'
    ]
  }
};

export const DB_TABLES = {
  people: {
    fields: ['id', 'workspace_id', 'name', 'role', 'email', 'whatsapp', 'status']
  },
  pdvs: {
    fields: ['id', 'workspace_id', 'name', 'address', 'city', 'state', 'region', 'chain', 'lat', 'lng', 'status']
  },
  products: {
    fields: ['id', 'workspace_id', 'name', 'ean', 'category', 'status']
  },
  assignments: {
    fields: ['id', 'workspace_id', 'pdv_id', 'person_id', 'role', 'day_of_week', 'frequency', 'active']
  },
  pdv_contacts: {
    fields: ['id', 'workspace_id', 'pdv_id', 'name', 'role', 'phone', 'email']
  },
  pdv_products: {
    fields: ['id', 'workspace_id', 'pdv_id', 'product_id', 'target_qty']
  },
  visit_plans: {
    fields: ['id', 'workspace_id', 'week', 'status', 'notes', 'created_by', 'created_at', 'updated_at']
  },
  visit_plan_items: {
    fields: ['id', 'workspace_id', 'plan_id', 'pdv_id', 'person_id', 'day_of_week', 'visit_time', 'frequency', 'notes', 'created_at']
  },
  effectiveness_records: {
    fields: ['id', 'workspace_id', 'date', 'week', 'pdv_id', 'pdv_name', 'promoter_id', 'promoter_name', 'visited', 'tasks_done', 'tasks_total', 'photos_count', 'uf', 'cidade', 'regional', 'created_at']
  },
  data_critica_records: {
    fields: ['id', 'workspace_id', 'week', 'collected_at', 'pdv_id', 'pdv_name', 'product_ean', 'product_name', 'validade', 'qty', 'days_to_exp', 'status', 'obs', 'uf', 'cidade', 'updated_at', 'created_at']
  },
  photos_records: {
    fields: ['id', 'workspace_id', 'week', 'date', 'pdv_id', 'pdv_name', 'promoter_id', 'promoter_name', 'photo_url', 'storage_path', 'category', 'rating', 'obs', 'uploaded_at']
  }
};
