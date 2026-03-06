/**
 * src/modules/fotos.js
 * ─────────────────────────────────────────────────────────────────────
 * CIA Console — Fotos (DB-backed)
 *
 * Fonte de verdade: Supabase table `photos_records`
 * (exposed via view `vw_photos_feed`)
 * Fotos armazenadas em Supabase Storage — URLs geradas por signed URL.
 * Não usa mais upload de Excel.
 * ─────────────────────────────────────────────────────────────────────
 */

export function initFotos(frame) {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Fotos</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: 'IBM Plex Sans', system-ui, sans-serif; background: #f8fafc; color: #0f172a; padding: 20px; font-size: 14px; }
    h1 { font-size: 20px; margin: 0 0 4px; color: #071C46; font-weight: 600; }
    .subtitle { font-size: 13px; color: #64748b; margin-bottom: 20px; }

    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .kpi-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
    .kpi-label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .05em; }
    .kpi-value { font-size: 24px; font-weight: 700; color: #071C46; margin-top: 4px; font-family: 'IBM Plex Mono', monospace; }

    .filters-bar { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
    .filters-bar select, .filters-bar input { padding: 7px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; font-family: inherit; background: #f8fafc; color: #0f172a; }
    .filters-bar select:focus, .filters-bar input:focus { outline: none; border-color: #7c3aed; box-shadow: 0 0 0 2px rgba(124,58,237,.12); }
    .btn { padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer; font-size: 13px; font-family: inherit; font-weight: 500; background: #fff; color: #0f172a; }
    .btn-primary { background: #7c3aed; color: #fff; border-color: #7c3aed; }
    .btn:hover { opacity: .85; }

    /* View toggle */
    .view-toggle { display: flex; gap: 6px; margin-left: auto; }
    .view-btn { padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; font-size: 12px; color: #64748b; }
    .view-btn.active { background: #7c3aed; color: #fff; border-color: #7c3aed; }

    /* Photo grid */
    .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
    .photo-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
    .photo-card img { width: 100%; height: 160px; object-fit: cover; display: block; background: #f1f5f9; }
    .photo-card .photo-no-img { width: 100%; height: 160px; background: linear-gradient(135deg, #ede9fe, #ddd6fe); display: flex; align-items: center; justify-content: center; font-size: 32px; color: #7c3aed; }
    .photo-card .photo-meta { padding: 10px 12px; }
    .photo-card .photo-pdv { font-weight: 600; font-size: 13px; color: #0f172a; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .photo-card .photo-details { font-size: 12px; color: #64748b; line-height: 1.4; }
    .photo-card .photo-cat { display: inline-block; padding: 1px 7px; border-radius: 999px; background: #ede9fe; color: #6d28d9; font-size: 11px; font-weight: 600; margin-top: 6px; }

    /* Table view */
    .section-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 700px; }
    th { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .04em; padding: 8px 10px; border-bottom: 2px solid #e2e8f0; text-align: left; }
    td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #faf5ff; }
    .link-btn { color: #7c3aed; text-decoration: none; font-size: 12px; font-weight: 500; }
    .link-btn:hover { text-decoration: underline; }

    .empty { text-align: center; padding: 48px 20px; color: #94a3b8; }
    .empty-icon { font-size: 32px; margin-bottom: 10px; }
    .empty-title { font-size: 16px; font-weight: 600; color: #64748b; margin-bottom: 6px; }
    .empty-hint { font-size: 13px; line-height: 1.6; }
    .loading { text-align: center; padding: 40px; color: #94a3b8; font-size: 13px; }
    .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 16px; color: #991b1b; font-size: 13px; margin-bottom: 16px; }

    /* Modal lightbox */
    .modal-backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.72); z-index: 9999; align-items: center; justify-content: center; }
    .modal-backdrop.open { display: flex; }
    .modal-img { max-width: 90vw; max-height: 90vh; border-radius: 8px; box-shadow: 0 20px 60px rgba(0,0,0,.5); }
    .modal-close { position: fixed; top: 16px; right: 20px; font-size: 28px; color: #fff; cursor: pointer; z-index: 10000; background: none; border: none; }
  </style>
</head>
<body>
  <h1>Fotos</h1>
  <p class="subtitle">Registro fotográfico por PDV e promotor — fonte: Supabase Storage</p>

  <div class="filters-bar">
    <select id="filterWeek"><option value="">Todas as semanas</option></select>
    <select id="filterPromoter"><option value="">Todos os promotores</option></select>
    <select id="filterCategory"><option value="">Todas as categorias</option></select>
    <input id="filterPdv" type="text" placeholder="Buscar PDV…" style="min-width:140px;">
    <button class="btn btn-primary" id="btnLoad">Carregar</button>
    <button class="btn" id="btnExportCsv">⬇ CSV</button>
    <div class="view-toggle">
      <button class="view-btn active" id="btnViewGrid" title="Grade">⊞</button>
      <button class="view-btn" id="btnViewTable" title="Tabela">≡</button>
    </div>
  </div>

  <div id="errorBox" class="error-box" style="display:none;"></div>

  <div id="kpiGrid" class="kpi-grid" style="display:none;">
    <div class="kpi-card">
      <div class="kpi-label">Total Fotos</div>
      <div class="kpi-value" id="kpiTotal">–</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">PDVs</div>
      <div class="kpi-value" id="kpiPdvs">–</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Promotores</div>
      <div class="kpi-value" id="kpiPromoters">–</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Avaliação Média</div>
      <div class="kpi-value" id="kpiRating">–</div>
    </div>
  </div>

  <div id="loadingBox" class="loading">Selecione os filtros e clique em <b>Carregar</b>.</div>

  <div id="gridView" style="display:none;">
    <div class="photo-grid" id="photoGrid"></div>
  </div>

  <div id="tableView" class="section-card" style="display:none;">
    <div class="section-title" id="tableTitle">Fotos</div>
    <table>
      <thead>
        <tr>
          <th>PDV</th>
          <th>Promotor</th>
          <th>Data</th>
          <th>Semana</th>
          <th>Categoria</th>
          <th>Avaliação</th>
          <th>Obs</th>
          <th>Link</th>
        </tr>
      </thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>

  <!-- Lightbox -->
  <div class="modal-backdrop" id="lightbox">
    <button class="modal-close" id="lightboxClose">✕</button>
    <img class="modal-img" id="lightboxImg" src="" alt="Foto">
  </div>

  <script>
    (function() {
      'use strict';

      const getSupabase = () => parent.window.CIA_SUPABASE;
      let wsId = null;
      let allRows = [];
      let viewMode = 'grid';

      window.addEventListener('message', ev => {
        try {
          if (ev.data?.type === 'CIA_POST_LOGIN' && ev.data.workspace_id)
            wsId = ev.data.workspace_id;
          if (ev.data?.type === 'CIA_ACTIVE_WORKSPACE' && ev.data.workspace_id) {
            wsId = ev.data.workspace_id;
            allRows = [];
          }
        } catch (_) {}
      });

      async function getWorkspaceId(sb) {
        if (wsId) return wsId;
        const { data: { user } } = await sb.auth.getUser();
        if (!user) throw new Error('Sem sessão');
        const { data, error } = await sb.from('workspace_users')
          .select('workspace_id').eq('user_id', user.id).limit(1);
        if (error || !data?.length) throw new Error('Workspace não encontrado');
        return data[0].workspace_id;
      }

      function fmtDate(d) {
        if (!d) return '–';
        try { const [y, m, day] = String(d).split('-'); return day + '/' + m + '/' + y; }
        catch (_) { return String(d); }
      }

      function escHtml(s) {
        return String(s == null ? '' : s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      function stars(n) {
        if (!n) return '–';
        return '★'.repeat(Math.max(0, Math.min(5, n))) + '☆'.repeat(5 - Math.max(0, Math.min(5, n)));
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
        const week     = document.getElementById('filterWeek').value;
        const promoter = document.getElementById('filterPromoter').value;
        const cat      = document.getElementById('filterCategory').value;
        const q        = (document.getElementById('filterPdv').value || '').toLowerCase().trim();
        return allRows.filter(r => {
          if (week && r.week !== week) return false;
          if (promoter && r.promoter_name !== promoter) return false;
          if (cat && (r.category || '') !== cat) return false;
          if (q && !(r.pdv_name || '').toLowerCase().includes(q)) return false;
          return true;
        });
      }

      function renderKpis(rows) {
        const pdvs = new Set(rows.map(r => r.pdv_id || r.pdv_name).filter(Boolean)).size;
        const promos = new Set(rows.map(r => r.promoter_id || r.promoter_name).filter(Boolean)).size;
        const rated = rows.filter(r => r.rating != null);
        const avgRating = rated.length
          ? (rated.reduce((s, r) => s + r.rating, 0) / rated.length).toFixed(1)
          : '–';
        document.getElementById('kpiTotal').textContent = rows.length;
        document.getElementById('kpiPdvs').textContent = pdvs;
        document.getElementById('kpiPromoters').textContent = promos;
        document.getElementById('kpiRating').textContent = avgRating;
        document.getElementById('kpiGrid').style.display = 'grid';
      }

      function renderGrid(rows) {
        const grid = document.getElementById('photoGrid');
        if (!rows.length) {
          grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#94a3b8;padding:24px;">Nenhuma foto encontrada.</p>';
          return;
        }
        grid.innerHTML = rows.map((r, i) => {
          const imgHtml = r.photo_url
            ? '<img src="' + escHtml(r.photo_url) + '" alt="Foto ' + escHtml(r.pdv_name || '') + '" loading="lazy" data-idx="' + i + '" style="cursor:zoom-in;">'
            : '<div class="photo-no-img">📷</div>';
          return '<div class="photo-card">' +
            imgHtml +
            '<div class="photo-meta">' +
            '<div class="photo-pdv">' + escHtml(r.pdv_name || '–') + '</div>' +
            '<div class="photo-details">' +
              escHtml(r.promoter_name || '') + (r.promoter_name && r.date ? ' · ' : '') + fmtDate(r.date) +
            '</div>' +
            (r.category ? '<span class="photo-cat">' + escHtml(r.category) + '</span>' : '') +
            (r.rating ? '<div style="font-size:12px;color:#d97706;margin-top:4px;">' + stars(r.rating) + '</div>' : '') +
            '</div></div>';
        }).join('');

        // Lightbox
        grid.querySelectorAll('img[data-idx]').forEach(img => {
          img.addEventListener('click', () => {
            const idx = parseInt(img.getAttribute('data-idx'));
            const row = rows[idx];
            if (row && row.photo_url) {
              document.getElementById('lightboxImg').src = row.photo_url;
              document.getElementById('lightbox').classList.add('open');
            }
          });
        });
      }

      function renderTable(rows) {
        const tbody = document.getElementById('tableBody');
        const title = document.getElementById('tableTitle');
        title.textContent = 'Fotos (' + rows.length + ')';
        if (!rows.length) {
          tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:#94a3b8;">Nenhuma foto encontrada.</td></tr>';
          return;
        }
        tbody.innerHTML = rows.map(r => '<tr>' +
          '<td>' + escHtml(r.pdv_name || '–') + '</td>' +
          '<td>' + escHtml(r.promoter_name || '–') + '</td>' +
          '<td>' + fmtDate(r.date) + '</td>' +
          '<td>' + escHtml(r.week || '–') + '</td>' +
          '<td>' + escHtml(r.category || '–') + '</td>' +
          '<td>' + (r.rating ? stars(r.rating) : '–') + '</td>' +
          '<td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escHtml(r.obs || '') + '</td>' +
          '<td>' + (r.photo_url ? '<a class="link-btn" href="' + escHtml(r.photo_url) + '" target="_blank" rel="noopener">Abrir ↗</a>' : '–') + '</td>' +
          '</tr>').join('');
      }

      function render(rows) {
        renderKpis(rows);
        if (viewMode === 'grid') {
          renderGrid(rows);
          document.getElementById('gridView').style.display = '';
          document.getElementById('tableView').style.display = 'none';
        } else {
          renderTable(rows);
          document.getElementById('tableView').style.display = '';
          document.getElementById('gridView').style.display = 'none';
        }
      }

      async function loadData() {
        const sb = getSupabase();
        if (!sb) { showError('Supabase não disponível.'); return; }

        setLoading(true);
        hideError();

        try {
          wsId = await getWorkspaceId(sb);

          const { data, error } = await sb.from('photos_records')
            .select('*')
            .eq('workspace_id', wsId)
            .order('uploaded_at', { ascending: false })
            .limit(2000);

          if (error) {
            const contractMsg = contractCheck(error, 'photos_records');
            throw contractMsg ? new Error(contractMsg) : error;
          }
          allRows = data || [];

          if (!allRows.length) { setLoading(false); showEmpty(); return; }

          const weeks = [...new Set(allRows.map(r => r.week).filter(Boolean))].sort().reverse();
          populateSelect('filterWeek', weeks);
          const promos = [...new Set(allRows.map(r => r.promoter_name).filter(Boolean))].sort();
          populateSelect('filterPromoter', promos);
          const cats = [...new Set(allRows.map(r => r.category).filter(Boolean))].sort();
          populateSelect('filterCategory', cats);

          render(applyFilters());
          setLoading(false);

        } catch (err) {
          setLoading(false);
          showError(err.message || String(err));
        }
      }

      function setLoading(on) {
        document.getElementById('loadingBox').style.display = on ? '' : 'none';
        if (on) {
          document.getElementById('loadingBox').textContent = 'Carregando fotos…';
          ['gridView','tableView'].forEach(id => document.getElementById(id).style.display = 'none');
          document.getElementById('kpiGrid').style.display = 'none';
        }
      }

      function showEmpty() {
        document.getElementById('loadingBox').innerHTML =
          '<div class="empty">' +
          '<div class="empty-icon">📷</div>' +
          '<div class="empty-title">Nenhuma foto encontrada</div>' +
          '<div class="empty-hint">Use o painel de Admin → Importar para registrar fotos no banco de dados.<br>' +
          'As fotos devem ser carregadas no Supabase Storage e registradas na tabela <code>photos_records</code>.</div>' +
          '</div>';
        document.getElementById('loadingBox').style.display = '';
      }

      function showError(msg) {
        const box = document.getElementById('errorBox');
        box.textContent = 'Erro: ' + msg;
        box.style.display = '';
      }
      function hideError() { document.getElementById('errorBox').style.display = 'none'; }

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

      function setViewMode(mode) {
        viewMode = mode;
        document.getElementById('btnViewGrid').classList.toggle('active', mode === 'grid');
        document.getElementById('btnViewTable').classList.toggle('active', mode === 'table');
        if (allRows.length) render(applyFilters());
      }

      function exportCsv() {
        const rows = applyFilters();
        if (!rows.length) { alert('Nenhum dado para exportar.'); return; }
        const header = ['pdv_id','pdv_name','promoter_name','date','week','category','rating','obs','photo_url'];
        const lines = [header.join(';')];
        rows.forEach(r => {
          lines.push([
            r.pdv_id || '', r.pdv_name || '', r.promoter_name || '',
            r.date || '', r.week || '', r.category || '',
            r.rating || '', (r.obs || '').replace(/;/g, ','), r.photo_url || ''
          ].join(';'));
        });
        const blob = new Blob([lines.join('\\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'fotos.csv';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 500);
      }

      // Bind
      document.getElementById('btnLoad').addEventListener('click', loadData);
      document.getElementById('btnExportCsv').addEventListener('click', exportCsv);
      document.getElementById('btnViewGrid').addEventListener('click', () => setViewMode('grid'));
      document.getElementById('btnViewTable').addEventListener('click', () => setViewMode('table'));
      document.getElementById('lightboxClose').addEventListener('click', () => document.getElementById('lightbox').classList.remove('open'));
      document.getElementById('lightbox').addEventListener('click', e => {
        if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
      });

      ['filterWeek','filterPromoter','filterCategory'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
          if (allRows.length) render(applyFilters());
        });
      });
      document.getElementById('filterPdv').addEventListener('input', () => {
        if (allRows.length) render(applyFilters());
      });

      window.addEventListener('DOMContentLoaded', () => setTimeout(loadData, 150));
    })();
  </script>
</body>
</html>`;

  frame.srcdoc = html;
}
