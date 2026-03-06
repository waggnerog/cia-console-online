/**
 * src/modules/efetividade.js
 * ─────────────────────────────────────────────────────────────────────
 * CIA Console — Efetividade (DB-backed)
 *
 * Fonte de verdade: Supabase table `effectiveness_records`
 * (exposed via view `vw_effectiveness_daily`)
 * Não usa mais upload de Excel.
 * ─────────────────────────────────────────────────────────────────────
 */

export function initEfetividade(frame) {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Efetividade</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: 'IBM Plex Sans', system-ui, sans-serif; background: #f8fafc; color: #0f172a; padding: 20px; font-size: 14px; }
    h1 { font-size: 20px; margin: 0 0 4px; color: #071C46; font-weight: 600; }
    .subtitle { font-size: 13px; color: #64748b; margin-bottom: 20px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .kpi-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
    .kpi-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
    .kpi-value { font-size: 26px; font-weight: 700; color: #071C46; margin-top: 4px; font-family: 'IBM Plex Mono', monospace; }
    .kpi-card.green .kpi-value { color: #1A7A3A; }
    .kpi-card.warn  .kpi-value { color: #d97706; }
    .kpi-card.red   .kpi-value { color: #dc2626; }

    .filters-bar { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
    .filters-bar select, .filters-bar input { padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; font-family: inherit; background: #f8fafc; color: #0f172a; }
    .filters-bar input:focus, .filters-bar select:focus { outline: none; border-color: #1A7A3A; box-shadow: 0 0 0 2px rgba(26,122,58,.15); }
    .btn { padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer; font-size: 13px; font-family: inherit; font-weight: 500; background: #fff; color: #0f172a; }
    .btn-primary { background: #1A7A3A; color: #fff; border-color: #1A7A3A; }
    .btn:hover { opacity: .85; }

    .section-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    .section-title { font-size: 14px; font-weight: 600; color: #071C46; margin: 0 0 14px; }

    table { width: 100%; border-collapse: collapse; }
    th { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .04em; padding: 8px 10px; border-bottom: 2px solid #e2e8f0; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-family: 'IBM Plex Mono', monospace; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8fafc; }

    .badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red   { background: #fee2e2; color: #991b1b; }
    .badge-gray  { background: #f1f5f9; color: #475569; }

    .empty { text-align: center; padding: 48px 20px; color: #94a3b8; }
    .empty-icon { font-size: 32px; margin-bottom: 10px; }
    .empty-title { font-size: 16px; font-weight: 600; color: #64748b; margin-bottom: 6px; }
    .empty-hint { font-size: 13px; line-height: 1.5; }

    .loading { text-align: center; padding: 40px; color: #94a3b8; font-size: 13px; }
    .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 16px; color: #991b1b; font-size: 13px; margin-bottom: 16px; }

    .chart-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .chart-bar { height: 6px; border-radius: 3px; background: #1A7A3A; min-width: 2px; }
    .pct-text { font-size: 12px; color: #64748b; min-width: 36px; }
  </style>
</head>
<body>
  <h1>Efetividade</h1>
  <p class="subtitle">Dados da operação por PDV e promotor — fonte: Supabase</p>

  <div class="filters-bar">
    <select id="filterWeek"><option value="">Todas as semanas</option></select>
    <select id="filterPromoter"><option value="">Todos os promotores</option></select>
    <select id="filterUf"><option value="">Todas as UFs</option></select>
    <input id="filterPdv" type="text" placeholder="Buscar PDV…" style="min-width:160px;">
    <button class="btn btn-primary" id="btnLoad">Carregar</button>
    <button class="btn" id="btnExportCsv">⬇ CSV</button>
  </div>

  <div id="errorBox" class="error-box" style="display:none;"></div>

  <div id="kpiGrid" class="kpi-grid" style="display:none;">
    <div class="kpi-card green">
      <div class="kpi-label">PDVs Visitados</div>
      <div class="kpi-value" id="kpiVisited">–</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total PDVs</div>
      <div class="kpi-value" id="kpiTotal">–</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-label">Efetividade</div>
      <div class="kpi-value" id="kpiPct">–</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Tarefas OK / Total</div>
      <div class="kpi-value" id="kpiTasks">–</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Fotos</div>
      <div class="kpi-value" id="kpiPhotos">–</div>
    </div>
  </div>

  <div id="loadingBox" class="loading">Selecione os filtros e clique em <b>Carregar</b>.</div>

  <div id="tableWrap" class="section-card" style="display:none;">
    <div class="section-title" id="tableTitle">Detalhamento por PDV</div>
    <table>
      <thead>
        <tr>
          <th>PDV</th>
          <th>Promotor</th>
          <th>Data</th>
          <th>Semana</th>
          <th>UF</th>
          <th>Visitado</th>
          <th>Tarefas</th>
          <th>Fotos</th>
          <th>Efet. %</th>
        </tr>
      </thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>

  <script>
    (function() {
      'use strict';

      const getSupabase = () => parent.window.CIA_SUPABASE;
      let wsId = null;
      let allRows = [];

      // ── Auth & workspace ──────────────────────────────────
      async function getWorkspaceId(sb) {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) throw new Error('Sem sessão');
        // Check for workspace from postMessage first
        if (wsId) return wsId;
        const { data, error } = await sb.from('workspace_users')
          .select('workspace_id').eq('user_id', user.id).limit(1);
        if (error || !data || !data.length) throw new Error('Workspace não encontrado');
        return data[0].workspace_id;
      }

      // ── Listen for workspace changes ──────────────────────
      window.addEventListener('message', ev => {
        try {
          if (ev.data?.type === 'CIA_POST_LOGIN' && ev.data.workspace_id)
            wsId = ev.data.workspace_id;
          if (ev.data?.type === 'CIA_ACTIVE_WORKSPACE' && ev.data.workspace_id) {
            wsId = ev.data.workspace_id;
            allRows = [];
            populateWeeks([]);
          }
        } catch (_) {}
      });

      // ── Populate filter dropdowns ──────────────────────────
      function populateSelect(id, values, label) {
        const el = document.getElementById(id);
        if (!el) return;
        const cur = el.value;
        while (el.options.length > 1) el.remove(1);
        values.forEach(v => {
          const o = document.createElement('option');
          o.value = v; o.textContent = v;
          el.appendChild(o);
        });
        if (values.includes(cur)) el.value = cur;
      }

      function populateWeeks(rows) {
        const weeks = [...new Set(rows.map(r => r.week).filter(Boolean))].sort().reverse();
        populateSelect('filterWeek', weeks, 'Todas as semanas');
      }

      function populatePromoters(rows) {
        const ps = [...new Set(rows.map(r => r.promoter_name).filter(Boolean))].sort();
        populateSelect('filterPromoter', ps, 'Todos os promotores');
      }

      function populateUfs(rows) {
        const ufs = [...new Set(rows.map(r => r.uf).filter(Boolean))].sort();
        populateSelect('filterUf', ufs, 'Todas as UFs');
      }

      // ── Format helpers ─────────────────────────────────────
      function fmtDate(d) {
        if (!d) return '–';
        try {
          const [y, m, day] = String(d).split('-');
          return day + '/' + m + '/' + y;
        } catch (_) { return String(d); }
      }

      function pct(n, t) {
        if (!t) return 0;
        return Math.round((n / t) * 100);
      }

      function badge(visited) {
        return visited
          ? '<span class="badge badge-green">✓ Sim</span>'
          : '<span class="badge badge-red">✗ Não</span>';
      }

      // ── Render table ───────────────────────────────────────
      function applyFilters() {
        const week = document.getElementById('filterWeek').value;
        const promoter = document.getElementById('filterPromoter').value;
        const uf = document.getElementById('filterUf').value;
        const pdvText = (document.getElementById('filterPdv').value || '').toLowerCase().trim();

        let rows = allRows;
        if (week) rows = rows.filter(r => r.week === week);
        if (promoter) rows = rows.filter(r => r.promoter_name === promoter);
        if (uf) rows = rows.filter(r => r.uf === uf);
        if (pdvText) rows = rows.filter(r => (r.pdv_name || '').toLowerCase().includes(pdvText));
        return rows;
      }

      function renderTable(rows) {
        const tbody = document.getElementById('tableBody');
        if (!rows.length) {
          tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:#94a3b8;">Nenhum registro encontrado.</td></tr>';
          document.getElementById('kpiGrid').style.display = 'none';
          return;
        }

        const visited   = rows.filter(r => r.visited).length;
        const total     = rows.length;
        const tasksDone = rows.reduce((s, r) => s + (r.tasks_done || 0), 0);
        const tasksTot  = rows.reduce((s, r) => s + (r.tasks_total || 0), 0);
        const photos    = rows.reduce((s, r) => s + (r.photos_count || 0), 0);
        const p = pct(visited, total);

        document.getElementById('kpiVisited').textContent = visited;
        document.getElementById('kpiTotal').textContent = total;
        document.getElementById('kpiPct').textContent = p + '%';
        document.getElementById('kpiTasks').textContent = tasksDone + ' / ' + tasksTot;
        document.getElementById('kpiPhotos').textContent = photos;
        document.getElementById('kpiGrid').style.display = 'grid';
        document.getElementById('kpiGrid').querySelector('.kpi-card.green .kpi-value').className;
        // color pct card
        const pctCard = document.getElementById('kpiPct').closest('.kpi-card');
        pctCard.className = 'kpi-card ' + (p >= 90 ? 'green' : p >= 70 ? '' : 'warn');
        document.getElementById('tableTitle').textContent =
          'Detalhamento (' + rows.length + ' registros)';

        const sorted = rows.slice().sort((a, b) => {
          if (a.date < b.date) return 1;
          if (a.date > b.date) return -1;
          return (a.pdv_name || '').localeCompare(b.pdv_name || '');
        });

        tbody.innerHTML = sorted.map(r => {
          const ep = pct(r.tasks_done, r.tasks_total);
          const bar = '<div class="chart-bar-wrap"><div class="chart-bar" style="width:' + Math.max(ep, 2) + 'px"></div><span class="pct-text">' + ep + '%</span></div>';
          return '<tr>' +
            '<td>' + escHtml(r.pdv_name || '–') + '</td>' +
            '<td>' + escHtml(r.promoter_name || '–') + '</td>' +
            '<td>' + fmtDate(r.date) + '</td>' +
            '<td>' + escHtml(r.week || '–') + '</td>' +
            '<td>' + escHtml(r.uf || '–') + '</td>' +
            '<td>' + badge(r.visited) + '</td>' +
            '<td>' + (r.tasks_done || 0) + ' / ' + (r.tasks_total || 0) + '</td>' +
            '<td>' + (r.photos_count || 0) + '</td>' +
            '<td>' + bar + '</td>' +
            '</tr>';
        }).join('');
      }

      function escHtml(s) {
        return String(s == null ? '' : s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      // ── Load data ──────────────────────────────────────────
      async function loadData() {
        const sb = getSupabase();
        if (!sb) { showError('Supabase não disponível. Aguarde o login.'); return; }

        setLoading(true);
        hideError();

        try {
          wsId = await getWorkspaceId(sb);

          let query = sb.from('effectiveness_records')
            .select('*')
            .eq('workspace_id', wsId)
            .order('date', { ascending: false })
            .limit(5000);

          const { data, error } = await query;
          if (error) {
            const contractMsg = contractCheck(error, 'effectiveness_records');
            throw contractMsg ? new Error(contractMsg) : error;
          }

          allRows = data || [];

          if (!allRows.length) {
            setLoading(false);
            showEmpty();
            return;
          }

          populateWeeks(allRows);
          populatePromoters(allRows);
          populateUfs(allRows);

          const filtered = applyFilters();
          renderTable(filtered);
          document.getElementById('tableWrap').style.display = '';
          setLoading(false);

        } catch (err) {
          setLoading(false);
          showError(err.message || String(err));
        }
      }

      function setLoading(on) {
        document.getElementById('loadingBox').style.display = on ? '' : 'none';
        if (on) {
          document.getElementById('loadingBox').textContent = 'Carregando dados…';
          document.getElementById('tableWrap').style.display = 'none';
          document.getElementById('kpiGrid').style.display = 'none';
        }
      }

      function showEmpty() {
        document.getElementById('loadingBox').innerHTML =
          '<div class="empty">' +
          '<div class="empty-icon">📊</div>' +
          '<div class="empty-title">Nenhum dado de efetividade</div>' +
          '<div class="empty-hint">Use o painel de Admin → Importar para carregar registros de efetividade no banco de dados.<br>Formato: CSV com colunas date, pdv_name, promoter_name, visited, tasks_done, tasks_total, photos_count.</div>' +
          '</div>';
        document.getElementById('loadingBox').style.display = '';
      }

      function showError(msg) {
        const box = document.getElementById('errorBox');
        box.textContent = 'Erro: ' + msg;
        box.style.display = '';
      }

      function hideError() {
        document.getElementById('errorBox').style.display = 'none';
      }

      // Detecta erro de contrato ausente (tabela/view não existe no banco)
      function contractCheck(err, tableName) {
        if (!err) return null;
        const msg = ((err.message || '') + (err.details || '') + (err.hint || '') + String(err)).toLowerCase();
        const code = (err.code || '').toUpperCase();
        if (code === '42P01' || code === 'PGRST200' || msg.includes('does not exist') ||
            msg.includes('relation') || msg.includes('could not find')) {
          return 'Contrato do banco ausente: ' + tableName;
        }
        return null;
      }

      // ── Export CSV ─────────────────────────────────────────
      function exportCsv() {
        const rows = applyFilters();
        if (!rows.length) { alert('Nenhum dado para exportar.'); return; }
        const header = ['pdv_id','pdv_name','promoter_name','date','week','uf','cidade','visited','tasks_done','tasks_total','photos_count'];
        const lines = [header.join(';')];
        rows.forEach(r => {
          lines.push([
            r.pdv_id || '', r.pdv_name || '', r.promoter_name || '',
            r.date || '', r.week || '', r.uf || '', r.cidade || '',
            r.visited ? 'Sim' : 'Não',
            r.tasks_done || 0, r.tasks_total || 0, r.photos_count || 0
          ].join(';'));
        });
        const blob = new Blob([lines.join('\\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'efetividade.csv';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 500);
      }

      // ── Bind events ────────────────────────────────────────
      document.getElementById('btnLoad').addEventListener('click', loadData);
      document.getElementById('btnExportCsv').addEventListener('click', exportCsv);
      ['filterWeek','filterPromoter','filterUf'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
          if (allRows.length) {
            renderTable(applyFilters());
            document.getElementById('tableWrap').style.display = '';
          }
        });
      });
      document.getElementById('filterPdv').addEventListener('input', () => {
        if (allRows.length) {
          renderTable(applyFilters());
          document.getElementById('tableWrap').style.display = '';
        }
      });

      // Auto-load on first paint
      window.addEventListener('DOMContentLoaded', () => {
        setTimeout(loadData, 150);
      });
    })();
  </script>
</body>
</html>`;

  frame.srcdoc = html;
}
