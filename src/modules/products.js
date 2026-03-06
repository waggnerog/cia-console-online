import { supabase } from '../lib/supabaseClient';

export function initProducts(frame) {
  const html = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Produtos</title>
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
      <h1>Produtos</h1>

      <div class="card">
        <div class="filters">
          <input type="text" id="searchName" placeholder="Buscar nome, SKU ou EAN...">
          <input type="text" id="filterBrand" placeholder="Marca...">
          <input type="text" id="filterCategory" placeholder="Categoria...">
          <button id="btnSearch">Filtrar</button>
          <input type="file" id="fileImportCsv" accept=".csv" style="display:none;">
          <button id="btnImportCsv" class="btn-secondary" style="margin-left: auto; margin-right: 10px;">Importar CSV</button>
          <button id="btnNew">+ Novo Produto</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>EAN</th>
              <th>Nome</th>
              <th>Marca</th>
              <th>Categoria</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="productsTableBody">
            <tr><td colspan="7">Carregando...</td></tr>
          </tbody>
        </table>
      </div>

      <!-- Modal Product -->
      <div id="modalProduct" class="modal">
        <div class="modal-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h2 id="modalTitle" style="margin:0; font-size:18px;">Produto</h2>
            <button class="btn-secondary" id="btnCloseModal" style="padding:4px 8px;">✕</button>
          </div>

          <div class="tabs">
            <div class="tab active" data-target="tabDados">Dados</div>
            <div class="tab" id="tabPdvsTrigger" data-target="tabPdvs" style="display:none;">PDVs Listados</div>
          </div>

          <div id="tabDados" class="tab-content active">
            <form id="formProduct">
              <input type="hidden" id="productId">

              <div class="row-grid">
                <div>
                  <label>SKU (Código)</label>
                  <input type="text" id="pSku">
                </div>
                <div>
                  <label>EAN (Barras)</label>
                  <input type="text" id="pEan">
                </div>
              </div>

              <label>Nome do Produto *</label>
              <input type="text" id="pName" required>

              <div class="row-grid">
                <div>
                  <label>Marca</label>
                  <input type="text" id="pBrand">
                </div>
                <div>
                  <label>Categoria</label>
                  <input type="text" id="pCategory">
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

          <div id="tabPdvs" class="tab-content">
            <div style="margin-bottom:10px; font-size:13px; color:#475569;">Lojas onde este produto está listado:</div>
            <div id="pdvsList">Carregando...</div>
            <hr style="border:0; border-top:1px solid #e2e8f0; margin:15px 0;">
            <div style="font-size:12px; color:#64748b;">
              * Para adicionar este produto a um PDV, use a tela de "PDVs" e adicione o produto na aba do respectivo estabelecimento.
            </div>
          </div>
        </div>
      </div>

      <script>
        // lazy getter: CIA_SUPABASE is set only after login
        const getSupabase = () => parent.window.CIA_SUPABASE;

        let allProducts = [];
        let currentWorkspaceId = null;
        let currentProductId = null;

        async function init() {
          try {
            const { data: { user } } = await getSupabase().auth.getUser();
            if(!user) return;
            const { data: wusers } = await getSupabase().from('workspace_users').select('workspace_id').eq('user_id', user.id).limit(1);
            if(wusers && wusers.length > 0) {
              currentWorkspaceId = wusers[0].workspace_id;
              await loadProducts();
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
            loadProducts();
          }
        });

        async function loadProducts() {
          const search = document.getElementById('searchName').value.toLowerCase();
          const brand = document.getElementById('filterBrand').value.trim();
          const category = document.getElementById('filterCategory').value.trim();

          let query = getSupabase().from('products').select('*').eq('workspace_id', currentWorkspaceId).order('name');

          if(brand) query = query.ilike('brand', '%' + brand + '%');
          if(category) query = query.ilike('category', '%' + category + '%');

          const { data, error } = await query;
          if(error) { console.error(error); return; }

          allProducts = data || [];
          renderTable();
        }

        function renderTable() {
          const tbody = document.getElementById('productsTableBody');
          const search = document.getElementById('searchName').value.toLowerCase();

          const filtered = allProducts.filter(p =>
            p.name.toLowerCase().includes(search) ||
            (p.sku_code && p.sku_code.toLowerCase().includes(search)) ||
            (p.ean && p.ean.toLowerCase().includes(search)) ||
            (p.brand && p.brand.toLowerCase().includes(search)) ||
            (p.category && p.category.toLowerCase().includes(search))
          );

          if(filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">Nenhum produto encontrado.</td></tr>';
            return;
          }

          tbody.innerHTML = filtered.map(p => {
            return \`<tr>
              <td>\${escapeHTML(p.sku_code || '-')}</td>
              <td>\${escapeHTML(p.ean || '-')}</td>
              <td>\${escapeHTML(p.name)}</td>
              <td>\${escapeHTML(p.brand || '-')}</td>
              <td>\${escapeHTML(p.category || '-')}</td>
              <td>\${escapeHTML(p.is_active ? 'Ativo' : 'Inativo')}</td>
              <td>
                <button class="btn-edit" onclick="editProduct('\${escapeHTML(p.id)}')">Editar</button>
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

        window.editProduct = async (id) => {
          const p = allProducts.find(x => x.id === id);
          if(!p) return;
          currentProductId = p.id;

          document.getElementById('productId').value = p.id;
          document.getElementById('pSku').value = p.sku_code || '';
          document.getElementById('pEan').value = p.ean || '';
          document.getElementById('pName').value = p.name || '';
          document.getElementById('pBrand').value = p.brand || '';
          document.getElementById('pCategory').value = p.category || '';
          document.getElementById('pActive').checked = p.is_active;

          document.getElementById('modalTitle').innerText = 'Editar Produto';
          document.getElementById('tabPdvsTrigger').style.display = 'block';

          openModal();
          await loadPdvProducts(p.id);
        };

        // --- PDV Products (Mix) ---
        async function loadPdvProducts(productId) {
          const list = document.getElementById('pdvsList');
          list.innerHTML = 'Carregando...';
          const { data, error } = await getSupabase().from('pdv_products').select('*, pdvs(name, pdv_code)').eq('product_id', productId);
          if(error) { list.innerHTML = 'Erro ao carregar'; return; }

          if(!data || data.length === 0) { list.innerHTML = 'Nenhum PDV listado.'; return; }

          list.innerHTML = data.map(p => \`
            <div class="list-item">
              <div>
                <strong>\${escapeHTML(p.pdvs?.name || p.pdv_id)}</strong> (\${escapeHTML(p.pdvs?.pdv_code || 'sem cd')})<br>
                Listado: \${escapeHTML(p.is_listed ? 'Sim' : 'Não')} | Prio: \${escapeHTML(p.priority)}
              </div>
            </div>
          \`).join('');
        }

        // --- Actions ---
        document.getElementById('btnNew').addEventListener('click', () => {
          currentProductId = null;
          document.getElementById('formProduct').reset();
          document.getElementById('productId').value = '';
          document.getElementById('modalTitle').innerText = 'Novo Produto';
          document.getElementById('tabPdvsTrigger').style.display = 'none';
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
                  sku_code: cols[0] ? cols[0].trim() : null,
                  ean: cols[1] ? cols[1].trim() : null,
                  name: cols[2] ? cols[2].trim() : (cols[0] ? cols[0].trim() : 'Produto'),
                  brand: cols[3] ? cols[3].trim() : null,
                  category: cols[4] ? cols[4].trim() : null
                });
              }
            }
            if(payloads.length > 0){
              const { error } = await getSupabase().from('products').insert(payloads);
              if(error) alert('Erro ao importar CSV: ' + error.message);
              else { alert('CSV Importado com sucesso!'); loadProducts(); }
            }
            document.getElementById('fileImportCsv').value = '';
          };
          reader.readAsText(file);
        });

        document.getElementById('formProduct').addEventListener('submit', async (e) => {
          e.preventDefault();
          const id = document.getElementById('productId').value;
          const payload = {
            workspace_id: currentWorkspaceId,
            sku_code: document.getElementById('pSku').value.trim() || null,
            ean: document.getElementById('pEan').value.trim() || null,
            name: document.getElementById('pName').value.trim(),
            brand: document.getElementById('pBrand').value.trim() || null,
            category: document.getElementById('pCategory').value.trim() || null,
            is_active: document.getElementById('pActive').checked
          };

          let res;
          if(id) {
            res = await getSupabase().from('products').update(payload).eq('id', id);
          } else {
            res = await getSupabase().from('products').insert([payload]);
          }

          if(res.error) {
            alert('Erro ao salvar: ' + res.error.message);
          } else {
            closeModal();
            loadProducts();
          }
        });

        document.getElementById('btnSearch').addEventListener('click', loadProducts);
        document.getElementById('searchName').addEventListener('keyup', (e) => {
           if(e.key === 'Enter') loadProducts();
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

        function openModal() { document.getElementById('modalProduct').classList.add('active'); }
        function closeModal() { document.getElementById('modalProduct').classList.remove('active'); }
        document.getElementById('btnCloseModal').addEventListener('click', closeModal);
        document.getElementById('btnCancel').addEventListener('click', closeModal);

        init();
      </script>
    </body>
    </html>
  `;
  frame.srcdoc = html;
}
