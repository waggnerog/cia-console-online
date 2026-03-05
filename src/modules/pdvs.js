// CIA Console — PDVs module (CRUD + contacts + team + products + geo + CSV import)
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
            <option value="PR">PR</option><option value="SC">SC</option><option value="PE">PE</option><option value="CE">CE</option><option value="GO">GO</option>
            <option value="DF">DF</option><option value="AM">AM</option><option value="PA">PA</option><option value="MT">MT</option><option value="MS">MS</option>
          </select>
          <select id="filterStatus">
            <option value="">Status: Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <button id="btnSearch">Filtrar</button>
          <button id="btnOpenImportPdv" style="background:#ede9fe;color:#7c3aed;">&#8593; Importar CSV</button>
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
            <div class="tab" id="tabContatosTrigger" data-target="tabContatos" style="display:none;">Contatos</div>
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
                <button type="submit" id="btnSavePdv">Salvar</button>
              </div>
              <div id="geoWarning" style="display:none;background:#fef3c7;color:#92400e;border-radius:6px;padding:8px 12px;font-size:12px;margin-top:8px;"></div>
            </form>
          </div>

          <!-- Tab: Contatos do PDV -->
          <div id="tabContatos" class="tab-content">
            <div style="margin-bottom:10px; font-size:13px; color:#475569;">Contatos desta loja (gerente, encarregado…):</div>
            <div id="contactsList">Carregando...</div>
            <hr style="border:0; border-top:1px solid #e2e8f0; margin:15px 0;">
            <form id="formContact">
              <label>Nome do Contato *</label>
              <input type="text" id="cName" placeholder="Nome completo" required>
              <label>Cargo</label>
              <select id="cRole">
                <option value="gerente">Gerente</option>
                <option value="encarregado">Encarregado</option>
                <option value="subgerente">Subgerente</option>
                <option value="repositor">Repositor</option>
                <option value="outro">Outro</option>
              </select>
              <label>WhatsApp</label>
              <input type="tel" id="cPhone" placeholder="55 11 99999-9999">
              <div id="cPhoneDisplay" style="font-size:11px;color:#1A7A3A;font-family:'IBM Plex Mono',monospace;margin-top:2px;"></div>
              <button type="submit" style="width:100%; margin-top:12px;">Adicionar Contato</button>
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
                <option value="promotor_backup">Promotor Backup</option>
                <option value="supervisor_resp">Supervisor Responsável</option>
                <option value="coord_resp">Coordenador Responsável</option>
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
        // lazy getter: CIA_SUPABASE is set only after login
        const getSupabase = () => parent.window.CIA_SUPABASE;

        let allPdvs = [];
        let currentWorkspaceId = null;
        let currentPdvId = null;
        let wsSettings = { require_geo_for_pdvs: false };
        let pdvCsvRows = [];

        // ── WhatsApp normalizer ─────────────────────────────────────
        function normalizeWA(raw) {
          if (!raw) return { digits: '', display: '' };
          const digits = String(raw).replace(/\D/g,'');
          if (!digits) return { digits:'', display: raw };
          let display = digits;
          if      (digits.length===13) display='+'+digits.slice(0,2)+' ('+digits.slice(2,4)+') '+digits.slice(4,9)+'-'+digits.slice(9);
          else if (digits.length===12) display='+'+digits.slice(0,2)+' ('+digits.slice(2,4)+') '+digits.slice(4,8)+'-'+digits.slice(8);
          else if (digits.length===11) display='('+digits.slice(0,2)+') '+digits.slice(2,7)+'-'+digits.slice(7);
          else if (digits.length===10) display='('+digits.slice(0,2)+') '+digits.slice(2,6)+'-'+digits.slice(6);
          return { digits, display };
        }

        async function init() {
          try {
            const { data: { user } } = await getSupabase().auth.getUser();
            if(!user) return;
            const { data: wusers } = await getSupabase().from('workspace_users').select('workspace_id').eq('user_id', user.id).limit(1);
            if(wusers && wusers.length > 0) {
              currentWorkspaceId = wusers[0].workspace_id;
              // Load workspace settings for geo validation
              const { data: wset } = await getSupabase().from('workspace_settings')
                .select('require_geo_for_pdvs').eq('workspace_id', currentWorkspaceId).maybeSingle();
              if (wset) wsSettings = wset;
              await loadPdvs();
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
            loadPdvs();
          }
        });

        async function loadPdvs() {
          const uf     = document.getElementById('filterUf').value;
          const city   = document.getElementById('filterCity').value.trim().toLowerCase();
          const status = document.getElementById('filterStatus').value;

          let query = getSupabase().from('pdvs').select('*').eq('workspace_id', currentWorkspaceId).order('name');
          if (uf)                  query = query.eq('uf', uf);
          if (status==='active')   query = query.eq('is_active', true);
          if (status==='inactive') query = query.eq('is_active', false);

          const { data, error } = await query;
          if(error) { console.error(error); return; }

          let result = data || [];
          if(city) result = result.filter(p => p.city && p.city.toLowerCase().includes(city));

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
          document.getElementById('tabContatosTrigger').style.display = 'block';
          document.getElementById('tabTimeTrigger').style.display = 'block';
          document.getElementById('tabProdutosTrigger').style.display = 'block';

          openModal();
          await loadContacts(p.id);
          await loadAssignments(p.id);
          await loadPdvProducts(p.id);
        };

        // --- Contacts del PDV ---
        async function loadContacts(pdvId) {
          const list = document.getElementById('contactsList');
          if (!list) return;
          list.innerHTML = 'Carregando...';
          const { data, error } = await getSupabase().from('pdv_contacts')
            .select('*').eq('pdv_id', pdvId).order('name');
          if (error) { list.innerHTML = 'Erro ao carregar'; return; }
          if (!data || !data.length) { list.innerHTML = '<div style="color:#94a3b8;font-size:13px;">Sem contatos cadastrados.</div>'; return; }
          const roleLabel = { gerente:'Gerente', encarregado:'Encarregado', subgerente:'Subgerente', repositor:'Repositor', outro:'Outro' };
          list.innerHTML = data.map(c => {
            const wa = normalizeWA(c.phone_whatsapp);
            const waHtml = wa.display
              ? '<a href="https://wa.me/' + escapeHTML(wa.digits) + '" target="_blank" style="color:#1A7A3A;text-decoration:none;font-size:12px">' + escapeHTML(wa.display) + '</a>'
              : '<span style="color:#94a3b8;font-size:12px">—</span>';
            return \`<div class="list-item">
              <div><strong>\${escapeHTML(c.name)}</strong> <span style="color:#94a3b8;font-size:11px">(\${escapeHTML(roleLabel[c.contact_role]||c.contact_role)})</span><br>\${waHtml}</div>
              <button class="btn-secondary" onclick="removeContact('\${c.id}')" style="padding:4px 8px;font-size:12px;">Remover</button>
            </div>\`;
          }).join('');
        }

        window.removeContact = async id => {
          if (!confirm('Remover contato?')) return;
          await getSupabase().from('pdv_contacts').delete().eq('id', id);
          if (currentPdvId) await loadContacts(currentPdvId);
        };

        document.getElementById('formContact').addEventListener('submit', async e => {
          e.preventDefault();
          if (!currentPdvId) return;
          const wa = normalizeWA(document.getElementById('cPhone').value);
          const payload = {
            workspace_id:  currentWorkspaceId,
            pdv_id:        currentPdvId,
            name:          document.getElementById('cName').value.trim(),
            contact_role:  document.getElementById('cRole').value,
            phone_whatsapp: wa.digits || null,
            phone_display:  wa.display || null,
          };
          const { error } = await getSupabase().from('pdv_contacts').insert([payload]);
          if (error) alert('Erro: ' + error.message);
          else {
            document.getElementById('formContact').reset();
            document.getElementById('cPhoneDisplay').textContent = '';
            await loadContacts(currentPdvId);
          }
        });

        // Live WA display for contact form
        const cPhoneEl = document.getElementById('cPhone');
        if (cPhoneEl) cPhoneEl.addEventListener('input', function() {
          const wa = normalizeWA(this.value);
          const el = document.getElementById('cPhoneDisplay');
          if (el) el.textContent = wa.display || '';
        });
        async function loadAssignments(pdvId) {
          const list = document.getElementById('assignmentsList');
          list.innerHTML = 'Carregando...';
          const { data, error } = await getSupabase().from('assignments').select('*, people(name)').eq('pdv_id', pdvId);
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
          await getSupabase().from('assignments').delete().eq('id', id);
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
          const { error } = await getSupabase().from('assignments').insert([payload]);
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
          const { data, error } = await getSupabase().from('pdv_products').select('*, products(name, sku_code)').eq('pdv_id', pdvId);
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
          await getSupabase().from('pdv_products').delete().eq('id', id);
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
          const { error } = await getSupabase().from('pdv_products').insert([payload]);
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
          document.getElementById('tabContatosTrigger').style.display = 'none';
          document.getElementById('tabTimeTrigger').style.display = 'none';
          document.getElementById('tabProdutosTrigger').style.display = 'none';
          document.querySelector('[data-target="tabDados"]').click();
          const geoW = document.getElementById('geoWarning');
          if (geoW) geoW.style.display = 'none';
          openModal();
        });

        document.getElementById('formPdv').addEventListener('submit', async (e) => {
          e.preventDefault();
          const lat = parseFloat(document.getElementById('pLat').value) || null;
          const lng = parseFloat(document.getElementById('pLng').value) || null;
          const geoW = document.getElementById('geoWarning');
          if (wsSettings.require_geo_for_pdvs && (!lat || !lng)) {
            if (geoW) { geoW.style.display = 'block'; geoW.textContent = '⚠️ Geo obrigatório: preencha Latitude e Longitude antes de salvar.'; }
            return;
          }
          if (geoW) geoW.style.display = 'none';
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
            res = await getSupabase().from('pdvs').update(payload).eq('id', id);
          } else {
            res = await getSupabase().from('pdvs').insert([payload]);
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
           else renderTable();
        });

        // ── CSV Import (PDVs) ──────────────────────────────────────
        function parseCsv(text) {
          const lines=text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(l=>l.trim());
          if(!lines.length) return [];
          const delim=lines[0].includes(';')?';':',';
          return lines.map(l=>{
            const cols=[];let cur='';let inQ=false;
            for(let i=0;i<l.length;i++){const ch=l[i];if(inQ){if(ch==='"'){if(l[i+1]==='"'){cur+='"';i++;}else inQ=false;}else cur+=ch;}else{if(ch==='"')inQ=true;else if(ch===delim){cols.push(cur.trim());cur='';}else cur+=ch;}}
            cols.push(cur.trim());return cols;
          });
        }

        const btnOpenImportPdv = document.getElementById('btnOpenImportPdv');
        if (btnOpenImportPdv) btnOpenImportPdv.addEventListener('click', () => {
          document.getElementById('pdvImportFile').value='';
          document.getElementById('pdvPreviewSection').style.display='none';
          document.getElementById('pdvImportProgress').style.display='none';
          document.getElementById('pdvImportResult').style.display='none';
          pdvCsvRows=[];
          document.getElementById('pdvImportOverlay').style.display='flex';
        });
        document.getElementById('pdvCloseImport').addEventListener('click',()=>{ document.getElementById('pdvImportOverlay').style.display='none'; });
        document.getElementById('pdvCancelImport').addEventListener('click',()=>{ document.getElementById('pdvImportOverlay').style.display='none'; });

        document.getElementById('pdvImportFile').addEventListener('change', async (e) => {
          const file=e.target.files[0]; if(!file) return;
          const text=await file.text();
          const raw=parseCsv(text); if(!raw.length) return;
          const headers=raw[0];
          pdvCsvRows=raw.slice(1).filter(r=>r.some(c=>c)).map(r=>{
            const o={}; headers.forEach((h,i)=>{ o[h.toLowerCase().trim()]=r[i]??''; }); return o;
          });
          document.getElementById('pdvImportCount').textContent=pdvCsvRows.length;
          const errCount=pdvCsvRows.filter(r=>!r.name).length;
          document.getElementById('pdvPreviewSummary').innerHTML='<b>'+pdvCsvRows.length+' linhas</b>'+(errCount?' — <span style="color:#dc2626">'+errCount+' sem nome</span>':' — OK');
          let th='<thead><tr>'+headers.slice(0,7).map(h=>'<th style="padding:4px 8px;border:1px solid #e2e8f0;font-size:11px;background:#f8fafc">'+h+'</th>').join('')+'</tr></thead>';
          let tb='<tbody>'+pdvCsvRows.slice(0,5).map(r=>'<tr>'+headers.slice(0,7).map(h=>'<td style="padding:4px 8px;border:1px solid #e2e8f0;font-size:11px">'+(r[h.toLowerCase().trim()]||'')+'</td>').join('')+'</tr>').join('')+'</tbody>';
          document.getElementById('pdvPreviewTable').innerHTML=th+tb;
          document.getElementById('pdvPreviewSection').style.display='block';
          document.getElementById('pdvImportResult').style.display='none';
        });

        document.getElementById('pdvConfirmImport').addEventListener('click', async () => {
          if(!pdvCsvRows.length) return;
          document.getElementById('pdvPreviewSection').style.display='none';
          document.getElementById('pdvImportProgress').style.display='block';
          try {
            const { data, error } = await getSupabase().functions.invoke('csv-import',{
              body:{ entity:'pdvs', workspace_id:currentWorkspaceId, rows:pdvCsvRows }
            });
            document.getElementById('pdvImportProgress').style.display='none';
            document.getElementById('pdvImportResult').style.display='block';
            if(error||!data){
              document.getElementById('pdvImportResult').innerHTML='<span style="color:#dc2626">Erro: Edge Function não respondeu.</span>'; return;
            }
            const {inserted=0,updated=0,rejected=0,errors=[]}=data;
            document.getElementById('pdvImportResult').innerHTML=
              '<b style="color:#15803d">Inseridos: '+inserted+'</b>  <b>Atualizados: '+updated+'</b>  '+(rejected?'<b style="color:#dc2626">Rejeitados: '+rejected+'</b>':'')+
              (errors.length?'<div style="color:#dc2626;font-size:11px;margin-top:6px">'+errors.slice(0,5).join('<br>')+'</div>':'');
            loadPdvs();
          } catch(err) {
            document.getElementById('pdvImportProgress').style.display='none';
            document.getElementById('pdvImportResult').style.display='block';
            document.getElementById('pdvImportResult').innerHTML='<span style="color:#dc2626">Erro: '+String(err?.message||err)+'</span>';
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

        function openModal() { document.getElementById('modalPdv').classList.add('active'); }
        function closeModal() { document.getElementById('modalPdv').classList.remove('active'); }
        document.getElementById('btnCloseModal').addEventListener('click', closeModal);
        document.getElementById('btnCancel').addEventListener('click', closeModal);

        init();
      </script>

      <!-- ── CSV Import Overlay (PDVs) ──────────────────────────── -->
      <div id="pdvImportOverlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;align-items:flex-start;justify-content:center;padding:30px 16px;overflow-y:auto;">
        <div style="background:#fff;border-radius:12px;padding:24px;width:680px;max-width:100%;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h2 style="margin:0;font-size:17px;color:#071C46;">Importar CSV — PDVs</h2>
            <button id="pdvCloseImport" style="background:#f1f5f9;border:none;border-radius:6px;padding:5px 9px;cursor:pointer;font-size:16px;">&#x2715;</button>
          </div>
          <p style="color:#64748b;font-size:12px;margin:0 0 14px;">Colunas: <strong>pdv_code, cnpj, name, address, city, uf, lat, lng, is_active</strong>. Chave upsert: workspace_id + pdv_code.</p>
          <input type="file" id="pdvImportFile" accept=".csv,text/csv" style="margin-bottom:14px;">
          <div id="pdvPreviewSection" style="display:none;">
            <div style="font-size:13px;font-weight:600;margin-bottom:6px;">Preview (primeiras 5 linhas)</div>
            <div style="overflow-x:auto;"><table id="pdvPreviewTable" style="border-collapse:collapse;"></table></div>
            <div id="pdvPreviewSummary" style="margin:8px 0;font-size:13px;"></div>
            <div style="display:flex;gap:8px;margin-top:14px;">
              <button id="pdvConfirmImport" style="flex:1;background:#1A7A3A;color:#fff;border:none;border-radius:6px;padding:9px;cursor:pointer;font-size:13px;">Importar <span id="pdvImportCount">0</span> linha(s)</button>
              <button id="pdvCancelImport" style="background:#f1f5f9;border:none;border-radius:6px;padding:9px 14px;cursor:pointer;font-size:13px;">Cancelar</button>
            </div>
          </div>
          <div id="pdvImportProgress" style="display:none;text-align:center;padding:20px;color:#64748b;font-size:13px;">Importando…</div>
          <div id="pdvImportResult" style="display:none;font-size:13px;padding:10px 0;"></div>
        </div>
      </div>
    </body>
    </html>
  `;
  frame.srcdoc = html;
}
