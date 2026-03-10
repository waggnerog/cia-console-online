// CIA Console — Products module (CRUD + PDV linking + status filter + CSV import)

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
          <select id="filterStatus">
            <option value="">Status: Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <button id="btnSearch">Filtrar</button>
          <button id="btnOpenImportProduct" style="background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;">&#8679; Importar CSV</button>
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

        function getBootstrapState() {
          try {
            return parent.window.CIA_BOOTSTRAP?.getWorkspaceResolution?.() || null;
          } catch (_) {
            return null;
          }
        }

        function renderWorkspaceMessage(msg) {
          const tbody = document.getElementById('productsTableBody');
          if (!tbody) return;
          tbody.innerHTML = '<tr><td colspan="7">' + msg + '</td></tr>';
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

        async function init() {
          try {
            const resolved = await resolveWorkspaceContext();
            if(!resolved || !resolved.workspaceId) return;
            await loadProducts();
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
            loadProducts();
          }
        });

        async function loadProducts() {
          if (!currentWorkspaceId) {
            const resolved = await resolveWorkspaceContext();
            if (!resolved || !resolved.workspaceId) return;
          }
          const brand    = document.getElementById('filterBrand').value.trim();
          const category = document.getElementById('filterCategory').value.trim();
          const status   = document.getElementById('filterStatus').value;

          let query = getSupabase().from('products').select('*').eq('workspace_id', currentWorkspaceId).order('name');
          if (brand)              query = query.ilike('brand', '%' + brand + '%');
          if (category)           query = query.ilike('category', '%' + category + '%');
          if (status==='active')   query = query.eq('is_active', true);
          if (status==='inactive') query = query.eq('is_active', false);

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
              <td>\${p.is_active ? 'Ativo' : 'Inativo'}</td>
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
                Listado: \${p.is_listed ? 'Sim' : 'Não'} | Prio: \${p.priority}
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
          else renderTable();
        });

        // ── CSV Import (overlay avançado) ─────────────────────────────────────
        let productCsvRows = [];
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

        function showToast(msg, isErr) {
          const t = document.createElement('div');
          t.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:' + (isErr?'#dc2626':'#15803d') + ';color:#fff;padding:12px 20px;border-radius:8px;font-size:13px;font-family:\'IBM Plex Sans\',sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.2);';
          t.textContent = msg;
          document.body.appendChild(t);
          setTimeout(() => { t.style.transition='opacity .3s'; t.style.opacity='0'; setTimeout(()=>t.remove(),300); }, 3500);
        }

        function downloadProductTemplate() {
          const cols = 'sku_code,name,ean,brand,category,is_active';
          const row1 = 'SKU001,Produto Exemplo,,Marca Exemplo,Categoria Exemplo,true';
          const blob = new Blob([cols+'\n'+row1+'\n'], {type:'text/csv;charset=utf-8;'});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href=url; a.download='modelo_produtos.csv'; a.click();
          URL.revokeObjectURL(url);
        }

        const btnOpenImportProduct = document.getElementById('btnOpenImportProduct');
        if (btnOpenImportProduct) btnOpenImportProduct.addEventListener('click', () => {
          document.getElementById('prodImportFile').value='';
          document.getElementById('prodPreviewSection').style.display='none';
          document.getElementById('prodImportProgress').style.display='none';
          document.getElementById('prodImportResult').style.display='none';
          document.getElementById('prodErrorList').style.display='none';
          document.getElementById('prodDetectedCols').textContent='Nenhum arquivo carregado';
          productCsvRows=[];
          document.getElementById('prodImportOverlay').style.display='flex';
        });
        document.getElementById('prodDownloadTemplate').addEventListener('click', downloadProductTemplate);
        document.getElementById('prodCloseImport').addEventListener('click',()=>{ document.getElementById('prodImportOverlay').style.display='none'; });
        document.getElementById('prodCancelImport').addEventListener('click',()=>{ document.getElementById('prodImportOverlay').style.display='none'; });

        document.getElementById('prodImportFile').addEventListener('change', async (e) => {
          const file=e.target.files[0]; if(!file) return;
          const text=await file.text();
          const raw=parseCsv(text); if(!raw.length) return;
          const headerRow=raw[0];
          const headers=headerRow.map(h=>h.toLowerCase().trim());
          const requiredCols=['sku_code','name'];
          productCsvRows=raw.slice(1).filter(r=>r.some(c=>c)).map(r=>{
            const o={}; headerRow.forEach((h,i)=>{ o[h.toLowerCase().trim()]=r[i]??''; }); return o;
          });
          document.getElementById('prodDetectedCols').textContent=headers.join(', ')||'—';
          const rowErrors=[];
          productCsvRows.forEach((r,i)=>{
            const missing=requiredCols.filter(c=>!r[c]);
            if(missing.length) rowErrors.push('Linha '+(i+2)+': campo(s) obrigatório(s) faltando — '+missing.join(', '));
          });
          document.getElementById('prodImportCount').textContent=productCsvRows.length;
          const errCount=rowErrors.length;
          document.getElementById('prodPreviewSummary').innerHTML=
            '<b>'+productCsvRows.length+' linha(s)</b>'+
            (errCount?' &nbsp;— <span style="color:#dc2626">'+errCount+' com erro</span>':' &nbsp;<span style="color:#15803d">✓ Sem erros</span>');
          const errListEl=document.getElementById('prodErrorList');
          if(rowErrors.length){
            errListEl.style.display='block';
            document.getElementById('prodErrorListItems').innerHTML=rowErrors.slice(0,20).map(e=>'<li>'+e+'</li>').join('');
          } else { errListEl.style.display='none'; }
          const displayH=headerRow.slice(0,8);
          let th='<thead><tr>'+displayH.map(h=>'<th style="padding:4px 8px;border:1px solid #e2e8f0;font-size:11px;background:#f8fafc;white-space:nowrap">'+h+'</th>').join('')+'</tr></thead>';
          let tb='<tbody>'+productCsvRows.slice(0,20).map(r=>{
            const isErr=requiredCols.some(c=>!r[c]);
            return '<tr'+(isErr?' style="background:#fff7f7"':'')+'>'+
              displayH.map(h=>'<td style="padding:4px 8px;border:1px solid #e2e8f0;font-size:11px">'+(r[h.toLowerCase().trim()]||'')+'</td>').join('')+'</tr>';
          }).join('')+'</tbody>';
          document.getElementById('prodPreviewTable').innerHTML=th+tb;
          document.getElementById('prodPreviewSection').style.display='block';
          document.getElementById('prodImportResult').style.display='none';
          const confirmBtn=document.getElementById('prodConfirmImport');
          confirmBtn.disabled=errCount>0;
          confirmBtn.style.opacity=errCount>0?'0.5':'1';
          confirmBtn.style.cursor=errCount>0?'not-allowed':'pointer';
        });

        document.getElementById('prodConfirmImport').addEventListener('click', async () => {
          if(!productCsvRows.length) return;
          document.getElementById('prodPreviewSection').style.display='none';
          document.getElementById('prodErrorList').style.display='none';
          document.getElementById('prodImportProgress').style.display='block';
          try {
            const normalized = productCsvRows.map(r => {
              const row = Object.assign({}, r);
              if (typeof row.is_active === 'string') row.is_active = row.is_active.toLowerCase() !== 'false' && row.is_active !== '0';
              return row;
            });
            const { data, error } = await getSupabase().functions.invoke('csv-import',{
              body:{ entity:'products', workspace_id:currentWorkspaceId, rows:normalized }
            });
            document.getElementById('prodImportProgress').style.display='none';
            document.getElementById('prodImportResult').style.display='block';
            if(error||!data){
              document.getElementById('prodImportResult').innerHTML='<span style="color:#dc2626">Erro: Edge Function não respondeu.</span>';
              showToast('Erro ao importar', true);
              return;
            }
            const {inserted=0,updated=0,rejected=0,errors=[]}=data;
            document.getElementById('prodImportResult').innerHTML=
              '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:8px;">'+
              '<span style="color:#15803d;font-weight:600;">✓ '+inserted+' inseridos</span>'+
              '<span style="font-weight:600;">'+updated+' atualizados</span>'+
              (rejected?'<span style="color:#dc2626;font-weight:600;">✗ '+rejected+' rejeitados</span>':'')+
              '</div>'+
              (errors.length?'<div style="background:#fff7f7;border:1px solid #fecaca;border-radius:6px;padding:8px 12px;font-size:12px;color:#dc2626;max-height:120px;overflow-y:auto;"><ul style="margin:0;padding-left:16px;">'+errors.slice(0,20).map(e=>'<li>'+e+'</li>').join('')+'</ul></div>':'');
            loadProducts();
            if(!rejected) showToast('Importação concluída: '+inserted+' inseridos, '+updated+' atualizados');
            else showToast('Importação com '+rejected+' rejeitados', true);
          } catch(err) {
            document.getElementById('prodImportProgress').style.display='none';
            document.getElementById('prodImportResult').style.display='block';
            document.getElementById('prodImportResult').innerHTML='<span style="color:#dc2626">Erro: '+String(err?.message||err)+'</span>';
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

        function openModal() { document.getElementById('modalProduct').classList.add('active'); }
        function closeModal() { document.getElementById('modalProduct').classList.remove('active'); }
        document.getElementById('btnCloseModal').addEventListener('click', closeModal);
        document.getElementById('btnCancel').addEventListener('click', closeModal);

        init();
      </script>

      <!-- ── CSV Import Overlay (Products) ─────────────────────── -->
      <div id="prodImportOverlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;align-items:flex-start;justify-content:center;padding:30px 16px;overflow-y:auto;">
        <div style="background:#fff;border-radius:12px;padding:28px;width:720px;max-width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h2 style="margin:0;font-size:18px;font-weight:700;color:#071C46;">Importar CSV — Produtos (SKUs)</h2>
            <button id="prodCloseImport" style="background:#f1f5f9;border:none;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:16px;line-height:1;">&#x2715;</button>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin-bottom:14px;font-size:12px;color:#475569;line-height:1.6;">
            <strong style="color:#0f172a;">Obrigatórios:</strong> sku_code, name &nbsp;·&nbsp;
            <strong style="color:#0f172a;">Opcionais:</strong> ean, brand, category, is_active &nbsp;·&nbsp;
            Chave upsert: workspace_id + sku_code<br>
            <button id="prodDownloadTemplate" style="margin-top:8px;background:#e0f2fe;color:#0369a1;border:none;border-radius:5px;padding:5px 12px;cursor:pointer;font-size:12px;font-weight:600;">&#8595; Baixar modelo CSV</button>
          </div>
          <div style="margin-bottom:12px;font-size:12px;color:#64748b;">
            Colunas detectadas: <span id="prodDetectedCols" style="font-weight:600;color:#0f172a;">Nenhum arquivo carregado</span>
          </div>
          <input type="file" id="prodImportFile" accept=".csv,text/csv" style="margin-bottom:14px;width:100%;box-sizing:border-box;">
          <div id="prodPreviewSection" style="display:none;">
            <div style="font-size:13px;font-weight:600;margin-bottom:6px;color:#0f172a;">Preview (até 20 linhas)</div>
            <div style="overflow-x:auto;max-height:260px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:6px;"><table id="prodPreviewTable" style="border-collapse:collapse;width:100%;"></table></div>
            <div id="prodPreviewSummary" style="margin:8px 0;font-size:13px;"></div>
            <div id="prodErrorList" style="display:none;background:#fff7f7;border:1px solid #fecaca;border-radius:6px;padding:8px 12px;margin-bottom:10px;max-height:140px;overflow-y:auto;">
              <div style="font-size:12px;font-weight:600;color:#dc2626;margin-bottom:4px;">Erros de validação:</div>
              <ul id="prodErrorListItems" style="margin:0;padding-left:16px;font-size:12px;color:#dc2626;"></ul>
            </div>
            <div style="display:flex;gap:8px;margin-top:14px;">
              <button id="prodConfirmImport" style="flex:1;background:#1A7A3A;color:#fff;border:none;border-radius:6px;padding:10px;cursor:pointer;font-size:13px;font-weight:600;">Importar <span id="prodImportCount">0</span> linha(s)</button>
              <button id="prodCancelImport" style="background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:6px;padding:10px 16px;cursor:pointer;font-size:13px;font-weight:600;">Cancelar</button>
            </div>
          </div>
          <div id="prodImportProgress" style="display:none;text-align:center;padding:24px;color:#64748b;font-size:13px;">&#9203; Importando…</div>
          <div id="prodImportResult" style="display:none;font-size:13px;padding:10px 0;"></div>
        </div>
      </div>
    </body>
    </html>
  \`;
  frame.srcdoc = html;
}
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
