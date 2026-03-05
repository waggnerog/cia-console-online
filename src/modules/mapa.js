/**
 * src/modules/mapa.js
 * ─────────────────────────────────────────────────────────────────────
 * CIA Console — Mapa da Operação (DB-backed)
 *
 * Fonte de verdade: Supabase (pdvs + assignments + pdv_contacts + pdv_products)
 * A Sistemática (Excel) NÃO é mais utilizada como fonte.
 * ─────────────────────────────────────────────────────────────────────
 */

export function initMapa(frame) {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Mapa da Operação</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'IBM Plex Sans', system-ui, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      padding: 20px;
      font-size: 14px;
    }
    h1 { font-size: 20px; margin: 0 0 4px; color: #071C46; font-weight: 600; }
    .subtitle { font-size: 13px; color: #64748b; margin-bottom: 20px; }

    /* KPI Cards */
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .kpi-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
    }
    .kpi-card .kpi-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
    .kpi-card .kpi-value { font-size: 28px; font-weight: 700; color: #071C46; margin-top: 4px; font-family: 'IBM Plex Mono', monospace; }
    .kpi-card.green .kpi-value { color: #1A7A3A; }
    .kpi-card.warn .kpi-value { color: #d97706; }

    /* Filters */
    .filters-bar {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 16px;
    }
    .filters-bar input, .filters-bar select {
      padding: 7px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
      background: #f8fafc;
      color: #0f172a;
      min-width: 120px;
    }
    .filters-bar input:focus, .filters-bar select:focus {
      outline: none;
      border-color: #1A7A3A;
      box-shadow: 0 0 0 2px rgba(26,122,58,.15);
    }
    .btn {
      padding: 8px 14px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
      font-weight: 500;
    }
    .btn-primary { background: #1A7A3A; color: #fff; }
    .btn-primary:hover { background: #145e2c; }
    .btn-ghost { background: #f1f5f9; color: #0f172a; }
    .btn-ghost:hover { background: #e2e8f0; }
    .ml-auto { margin-left: auto; }

    /* Table */
    .table-wrap {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; }
    thead { background: #f8fafc; }
    th {
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: .05em;
      border-bottom: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
      vertical-align: top;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafafa; }
    .mono { font-family: 'IBM Plex Mono', monospace; font-size: 12px; }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-gray  { background: #f1f5f9; color: #64748b; }
    .badge-warn  { background: #fef3c7; color: #d97706; }
    .badge-red   { background: #fee2e2; color: #dc2626; }

    /* Team chips */
    .team-list { display: flex; flex-wrap: wrap; gap: 4px; }
    .team-chip {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      background: #e0f2fe;
      color: #0369a1;
      white-space: nowrap;
    }
    .team-chip.principal { background: #dcfce7; color: #15803d; }
    .team-chip.supervisor { background: #ede9fe; color: #7c3aed; }
    .team-chip.coord { background: #fef3c7; color: #92400e; }

    /* Empty / loading states */
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #94a3b8;
    }
    .empty-state .empty-icon { font-size: 32px; margin-bottom: 8px; }
    .empty-state .empty-title { font-size: 15px; font-weight: 600; color: #475569; margin-bottom: 4px; }

    /* Detail modal */
    .modal-overlay {
      display: none;
      position: fixed; inset: 0;
      background: rgba(0,0,0,.45);
      z-index: 100;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-overlay.active { display: flex; }
    .modal-box {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      width: 600px;
      max-width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .modal-title { font-size: 18px; font-weight: 600; color: #071C46; margin: 0; }
    .modal-close {
      border: none;
      background: #f1f5f9;
      color: #64748b;
      border-radius: 6px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
    }
    .modal-close:hover { background: #e2e8f0; }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: .05em;
      margin: 16px 0 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #f1f5f9;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid #f8fafc;
      font-size: 13px;
    }
    .detail-label { color: #64748b; font-size: 12px; }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 13px;
      color: #64748b;
    }
    .pagination button {
      border: 1px solid #e2e8f0;
      background: #fff;
      border-radius: 5px;
      padding: 4px 10px;
      cursor: pointer;
      font-size: 13px;
    }
    .pagination button:hover { background: #f1f5f9; }
    .pagination button:disabled { opacity: .4; cursor: default; }

    /* Spinner */
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner {
      width: 20px; height: 20px;
      border: 3px solid #e2e8f0;
      border-top-color: #1A7A3A;
      border-radius: 50%;
      animation: spin .7s linear infinite;
      display: inline-block;
      vertical-align: middle;
      margin-right: 8px;
    }
  </style>
</head>
<body>
  <h1>Mapa da Operação</h1>
  <p class="subtitle">Fonte de verdade: banco de dados (PDVs · Alocações · Contatos · Mix de Produtos)</p>

  <!-- KPI Row -->
  <div class="kpi-grid" id="kpiGrid">
    <div class="kpi-card"><div class="kpi-label">Total PDVs</div><div class="kpi-value mono" id="kpiTotal">—</div></div>
    <div class="kpi-card green"><div class="kpi-label">PDVs Ativos</div><div class="kpi-value mono" id="kpiAtivo">—</div></div>
    <div class="kpi-card warn"><div class="kpi-label">Sem Promotor</div><div class="kpi-value mono" id="kpiSemPromotor">—</div></div>
    <div class="kpi-card"><div class="kpi-label">Com Contato</div><div class="kpi-value mono" id="kpiComContato">—</div></div>
    <div class="kpi-card"><div class="kpi-label">Com SKUs</div><div class="kpi-value mono" id="kpiComSku">—</div></div>
  </div>

  <!-- Filters -->
  <div class="filters-bar">
    <input type="text" id="srchName" placeholder="Buscar nome / código…">
    <input type="text" id="fCity" placeholder="Cidade…">
    <select id="fUf">
      <option value="">Todos UF</option>
      <option>AC</option><option>AL</option><option>AP</option><option>AM</option><option>BA</option>
      <option>CE</option><option>DF</option><option>ES</option><option>GO</option><option>MA</option>
      <option>MT</option><option>MS</option><option>MG</option><option>PA</option><option>PB</option>
      <option>PR</option><option>PE</option><option>PI</option><option>RJ</option><option>RN</option>
      <option>RS</option><option>RO</option><option>RR</option><option>SC</option><option>SP</option>
      <option>SE</option><option>TO</option>
    </select>
    <select id="fStatus">
      <option value="">Status: Todos</option>
      <option value="active">Ativos</option>
      <option value="inactive">Inativos</option>
    </select>
    <select id="fTeam">
      <option value="">Time: Todos</option>
      <option value="com_promotor">Com Promotor</option>
      <option value="sem_promotor">Sem Promotor</option>
    </select>
    <button class="btn btn-primary" id="btnFilter">Filtrar</button>
    <button class="btn btn-ghost" id="btnClear">Limpar</button>
  </div>

  <!-- Table -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th>PDV</th>
          <th>Cidade / UF</th>
          <th>Time</th>
          <th>Contatos</th>
          <th>SKUs</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="mapaTableBody">
        <tr><td colspan="8" class="empty-state"><span class="spinner"></span> Carregando…</td></tr>
      </tbody>
    </table>
    <div class="pagination" id="pagination" style="display:none">
      <button id="btnPrev">‹</button>
      <span id="pageInfo"></span>
      <button id="btnNext">›</button>
    </div>
  </div>

  <!-- Detail Modal -->
  <div id="modalDetail" class="modal-overlay">
    <div class="modal-box">
      <div class="modal-header">
        <h2 class="modal-title" id="detailTitle">PDV</h2>
        <button class="modal-close" id="modalClose">✕</button>
      </div>
      <div id="detailBody"></div>
    </div>
  </div>

  <script>
    // ──────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────
    const getSupabase = () => parent.window.CIA_SUPABASE;

    function esc(str) {
      if (!str) return '';
      return String(str).replace(/[&<>'"]/g, t => (
        {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[t]
      ));
    }

    function roleLabel(r) {
      const MAP = {
        promotor_principal: 'Promotor Principal',
        promotor_backup:    'Promotor Backup',
        supervisor_resp:    'Supervisor',
        coord_resp:         'Coordenador',
        backup:             'Backup',
        supervisor:         'Supervisor',
        coordenador:        'Coordenador',
      };
      return MAP[r] || r || '';
    }

    function roleClass(r) {
      if (r === 'promotor_principal') return 'principal';
      if (r === 'supervisor_resp' || r === 'supervisor') return 'supervisor';
      if (r === 'coord_resp' || r === 'coordenador') return 'coord';
      return '';
    }

    // ──────────────────────────────────────────────────────────────────
    // State
    // ──────────────────────────────────────────────────────────────────
    let wsId = null;
    let allPdvs = [];       // enriched PDV objects
    let filtered = [];
    let currentPage = 1;
    const PAGE_SIZE = 30;

    // ──────────────────────────────────────────────────────────────────
    // Init
    // ──────────────────────────────────────────────────────────────────
    async function init() {
      try {
        const sb = getSupabase();
        if (!sb) return;
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;
        const { data: wusers } = await sb.from('workspace_users')
          .select('workspace_id').eq('user_id', user.id).limit(1);
        if (wusers && wusers.length) {
          wsId = wusers[0].workspace_id;
          await loadData();
        }
      } catch (e) { console.error('[Mapa] init', e); }
    }

    window.addEventListener('message', ev => {
      if (!ev || ev.source !== window.parent) return;
      if (ev.data?.type === 'CIA_POST_LOGIN') {
        if (ev.data.workspace_id) wsId = ev.data.workspace_id;
        init();
      }
      if (ev.data?.type === 'CIA_ACTIVE_WORKSPACE' && ev.data.workspace_id) {
        wsId = ev.data.workspace_id;
        loadData();
      }
    });

    // ──────────────────────────────────────────────────────────────────
    // Data Loading
    // ──────────────────────────────────────────────────────────────────
    async function loadData() {
      const sb = getSupabase();
      if (!sb || !wsId) return;

      setLoading(true);
      try {
        // 1) PDVs
        const { data: pdvs, error: pdvErr } = await sb
          .from('pdvs')
          .select('*')
          .eq('workspace_id', wsId)
          .order('name');
        if (pdvErr) throw pdvErr;

        const pdvIds = (pdvs || []).map(p => p.id);
        if (!pdvIds.length) { allPdvs = []; renderWithFilters(); return; }

        // 2) Assignments (with person name)
        const { data: assigns } = await sb
          .from('assignments')
          .select('pdv_id, person_id, assignment_role, is_primary, people(name)')
          .eq('workspace_id', wsId)
          .in('pdv_id', pdvIds);

        // 3) PDV Contacts count
        const { data: contacts } = await sb
          .from('pdv_contacts')
          .select('pdv_id, name, phone_display')
          .eq('workspace_id', wsId)
          .in('pdv_id', pdvIds);

        // 4) PDV Products count
        const { data: pdvProds } = await sb
          .from('pdv_products')
          .select('pdv_id, products(name, sku_code)')
          .eq('workspace_id', wsId)
          .in('pdv_id', pdvIds);

        // Build lookup maps
        const assignMap = new Map();
        for (const a of (assigns || [])) {
          if (!assignMap.has(a.pdv_id)) assignMap.set(a.pdv_id, []);
          assignMap.get(a.pdv_id).push(a);
        }
        const contactMap = new Map();
        for (const c of (contacts || [])) {
          if (!contactMap.has(c.pdv_id)) contactMap.set(c.pdv_id, []);
          contactMap.get(c.pdv_id).push(c);
        }
        const skuMap = new Map();
        for (const pp of (pdvProds || [])) {
          if (!skuMap.has(pp.pdv_id)) skuMap.set(pp.pdv_id, []);
          skuMap.get(pp.pdv_id).push(pp);
        }

        allPdvs = (pdvs || []).map(p => ({
          ...p,
          _assigns:  assignMap.get(p.id) || [],
          _contacts: contactMap.get(p.id) || [],
          _skus:     skuMap.get(p.id) || [],
        }));

        renderKpis();
        renderWithFilters();
      } catch (e) {
        console.error('[Mapa] loadData', e);
        document.getElementById('mapaTableBody').innerHTML =
          '<tr><td colspan="8" style="text-align:center;color:#dc2626;padding:20px">Erro ao carregar dados. Verifique o console.</td></tr>';
      } finally {
        setLoading(false);
      }
    }

    function setLoading(on) {
      if (on) {
        document.getElementById('mapaTableBody').innerHTML =
          '<tr><td colspan="8"><div class="empty-state"><span class="spinner"></span> Carregando…</div></td></tr>';
      }
    }

    // ──────────────────────────────────────────────────────────────────
    // KPI Rendering
    // ──────────────────────────────────────────────────────────────────
    function renderKpis() {
      const total  = allPdvs.length;
      const ativo  = allPdvs.filter(p => p.is_active).length;
      const semProm = allPdvs.filter(p =>
        !p._assigns.some(a => a.assignment_role === 'promotor_principal')
      ).length;
      const comC   = allPdvs.filter(p => p._contacts.length > 0).length;
      const comSku = allPdvs.filter(p => p._skus.length > 0).length;

      document.getElementById('kpiTotal').textContent      = total;
      document.getElementById('kpiAtivo').textContent      = ativo;
      document.getElementById('kpiSemPromotor').textContent = semProm;
      document.getElementById('kpiComContato').textContent  = comC;
      document.getElementById('kpiComSku').textContent      = comSku;
    }

    // ──────────────────────────────────────────────────────────────────
    // Filtering + Rendering
    // ──────────────────────────────────────────────────────────────────
    function applyFilters() {
      const srch   = document.getElementById('srchName').value.toLowerCase().trim();
      const city   = document.getElementById('fCity').value.toLowerCase().trim();
      const uf     = document.getElementById('fUf').value;
      const status = document.getElementById('fStatus').value;
      const team   = document.getElementById('fTeam').value;

      filtered = allPdvs.filter(p => {
        if (srch && !p.name.toLowerCase().includes(srch) &&
                    !(p.pdv_code && p.pdv_code.toLowerCase().includes(srch))) return false;
        if (city && !(p.city && p.city.toLowerCase().includes(city))) return false;
        if (uf && p.uf !== uf) return false;
        if (status === 'active' && !p.is_active) return false;
        if (status === 'inactive' && p.is_active) return false;
        if (team === 'com_promotor' &&
            !p._assigns.some(a => a.assignment_role === 'promotor_principal')) return false;
        if (team === 'sem_promotor' &&
             p._assigns.some(a => a.assignment_role === 'promotor_principal')) return false;
        return true;
      });

      currentPage = 1;
      renderTable();
    }

    function renderWithFilters() {
      applyFilters();
    }

    function renderTable() {
      const tbody = document.getElementById('mapaTableBody');
      const pag   = document.getElementById('pagination');

      if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">🗺️</div><div class="empty-title">Nenhum PDV encontrado</div>Ajuste os filtros ou cadastre PDVs na tela "PDVs".</div></td></tr>';
        pag.style.display = 'none';
        return;
      }

      const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
      const start = (currentPage - 1) * PAGE_SIZE;
      const page  = filtered.slice(start, start + PAGE_SIZE);

      tbody.innerHTML = page.map(p => {
        const principal = p._assigns.find(a => a.assignment_role === 'promotor_principal');
        const teamChips = p._assigns.slice(0, 3).map(a =>
          '<span class="team-chip ' + roleClass(a.assignment_role) + '">'
          + esc(a.people?.name || 'Pessoa')
          + ' <span style="opacity:.6;font-size:10px">(' + roleLabel(a.assignment_role) + ')</span>'
          + '</span>'
        ).join('') + (p._assigns.length > 3
          ? '<span class="team-chip">+' + (p._assigns.length - 3) + '</span>' : '');

        const statusBadge = p.is_active
          ? '<span class="badge badge-green">Ativo</span>'
          : '<span class="badge badge-gray">Inativo</span>';
        const promBadge = principal
          ? '<span class="badge badge-green" style="font-size:10px">✓</span>'
          : '<span class="badge badge-warn" style="font-size:10px">—</span>';

        return '<tr>'
          + '<td class="mono">' + esc(p.pdv_code || '—') + '</td>'
          + '<td><strong>' + esc(p.name) + '</strong>'
          + (p.cnpj ? '<br><span style="font-size:11px;color:#94a3b8">' + esc(p.cnpj) + '</span>' : '') + '</td>'
          + '<td>' + esc(p.city || '—') + ' / ' + esc(p.uf || '—') + '</td>'
          + '<td><div class="team-list">' + (teamChips || '<span style="color:#94a3b8;font-size:12px">Sem alocação</span>') + '</div></td>'
          + '<td>' + esc(String(p._contacts.length)) + '</td>'
          + '<td>' + esc(String(p._skus.length)) + '</td>'
          + '<td>' + statusBadge + ' ' + promBadge + '</td>'
          + '<td><button class="btn btn-ghost" onclick="openDetail(\'' + p.id + '\')" style="padding:4px 8px;font-size:12px">Ver</button></td>'
          + '</tr>';
      }).join('');

      // Pagination
      if (totalPages > 1) {
        pag.style.display = 'flex';
        document.getElementById('pageInfo').textContent =
          'Página ' + currentPage + ' de ' + totalPages + ' (' + filtered.length + ' PDVs)';
        document.getElementById('btnPrev').disabled = currentPage === 1;
        document.getElementById('btnNext').disabled = currentPage === totalPages;
      } else {
        pag.style.display = 'none';
      }
    }

    // ──────────────────────────────────────────────────────────────────
    // Detail Modal
    // ──────────────────────────────────────────────────────────────────
    window.openDetail = function(pdvId) {
      const p = allPdvs.find(x => x.id === pdvId);
      if (!p) return;

      document.getElementById('detailTitle').textContent = p.name;

      const address = [p.address, p.city, p.uf].filter(Boolean).join(' · ');
      let body = '';

      // Info
      body += '<div class="section-title">Dados do PDV</div>';
      body += (p.pdv_code ? '<div class="detail-row"><span class="detail-label">Código</span><span class="mono">' + esc(p.pdv_code) + '</span></div>' : '');
      body += (p.cnpj     ? '<div class="detail-row"><span class="detail-label">CNPJ</span><span class="mono">'     + esc(p.cnpj)     + '</span></div>' : '');
      body += (address    ? '<div class="detail-row"><span class="detail-label">Endereço</span><span>'              + esc(address)    + '</span></div>' : '');
      if (p.lat && p.lng) {
        body += '<div class="detail-row"><span class="detail-label">Geo</span><span class="mono">'
              + esc(String(p.lat)) + ', ' + esc(String(p.lng)) + '</span></div>';
      }
      body += '<div class="detail-row"><span class="detail-label">Status</span>'
            + (p.is_active ? '<span class="badge badge-green">Ativo</span>' : '<span class="badge badge-gray">Inativo</span>')
            + '</div>';

      // Team
      if (p._assigns.length) {
        body += '<div class="section-title">Time Alocado</div>';
        p._assigns.forEach(a => {
          body += '<div class="detail-row">'
                + '<span class="team-chip ' + roleClass(a.assignment_role) + '">' + roleLabel(a.assignment_role) + '</span>'
                + '<span>' + esc(a.people?.name || a.person_id) + '</span>'
                + '</div>';
        });
      } else {
        body += '<div class="section-title">Time Alocado</div>';
        body += '<p style="color:#94a3b8;font-size:13px;margin:8px 0">Nenhuma pessoa alocada.</p>';
      }

      // Contacts
      if (p._contacts.length) {
        body += '<div class="section-title">Contatos do PDV</div>';
        p._contacts.forEach(c => {
          body += '<div class="detail-row">'
                + '<span><strong>' + esc(c.name) + '</strong> <span style="color:#94a3b8;font-size:11px">(' + esc(c.contact_role || '') + ')</span></span>'
                + (c.phone_display
                  ? '<a href="https://wa.me/' + esc(c.phone_whatsapp || '') + '" target="_blank" style="color:#1A7A3A;text-decoration:none;font-size:12px">📱 ' + esc(c.phone_display) + '</a>'
                  : '<span style="color:#94a3b8;font-size:12px">Sem WhatsApp</span>')
                + '</div>';
        });
      }

      // SKUs
      if (p._skus.length) {
        body += '<div class="section-title">Mix de Produtos (' + p._skus.length + ' SKUs)</div>';
        const top = p._skus.slice(0, 8);
        top.forEach(pp => {
          body += '<div class="detail-row">'
                + '<span class="mono" style="font-size:12px">' + esc(pp.products?.sku_code || '—') + '</span>'
                + '<span>' + esc(pp.products?.name || '—') + '</span>'
                + '</div>';
        });
        if (p._skus.length > 8) {
          body += '<p style="color:#94a3b8;font-size:12px;text-align:right">… e mais ' + (p._skus.length - 8) + ' produtos</p>';
        }
      }

      document.getElementById('detailBody').innerHTML = body;
      document.getElementById('modalDetail').classList.add('active');
    };

    // ──────────────────────────────────────────────────────────────────
    // Event Listeners
    // ──────────────────────────────────────────────────────────────────
    document.getElementById('btnFilter').addEventListener('click', applyFilters);
    document.getElementById('btnClear').addEventListener('click', () => {
      document.getElementById('srchName').value = '';
      document.getElementById('fCity').value = '';
      document.getElementById('fUf').value = '';
      document.getElementById('fStatus').value = '';
      document.getElementById('fTeam').value = '';
      applyFilters();
    });
    document.getElementById('srchName').addEventListener('keydown', e => {
      if (e.key === 'Enter') applyFilters();
    });
    document.getElementById('btnPrev').addEventListener('click', () => {
      if (currentPage > 1) { currentPage--; renderTable(); }
    });
    document.getElementById('btnNext').addEventListener('click', () => {
      const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
      if (currentPage < totalPages) { currentPage++; renderTable(); }
    });
    document.getElementById('modalClose').addEventListener('click', () => {
      document.getElementById('modalDetail').classList.remove('active');
    });
    document.getElementById('modalDetail').addEventListener('click', e => {
      if (e.target === document.getElementById('modalDetail')) {
        document.getElementById('modalDetail').classList.remove('active');
      }
    });

    // ──────────────────────────────────────────────────────────────────
    // Boot
    // ──────────────────────────────────────────────────────────────────
    init();
  </script>
</body>
</html>`;
  frame.srcdoc = html;
}
