import { supabase } from '../lib/supabaseClient';

export function initPdvs(frame) {
  const html = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>PDVs</title>
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
        .modal-content { background: #fff; padding: 20px; border-radius: 8px; width: 500px; max-width: 90%; max-height: 90vh; overflow-y: auto; }

        .tabs { display: flex; border-bottom: 1px solid #cbd5e1; margin-bottom: 15px; }
        .tab { padding: 8px 16px; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab.active { border-bottom-color: #1A7A3A; font-weight: bold; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }

        .filters { display: flex; gap: 10px; margin-bottom: 15px; }
        .filters input, .filters select { width: auto; margin-bottom: 0; }

        .list-item { border: 1px solid #e2e8f0; padding: 8px; margin-bottom: 8px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; }

        .row-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      </style>
    </head>
    <body>
      <h1>PDVs</h1>

      <div class="card">
        <div class="filters">
          <input type="text" id="searchName" placeholder="Buscar nome ou CNPJ...">
          <input type="text" id="filterCity" placeholder="Cidade">
          <select id="filterUf">
            <option value="">Todos UF</option>
            <option value="SP">SP</option><option value="RJ">RJ</option><option value="MG">MG</option><option value="BA">BA</option><option value="RS">RS</option>
            <!-- Outros UFs podem ser adicionados... -->
          </select>
          <input type="text" id="filterResp" placeholder="Responsável (UUID Pessoa)">
          <button id="btnSearch">Filtrar</button>
          <button id="btnNew" style="margin-left: auto;">+ Novo PDV</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>CNPJ</th>
              <th>Nome</th>
              <th>Cidade/UF</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="pdvsTableBody">
            <tr><td colspan="6">Carregando...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Modal PDV -->
      <div id="modalPdv" class="modal">
        <div class="modal-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h2 id="modalTitle" style="margin:0; font-size:18px;">PDV</h2>
            <button class="btn-secondary" id="btnCloseModal" style="padding:4px 8px;">✕</button>
          </div>

          <div class="tabs">
            <div class="tab active" data-target="tabDados">Dados</div>
            <div class="tab" id="tabTimeTrigger" data-target="tabTime" style="display:none;">Time</div>
            <div class="tab" id="tabProdutosTrigger" data-target="tabProdutos" style="display:none;">Produtos</div>
          </div>

          <div id="tabDados" class="tab-content active">
            <form id="formPdv">
              <input type="hidden" id="pdvId">

              <div class="row-grid">
                <div>
                  <label>Código Interno</label>
                  <input type="text" id="pCode">
                </div>
                <div>
                  <label>CNPJ</label>
                  <input type="text" id="pCnpj">
                </div>
              </div>

              <label>Nome do PDV *</label>
              <input type="text" id="pName" required>

              <label>Endereço Completo</label>
              <input type="text" id="pAddress">

              <div class="row-grid">
                <div>
                  <label>Cidade</label>
                  <input type="text" id="pCity">
                </div>
                <div>
                  <label>UF</label>
                  <input type="text" id="pUf" maxlength="2">
                </div>
              </div>

              <div class="row-grid">
                <div>
                  <label>Latitude</label>
                  <input type="number" step="any" id="pLat">
                </div>
                <div>
                  <label>Longitude</label>
                  <input type="number" step="any" id="pLng">
                </div>
              </div>

              <label style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="pActive" style="width:auto;" checked> Ativo
              </label>

              <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:20px;">
                <button type="button" class="btn-secondary" id="btnCancel">Cancelar</button>
                <button type="submit">Salvar</button>
              </div>
            </form>
          </div>

          <div id="tabTime" class="tab-content">
            <div style="margin-bottom:10px; font-size:13px; color:#475569;">Pessoas alocadas neste PDV:</div>
            <div id="assignmentsList">Carregando...</div>
            <hr style="border:0; border-top:1px solid #e2e8f0; margin:15px 0;">
            <form id="formAssignment">
              <label>Nova Alocação (UUID Pessoa) *</label>
              <input type="text" id="aPersonId" placeholder="UUID da Pessoa" required>
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
              <button type="submit" style="width:100%; margin-top:10px;">Vincular Pessoa</button>
            </form>
          </div>

          <div id="tabProdutos" class="tab-content">
            <div style="margin-bottom:10px; font-size:13px; color:#475569;">Produtos listados no PDV:</div>
            <div id="productsList">Carregando...</div>
            <hr style="border:0; border-top:1px solid #e2e8f0; margin:15px 0;">
            <form id="formPdvProduct">
              <label>Vincular Produto (UUID Produto) *</label>
              <input type="text" id="ppProductId" placeholder="UUID do Produto" required>
              <div class="row-grid">
                <div>
                  <label>Prioridade</label>
                  <input type="number" id="ppPriority" value="0">
                </div>
                <div>
                  <label style="display:flex; align-items:center; gap:8px; margin-top:30px;">
                    <input type="checkbox" id="ppListed" style="width:auto;" checked> Listado?
                  </label>
                </div>
              </div>
              <button type="submit" style="width:100%; margin-top:10px;">Vincular Produto</button>
            </form>
          </div>
        </div>
      </div>

      <script>
        const supabase = parent.window.CIA_SUPABASE;

        let allPdvs = [];
        let currentWorkspaceId = null;
        let currentPdvId = null;

        async function init() {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if(!user) return;
            const { data: wusers } = await supabase.from('workspace_users').select('workspace_id').eq('user_id', user.id).limit(1);
            if(wusers && wusers.length > 0) {
              currentWorkspaceId = wusers[0].workspace_id;
              await loadPdvs();
            }
          } catch(e) { console.error(e); }
        }

        window.addEventListener("message", (ev) => {
          if(ev && ev.data && ev.data.type === "CIA_ACTIVE_WORKSPACE" && ev.data.workspace_id) {
            currentWorkspaceId = ev.data.workspace_id;
            loadPdvs();
          }
        });

        async function loadPdvs() {
          const search = document.getElementById('searchName').value.toLowerCase();
          const uf = document.getElementById('filterUf').value;
          const city = document.getElementById('filterCity').value.trim().toLowerCase();
          const resp = document.getElementById('filterResp').value.trim();

          // Se tiver filtro de responsável (assignment), precisamos fazer um JOIN.
          // O mais performático no frontend seria primeiro buscar os assignments para a pessoa
          // e depois buscar os pdvs que estão em assignments.
          let pdvsIdsResp = null;
          if (resp) {
             const { data: aData } = await supabase.from('assignments').select('pdv_id').eq('workspace_id', currentWorkspaceId).eq('person_id', resp);
             if (aData) pdvsIdsResp = aData.map(a => a.pdv_id);
          }

          let query = supabase.from('pdvs').select('*').eq('workspace_id', currentWorkspaceId).order('name');
          if(uf) query = query.eq('uf', uf);

          if (pdvsIdsResp !== null) {
            query = query.in('id', pdvsIdsResp);
          }

          const { data, error } = await query;
          if(error) { console.error(error); return; }

          let result = data || [];
          if(city) {
            result = result.filter(p => p.city && p.city.toLowerCase().includes(city));
          }

          allPdvs = result;
          renderTable();
        }

        function renderTable() {
          const tbody = document.getElementById('pdvsTableBody');
          const search = document.getElementById('searchName').value.toLowerCase();

          const filtered = allPdvs.filter(p =>
            p.name.toLowerCase().includes(search) ||
            (p.cnpj && p.cnpj.includes(search)) ||
            (p.pdv_code && p.pdv_code.toLowerCase().includes(search))
          );

          if(filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Nenhum PDV encontrado.</td></tr>';
            return;
          }

          tbody.innerHTML = filtered.map(p => {
            return \`<tr>
              <td>\${escapeHTML(p.pdv_code || '-')}</td>
              <td>\${escapeHTML(p.cnpj || '-')}</td>
              <td>\${escapeHTML(p.name)}</td>
              <td>\${escapeHTML(p.city || '-')} / \${escapeHTML(p.uf || '-')}</td>
              <td>\${p.is_active ? 'Ativo' : 'Inativo'}</td>
              <td>
                <button class="btn-edit" onclick="editPdv('\${p.id}')">Editar</button>
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

        window.editPdv = async (id) => {
          const p = allPdvs.find(x => x.id === id);
          if(!p) return;
          currentPdvId = p.id;

          document.getElementById('pdvId').value = p.id;
          document.getElementById('pCode').value = p.pdv_code || '';
          document.getElementById('pCnpj').value = p.cnpj || '';
          document.getElementById('pName').value = p.name || '';
          document.getElementById('pAddress').value = p.address || '';
          document.getElementById('pCity').value = p.city || '';
          document.getElementById('pUf').value = p.uf || '';
          document.getElementById('pLat').value = p.lat || '';
          document.getElementById('pLng').value = p.lng || '';
          document.getElementById('pActive').checked = p.is_active;

          document.getElementById('modalTitle').innerText = 'Editar PDV';
          document.getElementById('tabTimeTrigger').style.display = 'block';
          document.getElementById('tabProdutosTrigger').style.display = 'block';

          openModal();
          await loadAssignments(p.id);
          await loadPdvProducts(p.id);
        };

        // --- Assignments (Time) ---
        async function loadAssignments(pdvId) {
          const list = document.getElementById('assignmentsList');
          list.innerHTML = 'Carregando...';
          const { data, error } = await supabase.from('assignments').select('*, people(name)').eq('pdv_id', pdvId);
          if(error) { list.innerHTML = 'Erro ao carregar'; return; }

          if(!data || data.length === 0) { list.innerHTML = 'Sem alocações.'; return; }

          list.innerHTML = data.map(a => \`
            <div class="list-item">
              <div>
                <strong>\${escapeHTML(a.people?.name || a.person_id)}</strong><br>
                \${escapeHTML(a.assignment_role)} \${a.is_primary ? '(Principal)' : ''}
              </div>
              <button class="btn-secondary" onclick="removeAssignment('\${a.id}')" style="padding:4px 8px;font-size:12px;">Remover</button>
            </div>
          \`).join('');
        }

        window.removeAssignment = async (id) => {
          if(!confirm('Remover alocação?')) return;
          await supabase.from('assignments').delete().eq('id', id);
          if(currentPdvId) await loadAssignments(currentPdvId);
        };

        document.getElementById('formAssignment').addEventListener('submit', async (e) => {
          e.preventDefault();
          if(!currentPdvId) return;
          const payload = {
            workspace_id: currentWorkspaceId,
            pdv_id: currentPdvId,
            person_id: document.getElementById('aPersonId').value.trim(),
            assignment_role: document.getElementById('aRole').value,
            is_primary: document.getElementById('aPrimary').checked
          };
          const { error } = await supabase.from('assignments').insert([payload]);
          if(error) alert('Erro: ' + error.message);
          else {
            document.getElementById('aPersonId').value = '';
            await loadAssignments(currentPdvId);
          }
        });

        // --- PDV Products (Mix) ---
        async function loadPdvProducts(pdvId) {
          const list = document.getElementById('productsList');
          list.innerHTML = 'Carregando...';
          const { data, error } = await supabase.from('pdv_products').select('*, products(name, sku_code)').eq('pdv_id', pdvId);
          if(error) { list.innerHTML = 'Erro ao carregar'; return; }

          if(!data || data.length === 0) { list.innerHTML = 'Nenhum produto listado.'; return; }

          list.innerHTML = data.map(p => \`
            <div class="list-item">
              <div>
                <strong>\${escapeHTML(p.products?.name || p.product_id)}</strong> (\${escapeHTML(p.products?.sku_code || 'sem sku')})<br>
                Listado: \${p.is_listed ? 'Sim' : 'Não'} | Prio: \${p.priority}
              </div>
              <button class="btn-secondary" onclick="removePdvProduct('\${p.id}')" style="padding:4px 8px;font-size:12px;">Remover</button>
            </div>
          \`).join('');
        }

        window.removePdvProduct = async (id) => {
          if(!confirm('Remover produto do PDV?')) return;
          await supabase.from('pdv_products').delete().eq('id', id);
          if(currentPdvId) await loadPdvProducts(currentPdvId);
        };

        document.getElementById('formPdvProduct').addEventListener('submit', async (e) => {
          e.preventDefault();
          if(!currentPdvId) return;
          const payload = {
            workspace_id: currentWorkspaceId,
            pdv_id: currentPdvId,
            product_id: document.getElementById('ppProductId').value.trim(),
            is_listed: document.getElementById('ppListed').checked,
            priority: parseInt(document.getElementById('ppPriority').value) || 0
          };
          const { error } = await supabase.from('pdv_products').insert([payload]);
          if(error) alert('Erro: ' + error.message);
          else {
            document.getElementById('ppProductId').value = '';
            await loadPdvProducts(currentPdvId);
          }
        });

        // --- Actions ---
        document.getElementById('btnNew').addEventListener('click', () => {
          currentPdvId = null;
          document.getElementById('formPdv').reset();
          document.getElementById('pdvId').value = '';
          document.getElementById('modalTitle').innerText = 'Novo PDV';
          document.getElementById('tabTimeTrigger').style.display = 'none';
          document.getElementById('tabProdutosTrigger').style.display = 'none';
          document.querySelector('[data-target="tabDados"]').click();
          openModal();
        });

        document.getElementById('formPdv').addEventListener('submit', async (e) => {
          e.preventDefault();
          const id = document.getElementById('pdvId').value;
          const payload = {
            workspace_id: currentWorkspaceId,
            pdv_code: document.getElementById('pCode').value.trim() || null,
            cnpj: document.getElementById('pCnpj').value.trim() || null,
            name: document.getElementById('pName').value.trim(),
            address: document.getElementById('pAddress').value.trim() || null,
            city: document.getElementById('pCity').value.trim() || null,
            uf: document.getElementById('pUf').value.trim().toUpperCase() || null,
            lat: parseFloat(document.getElementById('pLat').value) || null,
            lng: parseFloat(document.getElementById('pLng').value) || null,
            is_active: document.getElementById('pActive').checked
          };

          let res;
          if(id) {
            res = await supabase.from('pdvs').update(payload).eq('id', id);
          } else {
            res = await supabase.from('pdvs').insert([payload]);
          }

          if(res.error) {
            alert('Erro ao salvar: ' + res.error.message);
          } else {
            closeModal();
            loadPdvs();
          }
        });

        document.getElementById('btnSearch').addEventListener('click', loadPdvs);
        document.getElementById('searchName').addEventListener('keyup', (e) => {
           if(e.key === 'Enter') loadPdvs();
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

        function openModal() { document.getElementById('modalPdv').classList.add('active'); }
        function closeModal() { document.getElementById('modalPdv').classList.remove('active'); }
        document.getElementById('btnCloseModal').addEventListener('click', closeModal);
        document.getElementById('btnCancel').addEventListener('click', closeModal);

        init();
      </script>
    </body>
    </html>
  `;
  frame.srcdoc = html;
}
