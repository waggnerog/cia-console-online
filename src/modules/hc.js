// CIA Console — HC module (people/headcount CRUD + assignments/CSV import)
export function initHc(frame) {
  const html = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Headcount</title>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>
        body { margin: 0; font-family: 'IBM Plex Sans', system-ui, sans-serif; background: #f8fafc; color: #0f172a; padding: 20px; }
        h1 { font-size: 20px; margin-bottom: 20px; color: #071C46; }
        .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 14px; }
        th { font-weight: 600; color: #475569; }
        button { background: #1A7A3A; color: #fff; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-size: 14px; }
        button:hover { background: #145e2c; }
        .btn-edit { background: #071C46; margin-right: 5px; }
        .btn-edit:hover { background: #071B42; }
        .btn-secondary { background: #cbd5e1; color: #0f172a; }
        .btn-secondary:hover { background: #94a3b8; }
        input, select { padding: 8px; border: 1px solid #cbd5e1; border-radius: 4px; width: 100%; box-sizing: border-box; margin-bottom: 10px; }

        .modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; }
        .modal.active { display: flex; }
        .modal-content { background: #fff; padding: 20px; border-radius: 8px; width: 400px; max-width: 90%; max-height: 90vh; overflow-y: auto; }

        .tabs { display: flex; border-bottom: 1px solid #cbd5e1; margin-bottom: 15px; }
        .tab { padding: 8px 16px; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab.active { border-bottom-color: #1A7A3A; font-weight: bold; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }

        .filters { display: flex; gap: 10px; margin-bottom: 15px; }
        .filters input, .filters select { width: auto; margin-bottom: 0; }

        #assignmentsList { font-size: 13px; }
        .assignment-item { border: 1px solid #e2e8f0; padding: 8px; margin-bottom: 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
      </style>
    </head>
    <body>
      <h1>Headcount (People)</h1>

      <div class="card">
        <div class="filters">
          <input type="text" id="searchName" placeholder="Buscar nome...">
          <select id="filterRole">
            <option value="">Todas as Roles</option>
            <option value="promotor">Promotor</option>
            <option value="supervisor">Supervisor</option>
            <option value="coordenador">Coordenador</option>
            <option value="gerente">Gerente</option>
            <option value="admin">Admin</option>
            <option value="bko">BKO</option>
          </select>
          <select id="filterStatus">
            <option value="">Status: Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <button id="btnSearch">Filtrar</button>
          <button id="btnOpenImport" style="background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;">&#8679; Importar CSV</button>
          <button id="btnNew">+ Nova Pessoa</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Role</th>
              <th>Email</th>
              <th>WhatsApp</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="peopleTableBody">
            <tr><td colspan="6" id="hcLoadingRow">Carregando...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Pessoa -->
      <div id="modalPerson" class="modal">
        <div class="modal-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h2 id="modalTitle" style="margin:0; font-size:18px;">Pessoa</h2>
            <button class="btn-secondary" id="btnCloseModal" style="padding:4px 8px;">✕</button>
          </div>

          <div class="tabs">
            <div class="tab active" data-target="tabDados">Dados</div>
            <div class="tab" id="tabAlocacoesTrigger" data-target="tabAlocacoes" style="display:none;">Alocações</div>
          </div>

          <div id="tabDados" class="tab-content active">
            <form id="formPerson">
              <input type="hidden" id="personId">
              <label>Nome *</label>
              <input type="text" id="pName" required>

              <label>Role *</label>
              <select id="pRole" required>
                <option value="promotor">Promotor</option>
                <option value="supervisor">Supervisor</option>
                <option value="coordenador">Coordenador</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Admin</option>
                <option value="bko">BKO</option>
              </select>

              <label>Email</label>
              <input type="email" id="pEmail">

              <label>WhatsApp</label>
              <input type="text" id="pPhone" placeholder="55 11 99999-9999">
              <div id="pPhoneDisplay" style="font-size:11px;color:#1A7A3A;margin-top:2px;font-family:'IBM Plex Mono',monospace;"></div>

              <label>Manager (pessoa responsável)</label>
              <select id="pManagerId">
                <option value="">— Sem manager —</option>
              </select>

              <label style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="pActive" style="width:auto;" checked> Ativo
              </label>

              <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                <button type="button" class="btn-secondary" id="btnCancel">Cancelar</button>
                <button type="submit">Salvar</button>
              </div>
            </form>
          </div>

          <div id="tabAlocacoes" class="tab-content">
            <div style="margin-bottom:10px; font-size:13px; color:#475569;">Alocações atuais em PDVs:</div>
            <div id="assignmentsList">Carregando...</div>
            <hr style="border:0; border-top:1px solid #e2e8f0; margin:15px 0;">
            <form id="formAssignment">
              <label>Nova Alocação (PDV ID) *</label>
              <input type="text" id="aPdvId" placeholder="UUID do PDV" required>
              <label>Papel na loja *</label>
              <select id="aRole" required>
                <option value="promotor_principal">Promotor Principal</option>
                <option value="promotor_backup">Promotor Backup</option>
                <option value="supervisor_resp">Supervisor Responsável</option>
                <option value="coord_resp">Coordenador Responsável</option>
              </select>
              <label style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="aPrimary" style="width:auto;"> É o principal da rota?
              </label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
                <div><label>Vigência: início</label><input type="date" id="aStartAt" style="width:100%;"></div>
                <div><label>Vigência: fim (opcional)</label><input type="date" id="aEndAt" style="width:100%;"></div>
              </div>
              <button type="submit" style="width:100%; margin-top:10px;">Vincular PDV</button>
            </form>
          </div>
        </div>
      </div>

      <script>
        // lazy getter: CIA_SUPABASE is set only after login
        const getSupabase = () => parent.window.CIA_SUPABASE;

        let allPeople = [];
        let currentWorkspaceId = null;
        let currentPersonId = null;
        let csvRows = [];

        function getBootstrapState() {
          try {
            return parent.window.CIA_BOOTSTRAP?.getWorkspaceResolution?.() || null;
          } catch (_) {
            return null;
          }
        }

        function renderWorkspaceMessage(msg) {
          const tbody = document.getElementById('peopleTableBody');
          if (!tbody) return;
          tbody.innerHTML = '<tr><td colspan="6">' + msg + '</td></tr>';
        }

        async function resolveWorkspaceContext() {
          if (currentWorkspaceId) return { workspaceId: currentWorkspaceId };
          const boot = getBootstrapState();
          const bootWsId = boot?.activeWorkspaceId || parent.window.CIA_CTX?.workspaceActive || null;
          if (bootWsId) {
            currentWorkspaceId = bootWsId;
            return { workspaceId: currentWorkspaceId };
          }
          if (boot?.status === 'loading') {
            renderWorkspaceMessage('Carregando workspace...');
            return null;
          }
          if (boot?.status === 'selection_required') {
            renderWorkspaceMessage('Selecione um workspace no menu lateral para continuar.');
            return null;
          }
          if (boot?.status === 'no_workspace') {
            renderWorkspaceMessage('Nenhum workspace vinculado ao seu usuário.');
            return null;
          }
          if (boot?.status === 'incomplete' || boot?.status === 'error') {
            renderWorkspaceMessage(boot.message || 'Erro ao carregar workspace.');
            return null;
          }

          const sb = getSupabase();
          if (!sb) return null;
          const { data: { user } } = await sb.auth.getUser();
          if (!user) {
            renderWorkspaceMessage('Sem sessão.');
            return null;
          }
          const { data: wusers, error } = await sb.from('workspace_users')
            .select('workspace_id,is_active')
            .eq('user_id', user.id)
            .or('is_active.eq.true,is_active.is.null');
          if (error) {
            renderWorkspaceMessage('Erro ao consultar workspace_users.');
            return null;
          }
          if (!wusers || !wusers.length) {
            renderWorkspaceMessage('Nenhum workspace vinculado ao seu usuário.');
            return null;
          }
          if (wusers.length > 1) {
            renderWorkspaceMessage('Selecione um workspace no menu lateral para continuar.');
            return null;
          }
          currentWorkspaceId = wusers[0].workspace_id;
          return { workspaceId: currentWorkspaceId };
        }

        // ── WhatsApp normalizer ─────────────────────────────────────
        function normalizeWA(raw) {
          if (!raw) return { digits: '', display: '' };
          const digits = String(raw).replace(/\D/g, '');
          if (!digits) return { digits: '', display: raw };
          let display = digits;
          if      (digits.length === 13) display = '+' + digits.slice(0,2) + ' (' + digits.slice(2,4) + ') ' + digits.slice(4,9) + '-' + digits.slice(9);
          else if (digits.length === 12) display = '+' + digits.slice(0,2) + ' (' + digits.slice(2,4) + ') ' + digits.slice(4,8) + '-' + digits.slice(8);
          else if (digits.length === 11) display = '(' + digits.slice(0,2) + ') ' + digits.slice(2,7) + '-' + digits.slice(7);
          else if (digits.length === 10) display = '(' + digits.slice(0,2) + ') ' + digits.slice(2,6) + '-' + digits.slice(6);
          return { digits, display };
        }

        async function init() {
          try {
            const resolved = await resolveWorkspaceContext();
            if(!resolved || !resolved.workspaceId) return;
            await loadPeople();
          } catch(e) { console.error(e); }
        }

        window.addEventListener("message", (ev) => {
          // hardening: only accept messages from the parent host
          if(!ev || ev.source !== window.parent) return;
          if(ev && ev.data && ev.data.type === "CIA_POST_LOGIN") {
            currentWorkspaceId = ev.data.workspace_id || null;
            init();
          }
          if(ev && ev.data && ev.data.type === "CIA_ACTIVE_WORKSPACE" && ev.data.workspace_id) {
            currentWorkspaceId = ev.data.workspace_id;
            loadPeople();
          }
        });

        async function loadPeople() {
          if (!currentWorkspaceId) {
            const resolved = await resolveWorkspaceContext();
            if (!resolved || !resolved.workspaceId) return;
          }
          const role   = document.getElementById('filterRole').value;
          const status = document.getElementById('filterStatus').value;

          let query = getSupabase().from('people').select('*').eq('workspace_id', currentWorkspaceId).order('name');
          if (role)             query = query.eq('role', role);
          if (status === 'active')   query = query.eq('is_active', true);
          if (status === 'inactive') query = query.eq('is_active', false);

          const { data, error } = await query;
          if (error) { console.error(error); return; }

          allPeople = data || [];
          await loadManagerOptions();
          renderTable();
        }

        async function loadManagerOptions() {
          const { data } = await getSupabase().from('people')
            .select('id, name, role')
            .eq('workspace_id', currentWorkspaceId)
            .eq('is_active', true)
            .in('role', ['supervisor','coordenador','gerente','admin'])
            .order('name');
          const sel = document.getElementById('pManagerId');
          if (!sel) return;
          const cur = sel.value;
          sel.innerHTML = '<option value="">— Sem manager —</option>';
          (data || []).forEach(p => {
            const o = document.createElement('option');
            o.value = p.id;
            o.textContent = p.name + ' (' + p.role + ')';
            sel.appendChild(o);
          });
          if (cur) sel.value = cur;
        }

        function renderTable() {
          const tbody = document.getElementById('peopleTableBody');
          const search = document.getElementById('searchName').value.toLowerCase();

          const filtered = allPeople.filter(p => p.name.toLowerCase().includes(search));

          if(filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Nenhuma pessoa encontrada.</td></tr>';
            return;
          }

          tbody.innerHTML = filtered.map(p => {
            const wa = normalizeWA(p.phone_whatsapp);
            const waHtml = wa.display
              ? '<a href="https://wa.me/' + escapeHTML(wa.digits) + '" target="_blank" style="color:#1A7A3A;text-decoration:none;font-family:\'IBM Plex Mono\',monospace;font-size:12px;">' + escapeHTML(wa.display) + '</a>'
              : '<span style="color:#94a3b8">—</span>';
            return \`<tr>
              <td><strong>\${escapeHTML(p.name)}</strong></td>
              <td>\${escapeHTML(p.role)}</td>
              <td>\${escapeHTML(p.email || '—')}</td>
              <td>\${waHtml}</td>
              <td>\${p.is_active ? '<span style="color:#15803d;font-weight:600;">Ativo</span>' : '<span style="color:#64748b;">Inativo</span>'}</td>
              <td>
                <button class="btn-edit" onclick="editPerson('\${escapeHTML(p.id)}')">Editar</button>
              </td>
            </tr>\`;
          }).join('');
        }

        function escapeHTML(str) {
          if(!str) return '';
          return String(str).replace(/[&<>'"]/g, tag => ({
              '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
          }[tag]));
        }

        window.editPerson = async (id) => {
          const p = allPeople.find(x => x.id === id);
          if(!p) return;
          currentPersonId = p.id;

          document.getElementById('personId').value = p.id;
          document.getElementById('pName').value = p.name || '';
          document.getElementById('pRole').value = p.role || 'promotor';
          document.getElementById('pEmail').value = p.email || '';
          document.getElementById('pPhone').value = p.phone_whatsapp || '';
          const waP = normalizeWA(p.phone_whatsapp || '');
          const pdEl = document.getElementById('pPhoneDisplay');
          if (pdEl) pdEl.textContent = waP.display || '';
          await loadManagerOptions();
          document.getElementById('pManagerId').value = p.manager_id || '';
          document.getElementById('pActive').checked = p.is_active;

          document.getElementById('modalTitle').innerText = 'Editar Pessoa';
          document.getElementById('tabAlocacoesTrigger').style.display = 'block';
          openModal();
          await loadAssignments(p.id);
        };

        async function loadAssignments(personId) {
          const list = document.getElementById('assignmentsList');
          list.innerHTML = 'Carregando...';
          const { data, error } = await getSupabase().from('assignments').select('*, pdvs(name)').eq('person_id', personId);
          if(error) { list.innerHTML = 'Erro ao carregar'; return; }

          if(!data || data.length === 0) {
            list.innerHTML = 'Sem alocações.';
            return;
          }

          list.innerHTML = data.map(a => \`
            <div class="assignment-item">
              <div>
                <strong>\${escapeHTML(a.pdvs?.name || a.pdv_id)}</strong><br>
                \${escapeHTML(a.assignment_role)} \${a.is_primary ? '(Principal)' : ''}
              </div>
              <button class="btn-secondary" onclick="removeAssignment('\${escapeHTML(a.id)}')" style="padding:4px 8px;font-size:12px;">Remover</button>
            </div>
          \`).join('');
        }

        window.removeAssignment = async (id) => {
          if(!confirm('Remover alocação?')) return;
          await getSupabase().from('assignments').delete().eq('id', id);
          if(currentPersonId) await loadAssignments(currentPersonId);
        };

        document.getElementById('formAssignment').addEventListener('submit', async (e) => {
          e.preventDefault();
          if(!currentPersonId) return;
          const startAt = document.getElementById('aStartAt');
          const endAt   = document.getElementById('aEndAt');
          const payload = {
            workspace_id:    currentWorkspaceId,
            person_id:       currentPersonId,
            pdv_id:          document.getElementById('aPdvId').value.trim(),
            assignment_role: document.getElementById('aRole').value,
            is_primary:      document.getElementById('aPrimary').checked,
            start_at:        (startAt && startAt.value) ? startAt.value : new Date().toISOString(),
            end_at:          (endAt   && endAt.value)   ? endAt.value   : null,
          };
          const { error } = await getSupabase().from('assignments').insert([payload]);
          if(error) alert('Erro: ' + error.message);
          else {
            document.getElementById('aPdvId').value = '';
            document.getElementById('aPrimary').checked = false;
            if (startAt) startAt.value = '';
            if (endAt)   endAt.value   = '';
            await loadAssignments(currentPersonId);
          }
        });

        document.getElementById('btnNew').addEventListener('click', () => {
          currentPersonId = null;
          document.getElementById('formPerson').reset();
          document.getElementById('personId').value = '';
          document.getElementById('modalTitle').innerText = 'Nova Pessoa';
          document.getElementById('tabAlocacoesTrigger').style.display = 'none';
          const disp = document.getElementById('pPhoneDisplay');
          if (disp) disp.textContent = '';
          document.querySelector('[data-target="tabDados"]').click();
          loadManagerOptions();
          openModal();
        });

        // Live WhatsApp display
        const pPhoneEl = document.getElementById('pPhone');
        if (pPhoneEl) pPhoneEl.addEventListener('input', function() {
          const wa = normalizeWA(this.value);
          const el = document.getElementById('pPhoneDisplay');
          if (el) el.textContent = wa.display || '';
        });

        document.getElementById('formPerson').addEventListener('submit', async (e) => {
          e.preventDefault();
          const id = document.getElementById('personId').value;
          const waInput = normalizeWA(document.getElementById('pPhone').value);
          const payload = {
            workspace_id: currentWorkspaceId,
            name: document.getElementById('pName').value.trim(),
            role: document.getElementById('pRole').value,
            email: document.getElementById('pEmail').value.trim() || null,
            phone_whatsapp: waInput.digits || null,
            manager_id: document.getElementById('pManagerId').value || null,
            is_active: document.getElementById('pActive').checked
          };

          let res;
          if(id) {
            res = await getSupabase().from('people').update(payload).eq('id', id);
          } else {
            res = await getSupabase().from('people').insert([payload]);
          }

          if(res.error) {
            alert('Erro ao salvar: ' + res.error.message);
          } else {
            closeModal();
            loadPeople();
          }
        });

        document.getElementById('btnSearch').addEventListener('click', loadPeople);
        document.getElementById('searchName').addEventListener('keyup', (e) => {
           if(e.key === 'Enter') loadPeople();
           else renderTable();
        });

        // ── CSV Import (overlay avançado) ─────────────────────────────
        function parseCsv(text) {
          const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(l=>l.trim());
          if (!lines.length) return [];
          const delim = lines[0].includes(';') ? ';' : ',';
          return lines.map(l => {
            const cols=[]; let cur=''; let inQ=false;
            for(let i=0;i<l.length;i++){
              const ch=l[i];
              if(inQ){if(ch==='"'){if(l[i+1]==='"'){cur+='"';i++;}else inQ=false;}else cur+=ch;}
              else{if(ch==='"')inQ=true;else if(ch===delim){cols.push(cur.trim());cur='';}else cur+=ch;}
            }
            cols.push(cur.trim()); return cols;
          });
        }
        function csvToObjs(headers, rows) {
          return rows.map(r => {
            const o={}; headers.forEach((h,i)=>{ o[h.toLowerCase().trim()]=r[i]??''; }); return o;
          });
        }

        function showToast(msg, isErr) {
          const t = document.createElement('div');
          t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:' + (isErr?'#dc2626':'#15803d') + ';color:#fff;padding:12px 20px;border-radius:8px;font-size:13px;font-family:\'IBM Plex Sans\',sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.2);';
          t.textContent = msg;
          document.body.appendChild(t);
          setTimeout(() => { t.style.transition='opacity .3s'; t.style.opacity='0'; setTimeout(()=>t.remove(),300); }, 3500);
        }

        function downloadHcTemplate() {
          const cols = 'name,role,email,phone_whatsapp,manager_email,is_active';
          const row1 = 'João Silva,promotor,joao@empresa.com,5511999990000,,true';
          const blob = new Blob([cols+'\n'+row1+'\n'], {type:'text/csv;charset=utf-8;'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href=url; a.download='modelo_pessoas.csv'; a.click();
          URL.revokeObjectURL(url);
        }

        const btnOpenImport = document.getElementById('btnOpenImport');
        if (btnOpenImport) btnOpenImport.addEventListener('click', () => {
          document.getElementById('hcImportFile').value = '';
          document.getElementById('hcPreviewSection').style.display  = 'none';
          document.getElementById('hcImportProgress').style.display  = 'none';
          document.getElementById('hcImportResult').style.display    = 'none';
          document.getElementById('hcErrorList').style.display       = 'none';
          document.getElementById('hcDetectedCols').textContent      = 'Nenhum arquivo carregado';
          csvRows = [];
          document.getElementById('hcImportOverlay').style.display = 'flex';
        });
        document.getElementById('hcDownloadTemplate').addEventListener('click', downloadHcTemplate);
        document.getElementById('hcCloseImport').addEventListener('click', () => {
          document.getElementById('hcImportOverlay').style.display = 'none';
        });
        document.getElementById('hcCancelImport').addEventListener('click', () => {
          document.getElementById('hcImportOverlay').style.display = 'none';
        });

        document.getElementById('hcImportFile').addEventListener('change', async (e) => {
          const file = e.target.files[0]; if(!file) return;
          const text = await file.text();
          const raw  = parseCsv(text);
          if (!raw.length) return;
          const headerRow = raw[0];
          const headers = headerRow.map(h => h.toLowerCase().trim());
          const requiredCols = ['name','role'];
          csvRows = csvToObjs(headerRow, raw.slice(1).filter(r=>r.some(c=>c)));
          document.getElementById('hcDetectedCols').textContent = headers.join(', ') || '—';
          const rowErrors = [];
          csvRows.forEach((r, i) => {
            const missing = requiredCols.filter(c => !r[c]);
            if (missing.length) rowErrors.push('Linha ' + (i+2) + ': campo(s) obrigatório(s) faltando — ' + missing.join(', '));
          });
          document.getElementById('hcImportCount').textContent = csvRows.length;
          const errCount = rowErrors.length;
          document.getElementById('hcPreviewSummary').innerHTML =
            '<b>' + csvRows.length + ' linha(s)</b>' +
            (errCount ? ' &nbsp;— <span style="color:#dc2626">' + errCount + ' com erro</span>' : ' &nbsp;<span style="color:#15803d">✓ Sem erros</span>');
          const errListEl = document.getElementById('hcErrorList');
          if (rowErrors.length) {
            errListEl.style.display = 'block';
            document.getElementById('hcErrorListItems').innerHTML = rowErrors.slice(0,20).map(e=>'<li>'+e+'</li>').join('');
          } else { errListEl.style.display = 'none'; }
          const displayH = headerRow.slice(0, 8);
          let th = '<thead><tr>' + displayH.map(h=>'<th style="padding:4px 8px;border:1px solid #e2e8f0;font-size:11px;background:#f8fafc;white-space:nowrap">'+h+'</th>').join('') + '</tr></thead>';
          let tb = '<tbody>' + csvRows.slice(0,20).map(r => {
            const isErr = !r.name || !r.role;
            return '<tr'+(isErr?' style="background:#fff7f7"':'')+'>'+
              displayH.map(h=>'<td style="padding:4px 8px;border:1px solid #e2e8f0;font-size:11px">'+(r[h.toLowerCase().trim()]||'')+'</td>').join('')+'</tr>';
          }).join('') + '</tbody>';
          document.getElementById('hcPreviewTable').innerHTML = th + tb;
          document.getElementById('hcPreviewSection').style.display = 'block';
          document.getElementById('hcImportResult').style.display = 'none';
          const confirmBtn = document.getElementById('hcConfirmImport');
          confirmBtn.disabled = errCount > 0;
          confirmBtn.style.opacity = errCount > 0 ? '0.5' : '1';
          confirmBtn.style.cursor  = errCount > 0 ? 'not-allowed' : 'pointer';
        });

        document.getElementById('hcConfirmImport').addEventListener('click', async () => {
          if (!csvRows.length) return;
          document.getElementById('hcPreviewSection').style.display  = 'none';
          document.getElementById('hcErrorList').style.display       = 'none';
          document.getElementById('hcImportProgress').style.display  = 'block';
          try {
            // Resolve manager_email → manager_id
            const managerEmails = [...new Set(csvRows.map(r=>r.manager_email||'').filter(e=>e))];
            let managerMap = {};
            if (managerEmails.length) {
              const { data: mgrs } = await getSupabase().from('people')
                .select('id,email').eq('workspace_id', currentWorkspaceId).in('email', managerEmails);
              (mgrs||[]).forEach(m => { if(m.email) managerMap[m.email.toLowerCase()] = m.id; });
            }
            const importErrors = [];
            const normalized = [];
            csvRows.forEach((r, i) => {
              const row = Object.assign({}, r);
              const wa = normalizeWA(row.phone_whatsapp);
              row.phone_whatsapp = wa.digits || null;
              if (row.manager_email) {
                const mid = managerMap[(row.manager_email||'').toLowerCase()];
                if (!mid) {
                  importErrors.push('Linha '+(i+2)+': manager_email "'+row.manager_email+'" não encontrado — linha rejeitada.');
                  return;
                }
                row.manager_id = mid;
              }
              delete row.manager_email;
              if (typeof row.is_active === 'string') row.is_active = row.is_active.toLowerCase() !== 'false' && row.is_active !== '0';
              normalized.push(row);
            });
            const { data, error } = await getSupabase().functions.invoke('csv-import', {
              body: { entity:'people', workspace_id: currentWorkspaceId, rows: normalized }
            });
            document.getElementById('hcImportProgress').style.display = 'none';
            document.getElementById('hcImportResult').style.display   = 'block';
            if (error || !data) {
              document.getElementById('hcImportResult').innerHTML = '<span style="color:#dc2626">Erro: Edge Function não respondeu. Verifique se foi publicada.</span>';
              showToast('Erro ao importar', true);
              return;
            }
            const { inserted=0, updated=0, rejected=0, errors=[] } = data;
            const allErrors = importErrors.concat(errors);
            document.getElementById('hcImportResult').innerHTML =
              '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px;">' +
              '<span style="color:#15803d;font-weight:600;">✓ ' + inserted + ' inseridos</span>' +
              '<span style="font-weight:600;">' + updated + ' atualizados</span>' +
              ((rejected||importErrors.length) ? '<span style="color:#dc2626;font-weight:600;">✗ '+(rejected+importErrors.length)+' rejeitados</span>' : '') +
              '</div>' +
              (allErrors.length ? '<div style="background:#fff7f7;border:1px solid #fecaca;border-radius:6px;padding:8px 12px;font-size:12px;color:#dc2626;max-height:120px;overflow-y:auto;"><ul style="margin:0;padding-left:16px;">'+allErrors.slice(0,20).map(e=>'<li>'+e+'</li>').join('')+'</ul></div>' : '');
            loadPeople();
            if (!rejected && !importErrors.length) showToast('Importação concluída: '+inserted+' inseridos, '+updated+' atualizados');
            else showToast('Importação com '+(rejected+importErrors.length)+' rejeitados', true);
          } catch(err) {
            document.getElementById('hcImportProgress').style.display = 'none';
            document.getElementById('hcImportResult').style.display   = 'block';
            document.getElementById('hcImportResult').innerHTML = '<span style="color:#dc2626">Erro: ' + String(err?.message||err) + '</span>';
            showToast('Erro inesperado ao importar', true);
          }
        });

        // Tabs
        document.querySelectorAll('.tab').forEach(t => {
          t.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            document.getElementById(t.getAttribute('data-target')).classList.add('active');
          });
        });

        function openModal() { document.getElementById('modalPerson').classList.add('active'); }
        function closeModal() { document.getElementById('modalPerson').classList.remove('active'); }
        document.getElementById('btnCloseModal').addEventListener('click', closeModal);
        document.getElementById('btnCancel').addEventListener('click', closeModal);

        init();
      </script>

      <!-- ── CSV Import Overlay ─────────────────────────────────── -->
      <div id="hcImportOverlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;align-items:flex-start;justify-content:center;padding:30px 16px;overflow-y:auto;">
        <div style="background:#fff;border-radius:12px;padding:24px;width:720px;max-width:100%;box-shadow:0 20px 40px rgba(0,0,0,.15);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <h2 style="margin:0;font-size:17px;color:#071C46;font-weight:600;">Importar CSV — Pessoas (HC)</h2>
            <button id="hcCloseImport" style="background:#f1f5f9;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:16px;color:#475569;">&#x2715;</button>
          </div>
          <div style="display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
            <div style="flex:1;font-size:12px;color:#64748b;line-height:1.6;">Obrigatórios: <strong>name, role</strong> &nbsp;·&nbsp; Recomendados: email, phone_whatsapp, manager_email, is_active &nbsp;·&nbsp; Chave upsert: workspace_id + email</div>
            <button id="hcDownloadTemplate" style="white-space:nowrap;background:#f0fdf4;color:#1A7A3A;border:1px solid #bbf7d0;border-radius:6px;padding:6px 12px;cursor:pointer;font-size:12px;font-weight:500;">⬇ Baixar modelo CSV</button>
          </div>
          <div style="font-size:12px;color:#475569;margin-bottom:10px;padding:6px 10px;background:#f8fafc;border-radius:4px;border:1px solid #e2e8f0;">
            <strong>Colunas detectadas:</strong> <span id="hcDetectedCols" style="font-family:monospace;color:#0f172a;">Nenhum arquivo carregado</span>
          </div>
          <label style="display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:10px;">
            Selecionar arquivo CSV:
            <input type="file" id="hcImportFile" accept=".csv,text/csv" style="display:block;margin-top:6px;font-size:13px;width:100%;box-sizing:border-box;">
          </label>
          <div id="hcPreviewSection" style="display:none;">
            <div style="font-size:13px;font-weight:600;margin-bottom:6px;color:#374151;">Preview (primeiras 20 linhas)</div>
            <div style="overflow-x:auto;max-height:260px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:6px;"><table id="hcPreviewTable" style="border-collapse:collapse;width:100%;min-width:400px;"></table></div>
            <div id="hcPreviewSummary" style="margin:10px 0 6px;font-size:13px;"></div>
            <div id="hcErrorList" style="display:none;background:#fff7f7;border:1px solid #fecaca;border-radius:6px;padding:8px 12px;margin-bottom:10px;max-height:120px;overflow-y:auto;">
              <div style="font-size:12px;font-weight:600;color:#dc2626;margin-bottom:4px;">Erros de validação:</div>
              <ul id="hcErrorListItems" style="font-size:12px;color:#dc2626;margin:0;padding-left:16px;line-height:1.6;"></ul>
            </div>
            <div style="display:flex;gap:8px;margin-top:12px;">
              <button id="hcConfirmImport" style="flex:1;background:#1A7A3A;color:#fff;border:none;border-radius:6px;padding:10px;cursor:pointer;font-size:14px;font-weight:500;">Importar <span id="hcImportCount">0</span> linha(s)</button>
              <button id="hcCancelImport" style="background:#f1f5f9;color:#374151;border:1px solid #e2e8f0;border-radius:6px;padding:10px 16px;cursor:pointer;font-size:13px;">Cancelar</button>
            </div>
          </div>
          <div id="hcImportProgress" style="display:none;text-align:center;padding:28px;color:#64748b;font-size:13px;">
            <div>⏳ Importando…</div>
            <div style="font-size:11px;margin-top:6px;">Aguarde, isso pode levar alguns segundos.</div>
          </div>
          <div id="hcImportResult" style="display:none;padding:10px 0;font-size:13px;"></div>
        </div>
      </div>
    </body>
    </html>
  `;
  frame.srcdoc = html;
}
