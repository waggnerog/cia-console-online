import { supabase } from '../lib/supabaseClient';

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
          <input type="text" id="filterManager" placeholder="Manager ID...">
          <button id="btnSearch">Filtrar</button>
          <input type="file" id="fileImportCsv" accept=".csv" style="display:none;">
          <button id="btnImportCsv" class="btn-secondary" style="margin-left: auto; margin-right: 10px;">Importar CSV</button>
          <button id="btnNew">+ Nova Pessoa</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Role</th>
              <th>Email</th>
              <th>Manager</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="peopleTableBody">
            <tr><td colspan="6">Carregando...</td></tr>
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
              <input type="text" id="pPhone">

              <label>Manager (ID Opcional por enquanto)</label>
              <input type="text" id="pManagerId" placeholder="UUID do manager">

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
                <option value="backup">Backup</option>
                <option value="supervisor">Supervisor</option>
                <option value="coordenador">Coordenador</option>
              </select>
              <label style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="aPrimary" style="width:auto;"> É o principal da rota?
              </label>
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

        async function init() {
          try {
            const { data: { user } } = await getSupabase().auth.getUser();
            if(!user) return;
            const { data: wusers } = await getSupabase().from('workspace_users').select('workspace_id').eq('user_id', user.id).limit(1);
            if(wusers && wusers.length > 0) {
              currentWorkspaceId = wusers[0].workspace_id;
              await loadPeople();
            }
          } catch(e) { console.error(e); }
        }

        window.addEventListener("message", (ev) => {
          // hardening: only accept messages from the parent host
          if(!ev || ev.source !== window.parent) return;
          if(ev && ev.data && ev.data.type === "CIA_POST_LOGIN") {
            // re-run init after login; discovers workspace via Supabase auth (handles wsId=null case)
            if(ev.data.workspace_id) currentWorkspaceId = ev.data.workspace_id;
            init();
          }
          if(ev && ev.data && ev.data.type === "CIA_ACTIVE_WORKSPACE" && ev.data.workspace_id) {
            currentWorkspaceId = ev.data.workspace_id;
            loadPeople();
          }
        });

        async function loadPeople() {
          const search = document.getElementById('searchName').value.toLowerCase();
          const role = document.getElementById('filterRole').value;
          const managerId = document.getElementById('filterManager').value.trim();

          let query = getSupabase().from('people').select('*').eq('workspace_id', currentWorkspaceId).order('name');
          if(role) query = query.eq('role', role);
          if(managerId) query = query.eq('manager_id', managerId);

          const { data, error } = await query;
          if(error) { console.error(error); return; }

          allPeople = data || [];
          renderTable();
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
            return \`<tr>
              <td>\${escapeHTML(p.name)}</td>
              <td>\${escapeHTML(p.role)}</td>
              <td>\${escapeHTML(p.email || '-')}</td>
              <td>\${escapeHTML(p.manager_id ? 'Sim' : '-')}</td>
              <td>\${escapeHTML(p.is_active ? 'Ativo' : 'Inativo')}</td>
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
                \${escapeHTML(a.assignment_role)} \${escapeHTML(a.is_primary ? '(Principal)' : '')}
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
          const payload = {
            workspace_id: currentWorkspaceId,
            person_id: currentPersonId,
            pdv_id: document.getElementById('aPdvId').value.trim(),
            assignment_role: document.getElementById('aRole').value,
            is_primary: document.getElementById('aPrimary').checked
          };
          const { error } = await getSupabase().from('assignments').insert([payload]);
          if(error) alert('Erro: ' + error.message);
          else {
            document.getElementById('aPdvId').value = '';
            await loadAssignments(currentPersonId);
          }
        });

        document.getElementById('btnNew').addEventListener('click', () => {
          currentPersonId = null;
          document.getElementById('formPerson').reset();
          document.getElementById('personId').value = '';
          document.getElementById('modalTitle').innerText = 'Nova Pessoa';
          document.getElementById('tabAlocacoesTrigger').style.display = 'none';
          document.querySelector('[data-target="tabDados"]').click();
          openModal();
        });

        document.getElementById('btnImportCsv').addEventListener('click', () => {
          document.getElementById('fileImportCsv').click();
        });

        document.getElementById('fileImportCsv').addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if(!file) return;
          const reader = new FileReader();
          reader.onload = async (ev) => {
            const text = ev.target.result;
            const lines = text.split('\\n');
            const payloads = [];
            for(let i=1; i<lines.length; i++){
              const line = lines[i].trim();
              if(!line) continue;
              const cols = line.split(/[,;]/);
              if(cols.length >= 2){
                payloads.push({
                  workspace_id: currentWorkspaceId,
                  name: cols[0].trim(),
                  role: cols[1].trim().toLowerCase() || 'promotor',
                  email: cols[2] ? cols[2].trim() : null
                });
              }
            }
            if(payloads.length > 0){
              const { error } = await getSupabase().from('people').insert(payloads);
              if(error) alert('Erro ao importar CSV: ' + error.message);
              else { alert('CSV Importado com sucesso!'); loadPeople(); }
            }
            document.getElementById('fileImportCsv').value = '';
          };
          reader.readAsText(file);
        });

        document.getElementById('formPerson').addEventListener('submit', async (e) => {
          e.preventDefault();
          const id = document.getElementById('personId').value;
          const payload = {
            workspace_id: currentWorkspaceId,
            name: document.getElementById('pName').value.trim(),
            role: document.getElementById('pRole').value,
            email: document.getElementById('pEmail').value.trim() || null,
            phone_whatsapp: document.getElementById('pPhone').value.trim() || null,
            manager_id: document.getElementById('pManagerId').value.trim() || null,
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
           else renderTable(); // live filter
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
    </body>
    </html>
  `;
  frame.srcdoc = html;
}
