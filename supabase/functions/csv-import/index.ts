/**
 * Supabase Edge Function: csv-import
 * ---------------------------------------------------------------------------
 * Recebe um array de linhas (rows) já parseadas no front e faz upsert seguro
 * usando service_role (não exposto ao cliente).
 *
 * Deploy:
 *   supabase functions deploy csv-import
 *
 * Body (JSON):
 *   {
 *     entity: 'people' | 'pdvs' | 'products' | 'assignments' | 'pdv_products' | 'pdv_contacts',
 *     workspace_id: string,   // UUID do workspace
 *     rows: object[]          // linhas já validadas pelo front
 *   }
 *
 * Response:
 *   { ok: true, inserted: number, updated: number, rejected: number, errors: [] }
 *   | { ok: false, error: string }
 * ---------------------------------------------------------------------------
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ---------------------------------------------------------------------------
// Entity → table & conflict-key mapping
// ---------------------------------------------------------------------------
type EntityKey = 'people' | 'pdvs' | 'products' | 'assignments' | 'pdv_products' | 'pdv_contacts';

interface EntityConfig {
  table: string;
  conflictKey: string;
  requiredFields: string[];
}

const ENTITY_CONFIG: Record<EntityKey, EntityConfig> = {
  people: {
    table: 'people',
    conflictKey: 'workspace_id,email',
    requiredFields: ['name', 'role'],
  },
  pdvs: {
    table: 'pdvs',
    conflictKey: 'workspace_id,pdv_code',
    requiredFields: ['name'],
  },
  products: {
    table: 'products',
    conflictKey: 'workspace_id,sku_code',
    requiredFields: ['name'],
  },
  assignments: {
    table: 'assignments',
    conflictKey: 'workspace_id,pdv_id,person_id',
    requiredFields: ['pdv_id', 'person_id', 'assignment_role'],
  },
  pdv_products: {
    table: 'pdv_products',
    conflictKey: 'pdv_id,product_id',
    requiredFields: ['pdv_id', 'product_id'],
  },
  pdv_contacts: {
    table: 'pdv_contacts',
    conflictKey: 'workspace_id,pdv_id,name',
    requiredFields: ['pdv_id', 'name'],
  },
};

const BATCH_SIZE = 50;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // Auth check
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

  // Verify user via anon client + JWT
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
  }

  // Admin client (service_role — never sent to browser)
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Parse body
  let body: { entity?: string; workspace_id?: string; rows?: unknown[] };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  const { entity, workspace_id, rows } = body;

  if (!entity || !(entity in ENTITY_CONFIG)) {
    return jsonResponse({ ok: false, error: `Unknown entity: ${entity}` }, 400);
  }
  if (!workspace_id) {
    return jsonResponse({ ok: false, error: 'workspace_id is required' }, 400);
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return jsonResponse({ ok: false, error: 'rows must be a non-empty array' }, 400);
  }

  // Verify user is a member of the requested workspace
  const { data: wsUser } = await adminClient
    .from('workspace_users')
    .select('role')
    .eq('user_id', user.id)
    .eq('workspace_id', workspace_id)
    .maybeSingle();

  if (!wsUser) {
    return jsonResponse(
      { ok: false, error: 'Forbidden: not a member of this workspace' },
      403
    );
  }

  const config = ENTITY_CONFIG[entity as EntityKey];
  const results = { ok: true, inserted: 0, updated: 0, rejected: 0, errors: [] as string[] };

  // Validate & enrich rows
  const cleanRows: Record<string, unknown>[] = [];
  const rejectReasons: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as Record<string, unknown>;
    const missing = config.requiredFields.filter((f) => !row[f]);
    if (missing.length > 0) {
      rejectReasons.push(`Row ${i + 1}: missing required fields: ${missing.join(', ')}`);
      results.rejected++;
      continue;
    }
    // Inject workspace_id (unless it's a junction table without it)
    const enriched = entity === 'pdv_products'
      ? { ...row }
      : { ...row, workspace_id };
    cleanRows.push(enriched);
  }

  if (rejectReasons.length > 0) {
    results.errors.push(...rejectReasons.slice(0, 20));
  }

  // Upsert in batches
  for (let i = 0; i < cleanRows.length; i += BATCH_SIZE) {
    const batch = cleanRows.slice(i, i + BATCH_SIZE);
    const { data, error } = await adminClient
      .from(config.table)
      .upsert(batch, { onConflict: config.conflictKey, ignoreDuplicates: false })
      .select('id');

    if (error) {
      results.rejected += batch.length;
      results.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
    } else {
      results.inserted += (data ?? []).length;
    }
  }

  return jsonResponse(results);
});
