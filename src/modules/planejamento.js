/**
 * src/modules/planejamento.js
 * ─────────────────────────────────────────────────────────────────────
 * CIA Console — Planejamento de Visitas (DB-backed)
 *
 * Tabelas: visit_plans + visit_plan_items + pdvs + people
 * CRUD completo para criar e gerenciar planos de visita semanais.
 * ─────────────────────────────────────────────────────────────────────
 */

export function initPlanejamento(frame) {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Planejamento</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: 'IBM Plex Sans', system-ui, sans-serif; background: #f8fafc; color: #0f172a; padding: 20px; font-size: 14px; }
    h1 { font-size: 20px; margin: 0 0 4px; color: #071C46; font-weight: 600; }
    .subtitle { font-size: 13px; color: #64748b; margin-bottom: 20px; }

    .toolbar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
    .toolbar select, .toolbar input { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; font-family: inherit; background: #fff; color: #0f172a; }
    .toolbar select:focus, .toolbar input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,.12); }

    .btn { padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer; font-size: 13px; font-family: inherit; font-weight: 500; background: #fff; color: #0f172a; transition: .1s; }
    .btn:hover { background: #f1f5f9; }
    .btn-primary { background: #2563eb; color: #fff; border-color: #2563eb; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-danger  { background: #dc2626; color: #fff; border-color: #dc2626; }
    .btn-danger:hover  { background: #b91c1c; }
    .btn-sm { padding: 5px 10px; font-size: 12px; }

    /* Plans list */
    .section-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .section-title { font-size: 15px; font-weight: 600; color: #071C46; margin: 0; }

    .plans-list { display: flex; flex-direction: column; gap: 10px; }
    .plan-row { display: grid; grid-template-columns: 1fr 120px 120px auto auto; gap: 10px; align-items: center; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; }
    .plan-row:hover { background: #eff6ff; border-color: #bfdbfe; }
    .plan-week { font-weight: 600; font-size: 14px; }
    .plan-notes { font-size: 12px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .status-badge { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; }
    .status-draft  { background: #f1f5f9; color: #475569; }
    .status-active { background: #dbeafe; color: #1d4ed8; }
    .status-closed { background: #dcfce7; color: #166534; }

    .items-count { font-size: 12px; font-family: 'IBM Plex Mono', monospace; color: #64748b; }

    /* Plan detail */
    .plan-detail { background: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 16px; margin-top: 12px; }
    .plan-detail-title { font-weight: 600; font-size: 14px; color: #1e40af; margin-bottom: 12px; }

    /* Items table */
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: .04em; padding: 8px 10px; border-bottom: 2px solid #e2e8f0; text-align: left; white-space: nowrap; }
    td { padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #eff6ff; }

    /* Modal */
    .modal-backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 9000; align-items: center; justify-content: center; }
    .modal-backdrop.open { display: flex; }
    .modal { background: #fff; border-radius: 12px; padding: 24px; width: min(480px, 94vw); max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.18); }
    .modal h2 { font-size: 16px; margin: 0 0 16px; color: #071C46; }
    .form-row { margin-bottom: 12px; }
    .form-row label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; }
    .form-row input, .form-row select, .form-row textarea { width: 100%; padding: 9px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font: inherit; font-size: 13px; background: #f8fafc; }
    .form-row input:focus, .form-row select:focus, .form-row textarea:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,.12); background: #fff; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }

    .loading { text-align: center; padding: 40px; color: #94a3b8; font-size: 13px; }
    .error-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 14px; color: #991b1b; font-size: 13px; margin-bottom: 12px; }

    .empty { text-align: center; padding: 40px 20px; color: #94a3b8; }
    .day-tag { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; background: #dbeafe; color: #1d4ed8; margin-right: 2px; }
  </style>
</head>
<body>
  <h1>Planejamento de Visitas</h1>
  <p class="subtitle">Planos semanais de visita por PDV e promotor</p>

  <div id="errorBox" class="error-box" style="display:none;"></div>

  <!-- Plans list -->
  <div class="section-card">
    <div class="section-header">
      <h2 class="section-title">Planos de Visita</h2>
      <button class="btn btn-primary" id="btnNewPlan">+ Novo Plano</button>
    </div>
    <div id="loadingPlans" class="loading">Carregando…</div>
    <div id="plansContainer"></div>
  </div>

  <!-- Plan detail panel -->
  <div id="planDetailPanel" style="display:none;">
    <div class="section-card">
      <div class="section-header">
        <h2 class="section-title" id="detailTitle">Detalhes do Plano</h2>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm" id="btnAddItem">+ Adicionar Item</button>
          <button class="btn btn-sm" id="btnExportPlan">⬇ CSV</button>
          <button class="btn btn-sm" id="btnCloseDetail">✕ Fechar</button>
        </div>
      </div>
      <div id="detailLoadingItems" class="loading" style="display:none;">Carregando itens…</div>
      <div class="plan-detail">
        <div class="plan-detail-title" id="detailMeta"></div>
        <table>
          <thead>
            <tr>
              <th>PDV</th>
              <th>Promotor</th>
              <th>Dia</th>
              <th>Horário</th>
              <th>Frequência</th>
              <th>Notas</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="itemsTableBody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Modal: New / Edit Plan -->
  <div class="modal-backdrop" id="modalPlan">
    <div class="modal">
      <h2 id="modalPlanTitle">Novo Plano de Visita</h2>
      <div class="error-box" id="modalPlanError" style="display:none;"></div>
      <div class="form-row">
        <label>Semana (ex: 2024-W48 ou "Week 48")</label>
        <input id="planWeek" placeholder="Ex: 2024-W48" />
      </div>
      <div class="form-row">
        <label>Status</label>
        <select id="planStatus">
          <option value="draft">Rascunho</option>
          <option value="active">Ativo</option>
          <option value="closed">Encerrado</option>
        </select>
      </div>
      <div class="form-row">
        <label>Notas</label>
        <textarea id="planNotes" rows="2" placeholder="Observações sobre o plano…"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn" id="btnCancelPlan">Cancelar</button>
        <button class="btn btn-primary" id="btnSavePlan">Salvar</button>
      </div>
    </div>
  </div>

  <!-- Modal: New / Edit Item -->
  <div class="modal-backdrop" id="modalItem">
    <div class="modal">
      <h2 id="modalItemTitle">Adicionar Item ao Plano</h2>
      <div class="error-box" id="modalItemError" style="display:none;"></div>
      <div class="form-row">
        <label>PDV</label>
        <select id="itemPdv"><option value="">Selecione um PDV…</option></select>
      </div>
      <div class="form-row">
        <label>Promotor</label>
        <select id="itemPerson"><option value="">Selecione o promotor…</option></select>
      </div>
      <div class="form-row">
        <label>Dia da semana</label>
        <select id="itemDay">
          <option value="">Sem dia fixo</option>
          <option value="0">Domingo</option>
          <option value="1">Segunda-feira</option>
          <option value="2">Terça-feira</option>
          <option value="3">Quarta-feira</option>
          <option value="4">Quinta-feira</option>
          <option value="5">Sexta-feira</option>
          <option value="6">Sábado</option>
        </select>
      </div>
      <div class="form-row">
        <label>Horário (opcional)</label>
        <input id="itemTime" type="time" placeholder="09:00">
      </div>
      <div class="form-row">
        <label>Frequência</label>
        <select id="itemFreq">
          <option value="weekly">Semanal</option>
          <option value="biweekly">Quinzenal</option>
          <option value="monthly">Mensal</option>
        </select>
      </div>
      <div class="form-row">
        <label>Notas</label>
        <input id="itemNotes" placeholder="Observações…">
      </div>
      <div class="modal-footer">
        <button class="btn" id="btnCancelItem">Cancelar</button>
        <button class="btn btn-primary" id="btnSaveItem">Salvar</button>
      </div>
    </div>
  </div>

  <script>
    (function() {
      'use strict';

      const getSupabase = () => parent.window.CIA_SUPABASE;
      let wsId = null;
      let plans = [];
      let pdvList = [];
      let personList = [];
      let activePlanId = null;
      let editingPlanId = null;
      let editingItemId = null;

      const DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
      const FREQ_LABELS = { weekly: 'Semanal', biweekly: 'Quinzenal', monthly: 'Mensal' };

      window.addEventListener('message', ev => {
        try {
          if (ev.data?.type === 'CIA_POST_LOGIN' && ev.data.workspace_id)
            wsId = ev.data.workspace_id;
          if (ev.data?.type === 'CIA_ACTIVE_WORKSPACE' && ev.data.workspace_id) {
            wsId = ev.data.workspace_id;
            init();
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

      function escHtml(s) {
        return String(s == null ? '' : s)
          .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      }

      function showError(msg) { const b = document.getElementById('errorBox'); b.textContent = 'Erro: ' + msg; b.style.display = ''; }
      function hideError() { document.getElementById('errorBox').style.display = 'none'; }

      // ── Render plans list ──────────────────────────────────
      function renderPlans() {
        const cont = document.getElementById('plansContainer');
        document.getElementById('loadingPlans').style.display = 'none';
        if (!plans.length) {
          cont.innerHTML = '<div class="empty">Nenhum plano criado ainda.<br><small>Clique em "+ Novo Plano" para começar.</small></div>';
          return;
        }
        const statusLabel = { draft:'Rascunho', active:'Ativo', closed:'Encerrado' };
        cont.innerHTML = '<div class="plans-list">' +
          plans.map(p => {
            const cls = 'status-' + (p.status || 'draft');
            const lbl = statusLabel[p.status] || p.status;
            return '<div class="plan-row">' +
              '<div><div class="plan-week">' + escHtml(p.week) + '</div>' +
              '<div class="plan-notes">' + escHtml(p.notes || '') + '</div></div>' +
              '<div><span class="status-badge ' + cls + '">' + lbl + '</span></div>' +
              '<div class="items-count" id="cnt_' + p.id + '">…</div>' +
              '<button class="btn btn-sm btn-primary" data-pid="' + p.id + '" data-action="open">Abrir</button>' +
              '<button class="btn btn-sm" data-pid="' + p.id + '" data-action="edit">Editar</button>' +
              '<button class="btn btn-sm btn-danger" data-pid="' + p.id + '" data-action="delete">✕</button>' +
            '</div>';
          }).join('') +
          '</div>';

        // Load item counts
        plans.forEach(p => loadItemCount(p.id));
      }

      async function loadItemCount(planId) {
        const sb = getSupabase(); if (!sb) return;
        try {
          const { count } = await sb.from('visit_plan_items')
            .select('id', { count: 'exact', head: true })
            .eq('plan_id', planId);
          const el = document.getElementById('cnt_' + planId);
          if (el) el.textContent = (count || 0) + ' PDVs';
        } catch (_) {}
      }

      // ── Load plans ─────────────────────────────────────────
      async function loadPlans() {
        const sb = getSupabase();
        if (!sb) { showError('Supabase não disponível.'); return; }
        document.getElementById('loadingPlans').style.display = '';
        document.getElementById('plansContainer').innerHTML = '';
        try {
          wsId = await getWorkspaceId(sb);
          const { data, error } = await sb.from('visit_plans')
            .select('*')
            .eq('workspace_id', wsId)
            .order('created_at', { ascending: false });
          if (error) throw error;
          plans = data || [];
          renderPlans();
        } catch (err) {
          document.getElementById('loadingPlans').style.display = 'none';
          showError(err.message || String(err));
        }
      }

      // ── Load PDVs & People for dropdowns ──────────────────
      async function loadDropdowns() {
        const sb = getSupabase(); if (!sb || !wsId) return;
        try {
          const [pR, peR] = await Promise.all([
            sb.from('pdvs').select('id,name').eq('workspace_id', wsId).order('name').limit(1000),
            sb.from('people').select('id,name,role').eq('workspace_id', wsId).in('role', ['promotor','promoter']).order('name').limit(500)
          ]);
          pdvList   = pR.data || [];
          personList = peR.data || [];
        } catch (_) {}

        // Populate selects
        const sel1 = document.getElementById('itemPdv');
        const sel2 = document.getElementById('itemPerson');
        while (sel1.options.length > 1) sel1.remove(1);
        while (sel2.options.length > 1) sel2.remove(1);
        pdvList.forEach(p => {
          const o = document.createElement('option'); o.value = p.id; o.textContent = p.name; sel1.appendChild(o);
        });
        personList.forEach(p => {
          const o = document.createElement('option'); o.value = p.id; o.textContent = p.name; sel2.appendChild(o);
        });
      }

      // ── Open plan detail ───────────────────────────────────
      async function openPlan(planId) {
        activePlanId = planId;
        const plan = plans.find(p => p.id === planId);
        if (!plan) return;
        document.getElementById('detailTitle').textContent = 'Plano: ' + plan.week;
        document.getElementById('detailMeta').textContent =
          'Semana: ' + plan.week + ' | Status: ' + (plan.status || 'draft') + (plan.notes ? ' | ' + plan.notes : '');
        document.getElementById('planDetailPanel').style.display = '';
        await loadItems(planId);
      }

      async function loadItems(planId) {
        const sb = getSupabase(); if (!sb) return;
        document.getElementById('detailLoadingItems').style.display = '';
        document.getElementById('itemsTableBody').innerHTML = '';
        try {
          const { data, error } = await sb.from('visit_plan_items')
            .select('*')
            .eq('plan_id', planId)
            .order('day_of_week');
          if (error) throw error;
          renderItems(data || []);
        } catch (err) {
          showError(err.message);
        }
        document.getElementById('detailLoadingItems').style.display = 'none';
      }

      function renderItems(items) {
        const tbody = document.getElementById('itemsTableBody');
        if (!items.length) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#94a3b8;">Nenhum PDV no plano. Clique em "+ Adicionar Item".</td></tr>';
          return;
        }
        const pdvMap    = Object.fromEntries(pdvList.map(p => [p.id, p.name]));
        const personMap = Object.fromEntries(personList.map(p => [p.id, p.name]));
        tbody.innerHTML = items.map(it => {
          const pdvName    = pdvMap[it.pdv_id]    || it.pdv_id    || '–';
          const personName = personMap[it.person_id] || it.person_id || '–';
          const dayTag     = it.day_of_week != null ? '<span class="day-tag">' + (DAYS[it.day_of_week] || it.day_of_week) + '</span>' : '–';
          const freq       = FREQ_LABELS[it.frequency] || it.frequency || 'Semanal';
          return '<tr>' +
            '<td>' + escHtml(pdvName) + '</td>' +
            '<td>' + escHtml(personName) + '</td>' +
            '<td>' + dayTag + '</td>' +
            '<td>' + escHtml(it.visit_time || '–') + '</td>' +
            '<td>' + escHtml(freq) + '</td>' +
            '<td style="max-width:100px;overflow:hidden;text-overflow:ellipsis;">' + escHtml(it.notes || '') + '</td>' +
            '<td>' +
              '<button class="btn btn-sm" data-iid="' + it.id + '" data-action="edit-item">Editar</button> ' +
              '<button class="btn btn-sm btn-danger" data-iid="' + it.id + '" data-action="del-item">✕</button>' +
            '</td>' +
          '</tr>';
        }).join('');
      }

      // ── CRUD helpers ───────────────────────────────────────
      async function savePlan() {
        const sb = getSupabase(); if (!sb) return;
        hideModalError('modalPlan');
        const week   = document.getElementById('planWeek').value.trim();
        const status = document.getElementById('planStatus').value;
        const notes  = document.getElementById('planNotes').value.trim();
        if (!week) { showModalError('modalPlan', 'Informe a semana.'); return; }

        try {
          if (editingPlanId) {
            const { error } = await sb.from('visit_plans')
              .update({ week, status, notes, updated_at: new Date().toISOString() })
              .eq('id', editingPlanId);
            if (error) throw error;
          } else {
            const { error } = await sb.from('visit_plans')
              .insert({ workspace_id: wsId, week, status, notes });
            if (error) throw error;
          }
          closeModal('modalPlan');
          await loadPlans();
        } catch (err) {
          showModalError('modalPlan', err.message || String(err));
        }
      }

      async function deletePlan(planId) {
        if (!confirm('Excluir este plano e todos os seus itens?')) return;
        const sb = getSupabase(); if (!sb) return;
        try {
          await sb.from('visit_plan_items').delete().eq('plan_id', planId);
          const { error } = await sb.from('visit_plans').delete().eq('id', planId);
          if (error) throw error;
          if (activePlanId === planId) {
            activePlanId = null;
            document.getElementById('planDetailPanel').style.display = 'none';
          }
          await loadPlans();
        } catch (err) { showError(err.message); }
      }

      async function saveItem() {
        const sb = getSupabase(); if (!sb) return;
        hideModalError('modalItem');
        const pdvId    = document.getElementById('itemPdv').value;
        const personId = document.getElementById('itemPerson').value;
        const day      = document.getElementById('itemDay').value;
        const time     = document.getElementById('itemTime').value;
        const freq     = document.getElementById('itemFreq').value;
        const notes    = document.getElementById('itemNotes').value.trim();
        if (!pdvId) { showModalError('modalItem', 'Selecione um PDV.'); return; }

        const payload = {
          workspace_id: wsId,
          plan_id: activePlanId,
          pdv_id: pdvId,
          person_id: personId || null,
          day_of_week: day !== '' ? parseInt(day) : null,
          visit_time: time || null,
          frequency: freq,
          notes: notes || null
        };

        try {
          if (editingItemId) {
            const { error } = await sb.from('visit_plan_items')
              .update({ pdv_id: pdvId, person_id: payload.person_id, day_of_week: payload.day_of_week, visit_time: payload.visit_time, frequency: freq, notes: payload.notes })
              .eq('id', editingItemId);
            if (error) throw error;
          } else {
            const { error } = await sb.from('visit_plan_items').insert(payload);
            if (error) throw error;
          }
          closeModal('modalItem');
          await loadItems(activePlanId);
          loadItemCount(activePlanId);
        } catch (err) {
          showModalError('modalItem', err.message || String(err));
        }
      }

      async function deleteItem(itemId) {
        if (!confirm('Remover este PDV do plano?')) return;
        const sb = getSupabase(); if (!sb) return;
        try {
          const { error } = await sb.from('visit_plan_items').delete().eq('id', itemId);
          if (error) throw error;
          await loadItems(activePlanId);
          loadItemCount(activePlanId);
        } catch (err) { showError(err.message); }
      }

      // ── Modal helpers ──────────────────────────────────────
      function openModal(id) { document.getElementById(id).classList.add('open'); }
      function closeModal(id) { document.getElementById(id).classList.remove('open'); }
      function showModalError(modalId, msg) {
        const b = document.getElementById(modalId + 'Error'); b.textContent = msg; b.style.display = '';
      }
      function hideModalError(modalId) {
        const b = document.getElementById(modalId + 'Error'); if (b) b.style.display = 'none';
      }

      // ── Export plan as CSV ──────────────────────────────────
      async function exportPlan() {
        const sb = getSupabase(); if (!sb || !activePlanId) return;
        try {
          const { data } = await sb.from('visit_plan_items').select('*').eq('plan_id', activePlanId);
          const rows = data || [];
          const pdvMap    = Object.fromEntries(pdvList.map(p => [p.id, p.name]));
          const personMap = Object.fromEntries(personList.map(p => [p.id, p.name]));
          const header = ['pdv_id','pdv_name','person_id','person_name','day_of_week','day_label','visit_time','frequency','notes'];
          const lines  = [header.join(';')];
          rows.forEach(r => {
            lines.push([
              r.pdv_id || '', pdvMap[r.pdv_id] || '',
              r.person_id || '', personMap[r.person_id] || '',
              r.day_of_week ?? '', r.day_of_week != null ? (DAYS[r.day_of_week] || '') : '',
              r.visit_time || '', r.frequency || '', (r.notes || '').replace(/;/g, ',')
            ].join(';'));
          });
          const blob = new Blob([lines.join('\\n')], { type: 'text/csv;charset=utf-8' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          const plan = plans.find(p => p.id === activePlanId);
          a.download = 'plano_' + (plan ? plan.week : activePlanId) + '.csv';
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 500);
        } catch (err) { showError(err.message); }
      }

      // ── Event delegation ───────────────────────────────────
      document.getElementById('plansContainer').addEventListener('click', async e => {
        const btn = e.target.closest('[data-action]'); if (!btn) return;
        const planId = btn.getAttribute('data-pid');
        const action = btn.getAttribute('data-action');
        if (action === 'open')   { await loadDropdowns(); await openPlan(planId); }
        if (action === 'edit')   {
          const p = plans.find(x => x.id === planId);
          if (!p) return;
          editingPlanId = planId;
          document.getElementById('modalPlanTitle').textContent = 'Editar Plano';
          document.getElementById('planWeek').value  = p.week || '';
          document.getElementById('planStatus').value = p.status || 'draft';
          document.getElementById('planNotes').value  = p.notes || '';
          openModal('modalPlan');
        }
        if (action === 'delete') await deletePlan(planId);
      });

      document.getElementById('itemsTableBody').addEventListener('click', async e => {
        const btn = e.target.closest('[data-action]'); if (!btn) return;
        const itemId = btn.getAttribute('data-iid');
        const action = btn.getAttribute('data-action');
        if (action === 'del-item') await deleteItem(itemId);
        if (action === 'edit-item') {
          // Fetch item and populate modal
          const sb = getSupabase();
          try {
            const { data } = await sb.from('visit_plan_items').select('*').eq('id', itemId).single();
            if (!data) return;
            editingItemId = itemId;
            document.getElementById('modalItemTitle').textContent = 'Editar Item';
            document.getElementById('itemPdv').value    = data.pdv_id || '';
            document.getElementById('itemPerson').value = data.person_id || '';
            document.getElementById('itemDay').value    = data.day_of_week != null ? String(data.day_of_week) : '';
            document.getElementById('itemTime').value   = data.visit_time || '';
            document.getElementById('itemFreq').value   = data.frequency || 'weekly';
            document.getElementById('itemNotes').value  = data.notes || '';
            openModal('modalItem');
          } catch (err) { showError(err.message); }
        }
      });

      document.getElementById('btnNewPlan').addEventListener('click', () => {
        editingPlanId = null;
        document.getElementById('modalPlanTitle').textContent = 'Novo Plano de Visita';
        document.getElementById('planWeek').value   = '';
        document.getElementById('planStatus').value = 'draft';
        document.getElementById('planNotes').value  = '';
        openModal('modalPlan');
      });

      document.getElementById('btnSavePlan').addEventListener('click', savePlan);
      document.getElementById('btnCancelPlan').addEventListener('click', () => closeModal('modalPlan'));

      document.getElementById('btnAddItem').addEventListener('click', async () => {
        editingItemId = null;
        await loadDropdowns();
        document.getElementById('modalItemTitle').textContent = 'Adicionar Item ao Plano';
        document.getElementById('itemPdv').value    = '';
        document.getElementById('itemPerson').value = '';
        document.getElementById('itemDay').value    = '';
        document.getElementById('itemTime').value   = '';
        document.getElementById('itemFreq').value   = 'weekly';
        document.getElementById('itemNotes').value  = '';
        openModal('modalItem');
      });

      document.getElementById('btnSaveItem').addEventListener('click', saveItem);
      document.getElementById('btnCancelItem').addEventListener('click', () => closeModal('modalItem'));
      document.getElementById('btnExportPlan').addEventListener('click', exportPlan);
      document.getElementById('btnCloseDetail').addEventListener('click', () => {
        activePlanId = null;
        document.getElementById('planDetailPanel').style.display = 'none';
      });

      // Close modals on backdrop click
      ['modalPlan','modalItem'].forEach(id => {
        document.getElementById(id).addEventListener('click', e => {
          if (e.target === e.currentTarget) closeModal(id);
        });
      });

      // ── Init ─────────────────────────────────────────────
      async function init() {
        hideError();
        await loadPlans();
      }

      window.addEventListener('DOMContentLoaded', () => setTimeout(init, 150));
    })();
  </script>
</body>
</html>`;

  frame.srcdoc = html;
}
