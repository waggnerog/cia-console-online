/**
 * src/modules/datacrit.js
 * ─────────────────────────────────────────────────────────────────────
 * CIA Console — Data Crítica (DB-backed)
 *
 * Fonte de verdade: Supabase table `data_critica_records`
 * (exposed via view `vw_data_critica_radar`)
 * Não usa mais upload de Excel/CSV.
 * ─────────────────────────────────────────────────────────────────────
 */

export function initDataCrit(frame) {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Data Crítica</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: 'IBM Plex Sans', system-ui, sans-serif; background: #f8fafc; color: #0f172a; padding: 20px; font-size: 14px; }
    h1 { font-size: 20px; margin: 0 0 4px; color: #071C46; font-weight: 600; }
    .subtitle { font-size: 13px; color: #64748b; margin-bottom: 20px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .kpi-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
    .kpi-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
    .kpi-value { font-size: 24px; font-weight: 700; color: #071C46; margin-top: 4px; font-family: 'IBM Plex Mono', monospace; }
    .kpi-card.red   .kpi-value { color: #dc2626; }
    .kpi-card.warn  .kpi-value { color: #d97706; }
    .kpi-card.blue  .kpi-value { color: #2563eb; }
    .kpi-card.green .kpi-value { color: #1A7A3A; }

    .filters-bar { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
    .filters-bar select, .filters-bar input { padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; font-family: inherit; background: #f8fafc; color: #0f172a; }
    .filters-bar select:focus, .filters-bar input:focus { outline: none; border-color: #dc2626; box-shadow: 0 0 0 2px rgba(220,38,38,.12); }
    .btn { padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer; font-size: 13px; font-family: inherit; font-weight: 500; background: #fff; color: #0f172a; }
    .btn-primary { background: #dc2626; color: #fff; border-color: #dc2626; }
    .btn:hover { opacity: .85; }

    .section-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; overflow: auto; }
    .section-title { font-size: 14px; font-weight: 600; color: #071C46; margin: 0 0 14px; }

    table { width: 100%; border-collapse: collapse; min-width: 800px; }
    th { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .04em; padding: 8px 10px; border-bottom: 2px solid #e2e8f0; text-align: left; white-space: nowrap; }
    td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fef2f2; }

    .bucket-tag { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; white-space: nowrap; }
    .bucket-venc { background: #fee2e2; color: #991b1b; }
    .bucket-0-10 { background: #fef2f2; color: #dc2626; }
    .bucket-11-30 { background: #fff7ed; color: #c2410c; }
    .bucket-31-60 { background: #fffbeb; color: #d97706; }
    .bucket-60p  { background: #ecfdf5; color: #166534; }

    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .status-pend { background: #fef9c3; color: #854d0e; }
    .status-acomp { background: #dbeafe; color: #1d4ed8; }
    .status-conc { background: #dcfce7; color: #166534; }

    .empty { text-align: center; padding: 48px 20px; color: #94a3b8; }
    .empty-icon { font-size: 32px; margin-bottom: 10px; }
    .empty-title { font-size: 16px; font-weight: 600; color: #64748b; margin-bottom: 6px; }
    .empty-hint { font-size: 13px; line-height: 1.6; }

    .loading { text-align: center; padding: 40px; color: #94a3b8; font-size: 13px; }
    .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 16px; color: #991b1b; font-size: 13px; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>Data Crítica — Radar</h1>
  <p class="subtitle">Produtos próximos ao vencimento por PDV — fonte: Supabase</p>

  <div class="filters-bar">
    <select id="filterWeek"><option value="">Todas as semanas</option></select>
    <select id="filterBucket">
      <option value="">Todos os buckets</option>
      <option value="vencido">Vencido</option>
      <option value="0-10">0–10 dias</option>
      <option value="11-30">11–30 dias</option>
      <option value="31-60">31–60 dias</option>
      <option value="60+">Mais de 60 dias</option>
    </select>
    <select id="filterStatus">
      <option value="">Todos os status</option>
      <option value="pendente">Pendente</option>
      <option value="acompanhando">Acompanhando</option>
      <option value="concluido">Concluído</option>
    </select>
    <select id="filterUf"><option value="">Todas as UFs</option></select>
    <input id="filterPdv" type="text" placeholder="Buscar PDV ou produto…" style="min-width:160px;">
    <button class="btn btn-primary" id="btnLoad">Carregar</button>
    <button class="btn" id="btnExportCsv">⬇ CSV</button>
  </div>

  <div id="errorBox" class="error-box" style="display:none;"></div>

  <div id="kpiGrid" class="kpi-grid" style="display:none;">
    <div class="kpi-card red">
      <div class="kpi-label">Vencidos</div>
      <div class="kpi-value" id="kpiVencido">–</div>
    </div>
    <div class="kpi-card warn">
      <div class="kpi-label">0–30 dias</div>
      <div class="kpi-value" id="kpi030">–</div>
    </div>
    <div class="kpi-card blue">
      <div class="kpi-label">31–60 dias</div>
      <div class="kpi-value" id="kpi3160">–</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-label">Concluídos</div>
      <div class="kpi-value" id="kpiConc">–</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Casos</div>
      <div class="kpi-value" id="kpiTotal">–</div>
    </div>
  </div>

  <div id="loadingBox" class="loading">Selecione os filtros e clique em <b>Carregar</b>.</div>

  <div id="tableWrap" class="section-card" style="display:none;">
    <div class="section-title" id="tableTitle">Casos de Data Crítica</div>
    <table>
      <thead>
        <tr>
          <th>PDV</th>
          <th>Produto</th>
          <th>EAN</th>
          <th>Validade</th>
          <th>Dias</th>
          <th>Bucket</th>
          <th>Qtde</th>
          <th>UF</th>
          <th>Semana</th>
          <th>Status</th>
          <th>Obs</th>
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

      function getBootstrapState() {
        try {
          return parent.window.CIA_BOOTSTRAP?.getWorkspaceResolution?.() || null;
        } catch (_) {
          return null;
        }
      }

      function getBootstrapWorkspaceMessage(state) {
        if (!state) return null;
        if (state.status === 'selection_required') return 'Selecione um workspace no menu lateral para continuar.';
        if (state.status === 'no_workspace') return 'Nenhum workspace vinculado ao seu usuário.';
        if (state.status === 'incomplete') return state.message || 'Backend incompleto ou dados de workspace ausentes.';
        if (state.status === 'error') return state.message || 'Erro ao carregar workspace.';
        return null;
      }

      window.addEventListener('message', ev => {
        try {
          if (ev.data?.type === 'CIA_POST_LOGIN') {
            wsId = ev.data.workspace_id || null;
            setTimeout(loadData, 0);
          }
          if (ev.data?.type === 'CIA_ACTIVE_WORKSPACE' && ev.data.workspace_id) {
            wsId = ev.data.workspace_id;
            allRows = [];
            setTimeout(loadData, 0);
          }
        } catch (_) {}
      });

      async function getWorkspaceId(sb) {
        if (wsId) return wsId;
        const boot = getBootstrapState();
        const bootWsId = boot?.activeWorkspaceId || parent.window.CIA_CTX?.workspaceActive || null;
        if (bootWsId) {
          wsId = bootWsId;
          return wsId;
        }
        if (boot?.status === 'loading') return null;
        const bootMsg = getBootstrapWorkspaceMessage(boot);
        if (bootMsg) throw new Error(bootMsg);
        const { data: { user } } = await sb.auth.getUser();
        if (!user) throw new Error('Sem sessão');
        const { data, error } = await sb.from('workspace_users')
          .select('workspace_id,is_active')
          .eq('user_id', user.id)
          .or('is_active.eq.true,is_active.is.null');
        if (error) throw new Error('Erro ao consultar workspace_users.');
        if (!data?.length) throw new Error('Nenhum workspace vinculado ao seu usuário.');
        if (data.length > 1) throw new Error('Selecione um workspace no menu lateral para continuar.');
        wsId = data[0].workspace_id;
        return wsId;
      }

      function fmtDate(d) {
        if (!d) return '–';
        try {
          const [y, m, day] = String(d).split('-');
          return day + '/' + m + '/' + y;
        } catch (_) { return String(d); }
      }

      function escHtml(s) {
        return String(s == null ? '' : s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      function daysBucket(days) {
        if (days == null) return '';
        if (days < 0)  return 'vencido';
        if (days <= 10) return '0-10';
        if (days <= 30) return '11-30';
        if (days <= 60) return '31-60';
        return '60+';
      }

      function bucketTag(b) {
        const map = {
          'vencido': ['bucket-venc', 'Vencido'],
          '0-10':    ['bucket-0-10', '0–10d'],
          '11-30':   ['bucket-11-30', '11–30d'],
          '31-60':   ['bucket-31-60', '31–60d'],
          '60+':     ['bucket-60p',  '60+ dias']
        };
        const [cls, label] = map[b] || ['', b];
        return '<span class="bucket-tag ' + cls + '">' + label + '</span>';
      }

      function statusBadge(s) {
        const m = {
          'pendente':    ['status-pend', 'Pendente'],
          'acompanhando':['status-acomp', 'Acompanhando'],
          'concluido':   ['status-conc', 'Concluído']
        };
        const [cls, lbl] = m[s] || ['', s || '–'];
        return cls ? '<span class="status-badge ' + cls + '">' + lbl + '</span>' : escHtml(lbl);
      }

      function populateSelect(id, values) {
        const el = document.getElementById(id);
        if (!el) return;
        const cur = el.value;
        while (el.options.length > 1) el.remove(1);
        values.forEach(v => {
          const o = document.createElement('option');
          o.value = v; o.textContent = v; el.appendChild(o);
        });
        if (values.includes(cur)) el.value = cur;
      }

      function applyFilters() {
        const week   = document.getElementById('filterWeek').value;
        const bucket = document.getElementById('filterBucket').value;
        const status = document.getElementById('filterStatus').value;
        const uf     = document.getElementById('filterUf').value;
        const q      = (document.getElementById('filterPdv').value || '').toLowerCase().trim();

        return allRows.filter(r => {
          if (week && r.week !== week) return false;
          const b = daysBucket(r.days_to_exp);
          if (bucket && b !== bucket) return false;
          if (status && (r.status || '') !== status) return false;
          if (uf && (r.uf || '') !== uf) return false;
          if (q && !(r.pdv_name || '').toLowerCase().includes(q) && !(r.product_name || '').toLowerCase().includes(q)) return false;
          return true;
        });
      }

      function renderTable(rows) {
        const tbody = document.getElementById('tableBody');
        if (!rows.length) {
          tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:24px;color:#94a3b8;">Nenhum caso encontrado.</td></tr>';
          document.getElementById('kpiGrid').style.display = 'none';
          return;
        }

        const vencido = rows.filter(r => (r.days_to_exp || 0) < 0).length;
        const u30     = rows.filter(r => { const d = r.days_to_exp; return d != null && d >= 0 && d <= 30; }).length;
        const u60     = rows.filter(r => { const d = r.days_to_exp; return d != null && d > 30 && d <= 60; }).length;
        const conc    = rows.filter(r => r.status === 'concluido').length;

        document.getElementById('kpiVencido').textContent = vencido;
        document.getElementById('kpi030').textContent = u30;
        document.getElementById('kpi3160').textContent = u60;
        document.getElementById('kpiConc').textContent = conc;
        document.getElementById('kpiTotal').textContent = rows.length;
        document.getElementById('kpiGrid').style.display = 'grid';
        document.getElementById('tableTitle').textContent = 'Casos (' + rows.length + ')';

        const sorted = rows.slice().sort((a, b) => {
          const da = a.days_to_exp != null ? a.days_to_exp : 9999;
          const db = b.days_to_exp != null ? b.days_to_exp : 9999;
          return da - db;
        });

        tbody.innerHTML = sorted.map(r => {
          const b = daysBucket(r.days_to_exp);
          return '<tr>' +
            '<td>' + escHtml(r.pdv_name || '–') + '</td>' +
            '<td>' + escHtml(r.product_name || '–') + '</td>' +
            '<td style="font-family:\'IBM Plex Mono\',monospace;font-size:12px;">' + escHtml(r.product_ean || '–') + '</td>' +
            '<td>' + fmtDate(r.validade) + '</td>' +
            '<td style="font-family:\'IBM Plex Mono\',monospace;">' + (r.days_to_exp != null ? r.days_to_exp : '–') + '</td>' +
            '<td>' + bucketTag(b) + '</td>' +
            '<td style="font-family:\'IBM Plex Mono\',monospace;">' + (r.qty || 0) + '</td>' +
            '<td>' + escHtml(r.uf || '–') + '</td>' +
            '<td>' + escHtml(r.week || '–') + '</td>' +
            '<td>' + statusBadge(r.status) + '</td>' +
            '<td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + escHtml(r.obs || '') + '">' + escHtml(r.obs || '') + '</td>' +
            '</tr>';
        }).join('');
      }

      async function loadData() {
        const sb = getSupabase();
        if (!sb) { showError('Supabase não disponível.'); return; }

        setLoading(true);
        hideError();

        try {
          wsId = await getWorkspaceId(sb);
          if (!wsId) {
            document.getElementById('loadingBox').textContent = 'Carregando workspace…';
            return;
          }

          const { data, error } = await sb.from('data_critica_records')
            .select('*')
            .eq('workspace_id', wsId)
            .order('validade', { ascending: true })
            .limit(5000);

          if (error) {
            const contractMsg = contractCheck(error, 'data_critica_records');
            throw contractMsg ? new Error(contractMsg) : error;
          }
          allRows = data || [];

          if (!allRows.length) { setLoading(false); showEmpty(); return; }

          const weeks = [...new Set(allRows.map(r => r.week).filter(Boolean))].sort().reverse();
          populateSelect('filterWeek', weeks);
          const ufs = [...new Set(allRows.map(r => r.uf).filter(Boolean))].sort();
          populateSelect('filterUf', ufs);

          renderTable(applyFilters());
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
          '<div class="empty-icon">📅</div>' +
          '<div class="empty-title">Nenhum dado operacional de Data Crítica</div>' +
          '<div class="empty-hint">Use o painel de Admin → Importar para carregar registros de data crítica no banco.<br>Colunas esperadas: pdv_name, product_name, product_ean, validade, qty, collected_at, week.</div>' +
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

      function exportCsv() {
        const rows = applyFilters();
        if (!rows.length) { alert('Nenhum dado para exportar.'); return; }
        const header = ['pdv_id','pdv_name','product_name','product_ean','validade','days_to_exp','qty','uf','cidade','week','status','obs'];
        const lines = [header.join(';')];
        rows.forEach(r => {
          lines.push([
            r.pdv_id || '', r.pdv_name || '', r.product_name || '', r.product_ean || '',
            r.validade || '', r.days_to_exp ?? '', r.qty || 0,
            r.uf || '', r.cidade || '', r.week || '', r.status || '', (r.obs || '').replace(/;/g, ',')
          ].join(';'));
        });
        const blob = new Blob([lines.join('\\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'data_critica.csv';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 500);
      }

      document.getElementById('btnLoad').addEventListener('click', loadData);
      document.getElementById('btnExportCsv').addEventListener('click', exportCsv);
      ['filterWeek','filterBucket','filterStatus','filterUf'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
          if (allRows.length) { renderTable(applyFilters()); document.getElementById('tableWrap').style.display = ''; }
        });
      });
      document.getElementById('filterPdv').addEventListener('input', () => {
        if (allRows.length) { renderTable(applyFilters()); document.getElementById('tableWrap').style.display = ''; }
      });

      window.addEventListener('DOMContentLoaded', () => setTimeout(loadData, 150));
    })();
  </script>
</body>
</html>`;

  frame.srcdoc = html;
}
