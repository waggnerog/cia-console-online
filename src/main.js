import { createClient } from '@supabase/supabase-js';
import './styles/evidencias.css';

const SB_URL = import.meta.env.VITE_SUPABASE_URL || 'https://naaqdwjtastjnckizfqd.supabase.co';
const SB_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YzXtLMPE--5I7yvxkOgikQ_eYZ13h4V';
export const supabase = SB_URL && SB_KEY ? createClient(SB_URL, SB_KEY, { auth:{ persistSession:true, autoRefreshToken:true } }) : null;

const imgs=[
'https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=1600&q=82',
'https://images.unsplash.com/photo-1580913428735-bd3c269d6a82?auto=format&fit=crop&w=1600&q=82',
'https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=82',
'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1600&q=82'
];
const seed=[
['Vivo Shopping Ibirapuera','Exposição Echo','João Silva','Vivo','mobile_app','pending',0],
['Fast Shop Morumbi','Mesa de exposição','Bruna Oliveira','Fast Shop','csv_import','pending',1],
['Claro Center Norte','Ponta promocional','Luciano Barbosa','Claro','mobile_app','resubmitted',2],
['Carrefour Pinheiros','Exposição de categoria','Cirleide Santos','Carrefour','csv_import','pending',3],
['Vivo Mooca Plaza','Precificação','Cleia Souza','Vivo','mobile_app','adjustment_requested',0],
['Fast Shop Eldorado','Material promocional','Gustavo Lima','Fast Shop','csv_import','pending',1],
['Claro Tatuapé','Exposição principal','Alberto Mendes','Claro','mobile_app','approved',2],
['Vivo Anália Franco','Comunicação de preço','Michel Santos','Vivo','csv_import','rejected',3]
];
const statusLabel={pending:'Pendente',approved:'Aprovada',adjustment_requested:'Ajuste solicitado',resubmitted:'Reenviada',rejected:'Reprovada'};
const makeRows=()=>seed.map((r,i)=>({id:'ev-'+(i+1),client:'Amazon',operation:'Execução Echo',store:r[0],code:'12'+(345+i),task:r[1],promoter:r[2],supervisor:i%2?'Maria Santos':'Carlos Rocha',whatsapp:'',network:r[3],source:r[4],status:r[5],captured_at:new Date(2026,9,20,10+i,12).toISOString(),image_url:imgs[r[6]],criteria:{product:false,display:false,material:false,price:false,organization:false,quality:false},history:['Execução recebida'],_metadata:{}}));
const saved=localStorage.getItem('cia-evidencias-demo');
const state={rows:saved?JSON.parse(saved):makeRows(),selected:null,queue:'pending',search:'',source:'all',network:'all',zoom:1,rotation:0,mode:location.hash==='#campo'?'field':'review',mobile:'queue'};
state.selected=(state.rows.find(x=>x.status==='pending')||state.rows[0]).id;
const app=document.getElementById('app'), toastRoot=document.getElementById('toastRoot');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=v=>new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date(v));
const date=v=>new Intl.DateTimeFormat('pt-BR').format(new Date(v));
const persist=()=>localStorage.setItem('cia-evidencias-demo',JSON.stringify(state.rows));
const current=()=>state.rows.find(x=>x.id===state.selected)||state.rows[0];
function toast(msg,bad){const el=document.createElement('div');el.className='toast'+(bad?' bad':'');el.textContent=msg;toastRoot.append(el);setTimeout(()=>el.remove(),2400)}
function list(){let a=state.rows.slice();if(state.queue!=='all')a=a.filter(x=>x.status===state.queue);if(state.search){const q=state.search.toLowerCase();a=a.filter(x=>[x.store,x.task,x.promoter,x.network].some(v=>v.toLowerCase().includes(q)))}if(state.source!=='all')a=a.filter(x=>x.source===state.source);if(state.network!=='all')a=a.filter(x=>x.network===state.network);return a}
function metrics(){const c=s=>state.rows.filter(x=>x.status===s).length;return {all:state.rows.length,pending:c('pending'),approved:c('approved'),adjust:c('adjustment_requested'),rejected:c('rejected')}}
function qcard(x){
  return '<button class="qcard '+(x.id===state.selected?'selected':'')+'" data-id="'+x.id+'"><img src="'+x.image_url+'" alt=""><span><b>'+esc(x.store)+'</b><small>'+esc(x.task)+'</small><em>'+esc(x.promoter)+' · '+time(x.captured_at)+'</em><i>'+(x.source==='mobile_app'?'CIA Campo':'CSV')+'</i></span><strong class="queue-status '+x.status+'">'+statusLabel[x.status]+'</strong></button>';
}
function viewer(x){
  return '<div class="viewer-head"><div class="viewer-title"><small>2 · CONFIRA A EXECUÇÃO</small><b>'+esc(x.task)+'</b><span>'+esc(x.network)+' · '+esc(x.store)+'</span></div><div><button data-z="out" aria-label="Reduzir zoom">−</button><span>'+Math.round(state.zoom*100)+'%</span><button data-z="in" aria-label="Aumentar zoom">+</button><button data-z="rotate" aria-label="Girar foto">↻</button><button data-z="fit">Ajustar</button></div></div><div class="photo-stage"><button data-nav="-1" aria-label="Execução anterior">‹</button><img src="'+x.image_url+'" alt="Foto da execução '+esc(x.task)+' em '+esc(x.store)+'" style="transform:scale('+state.zoom+') rotate('+state.rotation+'deg)"><button data-nav="1" aria-label="Próxima execução">›</button></div><div class="decision-dock" aria-label="Decisão da execução"><div class="decision-copy"><small>3 · DECIDA</small><b>Qual é o resultado desta execução?</b></div><button data-action="approve" class="approve"><span class="decision-icon">✓</span><span><b>Aprovar</b><small>Execução correta</small></span><kbd>A</kbd></button><button data-action="adjust" class="adjust"><span class="decision-icon">↗</span><span><b>Solicitar ajuste</b><small>Corrigir via WhatsApp</small></span><kbd>J</kbd></button><button data-action="reject" class="reject"><span class="decision-icon">×</span><span><b>Reprovar</b><small>Execução não aceita</small></span><kbd>R</kbd></button></div>';
}
function analysis(x){
  const cs=[['product','Produto visível'],['display','Exposição completa'],['material','Material correto'],['price','Precificação visível'],['organization','Organização'],['quality','Qualidade da imagem']];
  const checks=cs.map(v=>'<label><input type="checkbox" data-c="'+v[0]+'" '+(x.criteria[v[0]]?'checked':'')+'><span>✓</span><b>'+v[1]+'</b></label>').join('');
  return '<div class="analysis-scroll"><div class="analysis-title"><div><small>CONTEXTO DA EXECUÇÃO</small><b>Informações para decidir com segurança</b></div><span class="pill '+x.status+'">'+statusLabel[x.status]+'</span></div>'+
  '<section class="context-identity"><div class="context-eyebrow">LOJA</div><div class="store-identity"><div><b>'+esc(x.store)+'</b><span>'+esc(x.network)+'</span></div><code>'+esc(x.code||'—')+'</code></div></section>'+
  '<section class="context-group"><h3>Execução</h3><div class="context-grid"><div><span>Tarefa</span><b>'+esc(x.task)+'</b></div><div><span>Cliente</span><b>'+esc(x.client)+'</b></div><div><span>Operação</span><b>'+esc(x.operation)+'</b></div><div><span>Capturada em</span><b>'+date(x.captured_at)+' · '+time(x.captured_at)+'</b></div><div><span>Origem</span><b>'+(x.source==='mobile_app'?'CIA Campo':'Importação CSV')+'</b></div></div></section>'+
  '<section class="context-group"><h3>Equipe responsável</h3><div class="people-list"><div><span class="person-avatar">P</span><div><span>Promotor</span><b>'+esc(x.promoter)+'</b></div></div><div><span class="person-avatar">S</span><div><span>Supervisor</span><b>'+esc(x.supervisor)+'</b>'+(x.whatsapp?'<small>WhatsApp: '+esc(x.whatsapp)+'</small>':'<small>WhatsApp não informado</small>')+'</div></div></div></section>'+
  '<section class="criteria-section"><div class="section-head-copy"><div><h3>Critérios de conferência</h3><p>Marque o que você consegue confirmar visualmente. Eles apoiam sua decisão; não substituem a análise.</p></div></div><div class="criteria">'+checks+'</div></section>'+
  '<details class="history-card"><summary>Histórico da execução <span>'+x.history.length+'</span></summary><ol>'+x.history.slice().reverse().map(h=>'<li>'+esc(h)+'</li>').join('')+'</ol></details></div>';
}
function loginScreen(){
  app.innerHTML='<div class="login-shell"><section class="login-card"><div class="login-brand"><span>C</span><div><b>CIA</b><small>Execução PDV</small></div></div><h1>Acesse o CIA</h1><p>Acompanhe e valide a execução no ponto de venda à distância.</p><form id="authForm"><label>E-mail<input id="authEmail" type="email" autocomplete="email" required></label><label>Senha<input id="authPass" type="password" autocomplete="current-password" minlength="6" required></label><button class="primary" type="submit">Entrar</button><button id="signupBtn" type="button">Primeiro acesso · criar meu acesso</button><small id="authMsg"></small></form></section></div>';
  const form=document.getElementById('authForm'),msg=document.getElementById('authMsg');
  form.onsubmit=async e=>{e.preventDefault();msg.textContent='Entrando...';const {error}=await supabase.auth.signInWithPassword({email:document.getElementById('authEmail').value.trim(),password:document.getElementById('authPass').value});if(error){msg.textContent=error.message?.toLowerCase().includes('invalid login credentials')?'Esse acesso ainda não existe no novo CIA. Use “Primeiro acesso · criar meu acesso”.':error.message;return}await start()};
  document.getElementById('signupBtn').onclick=async()=>{msg.textContent='Criando conta...';const {data,error}=await supabase.auth.signUp({email:document.getElementById('authEmail').value.trim(),password:document.getElementById('authPass').value});if(error){msg.textContent=error.message;return}if(!data.session){msg.textContent='Acesso criado. Confirme o e-mail que o Supabase enviou e depois entre normalmente.';return}await start()};
}
async function ensureWorkspace(){
  const {data,error}=await supabase.from('memberships').select('workspace_id,role').limit(1);
  if(error) throw error;
  if(data?.length) return data[0];
  const {data:boot,error:bootErr}=await supabase.functions.invoke('bootstrap-workspace',{body:{org_name:'Minha organização',workspace_name:'Principal'}});
  if(bootErr) throw bootErr;
  if(boot?.error) throw new Error(boot.error);
  return boot;
}
async function loadCloudRows(){
  const {data,error}=await supabase
    .from('evidences')
    .select('id,source,status,storage_path,external_url,captured_at,uploaded_at,metadata,current_revision,store:stores(name,code,network,region),task:photo_tasks(title),operation:operations(name,client_name)')
    .eq('workspace_id',state.membership.workspace_id)
    .order('uploaded_at',{ascending:false})
    .limit(500);
  if(error) throw error;
  if(!data?.length){state.demo=true;return}
  const mapped=await Promise.all(data.map(async row=>{
    let image=row.external_url||'';
    if(!image&&row.storage_path){
      const {data:signed}=await supabase.storage.from('cia-evidencias').createSignedUrl(row.storage_path,3600);
      image=signed?.signedUrl||'';
    }
    return {
      id:row.id,client:row.operation?.client_name||'Cliente',operation:row.operation?.name||'Operação',
      store:row.store?.name||'Loja',code:row.store?.code||'',task:row.task?.title||row.metadata?.task||'Execução',
      promoter:row.metadata?.promoter||'—',supervisor:row.metadata?.supervisor||'—',whatsapp:row.metadata?.whatsapp||row.metadata?.telefone||row.metadata?.phone||'',
      network:row.store?.network||row.metadata?.network||'—',source:row.source,status:row.status,
      captured_at:row.captured_at||row.uploaded_at,image_url:image||imgs[0],
      criteria:row.metadata?.criteria||{product:false,display:false,material:false,price:false,organization:false,quality:false},
      history:row.metadata?.history||['Execução recebida'],_metadata:row.metadata||{}
    }
  }));
  state.rows=mapped;state.demo=false;state.selected=(mapped.find(x=>x.status==='pending')||mapped[0]).id;
}
async function saveCloudDecision(e,decision,reason='',comment=''){
  if(state.demo||String(e.id).startsWith('ev-')) return;
  const review={workspace_id:state.membership.workspace_id,evidence_id:e.id,decision,reason:reason||null,comment:comment||null,criteria:e.criteria};
  const {error:rErr}=await supabase.from('evidence_reviews').insert(review); if(rErr) throw rErr;
  const {error:uErr}=await supabase.from('evidences').update({status:decision}).eq('id',e.id); if(uErr) throw uErr;
}
async function start(){
  if(!supabase){render();return}
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){loginScreen();return}
  try{state.membership=await ensureWorkspace();await loadCloudRows();render()}catch(err){app.innerHTML='<div class="fatal"><b>Não foi possível iniciar o CIA.</b><span>'+esc(err.message)+'</span></div>'}
}
function review(){
  const x=current(),k=metrics(),a=list(),nets=[...new Set(state.rows.map(v=>v.network))];
  const pendingCount=state.rows.filter(v=>v.status==='pending').length;
  const resubmittedCount=state.rows.filter(v=>v.status==='resubmitted').length;
  app.innerHTML='<div class="shell"><header class="topbar"><div class="brand"><span>C</span><div><b>CIA</b><small>Execução PDV</small></div></div><div class="operation-context"><small>ACOMPANHAMENTO REMOTO</small><b>Amazon · Execução Echo · Outubro 2026</b><span>Acompanhe a execução no PDV à distância: escolha uma loja, confira a foto e decida.</span></div><div class="top-actions"><button id="helpBtn" class="btn help-btn">? Como funciona</button><button id="fieldBtn" class="btn ghost">CIA Campo</button><button id="importBtn" class="btn primary">Importar CSV</button><span class="avatar">LW</span></div></header>'+
  '<section class="metrics"><div title="Total de execuções recebidas no período"><span><small>Execuções</small><em>Total no período</em></span><b>'+k.all+'</b></div><div title="Execuções que ainda precisam de decisão"><span><small>A analisar</small><em>Aguardam decisão</em></span><b>'+k.pending+'</b></div><div title="Execuções validadas como corretas"><span><small>Aprovadas</small><em>Execução validada</em></span><b>'+k.approved+'</b></div><div title="Execuções devolvidas ao campo para correção"><span><small>Com ajuste</small><em>Retorno ao campo</em></span><b>'+k.adjust+'</b></div><div title="Execuções não aceitas"><span><small>Reprovadas</small><em>Não aceitas</em></span><b>'+k.rejected+'</b></div><div title="Percentual de execuções aprovadas"><span><small>Taxa de aprovação</small><em>Aprovadas ÷ total</em></span><b>'+(k.all?Math.round(k.approved/k.all*100):0)+'%</b></div></section>'+
  '<section class="filters"><input id="search" value="'+esc(state.search)+'" placeholder="Buscar loja, tarefa ou promotor"><select id="networkFilter"><option value="all">Todas as redes</option>'+nets.map(n=>'<option '+(state.network===n?'selected':'')+'>'+esc(n)+'</option>').join('')+'</select><select id="sourceFilter"><option value="all">Todas as origens</option><option value="mobile_app" '+(state.source==='mobile_app'?'selected':'')+'>CIA Campo</option><option value="csv_import" '+(state.source==='csv_import'?'selected':'')+'>Importação CSV</option></select></section>'+
  '<main class="workspace"><aside class="queue pane '+(state.mobile==='queue'?'active':'')+'"><div class="pane-title"><span>1 · FILA DE ANÁLISE</span><b>O que precisa da sua atenção</b><small>Clique em uma execução abaixo para abrir a foto.</small></div><div class="queue-guide"><b>Como funciona</b><span><i class="guide-dot pending"></i><strong>Pendentes</strong> ainda não foram analisadas.</span><span><i class="guide-dot resubmitted"></i><strong>Reenviadas</strong> voltaram após um ajuste.</span></div><div class="tabs"><button data-q="pending" class="'+(state.queue==='pending'?'active':'')+'">Pendentes <b>'+pendingCount+'</b></button><button data-q="resubmitted" class="'+(state.queue==='resubmitted'?'active':'')+'">Reenviadas <b>'+resubmittedCount+'</b></button><button data-q="all" class="'+(state.queue==='all'?'active':'')+'">Todas <b>'+state.rows.length+'</b></button></div><div class="queue-list">'+(a.map(qcard).join('')||'<div class="empty">Nenhuma execução neste filtro.</div>')+'</div></aside><section class="viewer pane '+(state.mobile==='viewer'?'active':'')+'">'+viewer(x)+'</section><aside class="analysis pane '+(state.mobile==='analysis'?'active':'')+'">'+analysis(x)+'</aside></main>'+
  '<nav class="mobile-nav"><button data-tab="queue" class="'+(state.mobile==='queue'?'active':'')+'">1 · Fila</button><button data-tab="viewer" class="'+(state.mobile==='viewer'?'active':'')+'">2 · Execução</button><button data-tab="analysis" class="'+(state.mobile==='analysis'?'active':'')+'">Contexto</button></nav></div>';
  bindReview();
}
function bindReview(){
  document.getElementById('fieldBtn').onclick=()=>{state.mode='field';location.hash='campo';render()};
  document.getElementById('importBtn').onclick=openImport;
  document.getElementById('helpBtn').onclick=openHelp;
  document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{state.queue=b.dataset.q;render()});
  document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{state.selected=b.dataset.id;state.zoom=1;state.rotation=0;if(innerWidth<900)state.mobile='viewer';render()});
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.mobile=b.dataset.tab;render()});
  document.getElementById('search').oninput=e=>{state.search=e.target.value;render();setTimeout(()=>{const i=document.getElementById('search');i?.focus();i?.setSelectionRange(i.value.length,i.value.length)},0)};
  document.getElementById('networkFilter').onchange=e=>{state.network=e.target.value;render()};
  document.getElementById('sourceFilter').onchange=e=>{state.source=e.target.value;render()};
  document.querySelectorAll('[data-c]').forEach(i=>i.onchange=()=>{current().criteria[i.dataset.c]=i.checked;persist()});
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>decision(b.dataset.action));
  document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>navigate(+b.dataset.nav));
  document.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>zoom(b.dataset.z));
}
function navigate(d){const a=list();if(!a.length)return;let i=a.findIndex(x=>x.id===state.selected);state.selected=a[(Math.max(i,0)+d+a.length)%a.length].id;state.zoom=1;state.rotation=0;render()}
function zoom(a){if(a==='in')state.zoom=Math.min(2.4,state.zoom+.15);if(a==='out')state.zoom=Math.max(.5,state.zoom-.15);if(a==='rotate')state.rotation=(state.rotation+90)%360;if(a==='fit'){state.zoom=1;state.rotation=0}render()}
function nextOpen(){const n=state.rows.find(x=>x.status==='pending'||x.status==='resubmitted');if(n)state.selected=n.id}
async function decision(a){
  const x=current();
  if(a==='approve'){
    try{await saveCloudDecision(x,'approved');x.status='approved';x.history.push('Execução aprovada');persist();nextOpen();toast('Execução aprovada');render()}catch(err){toast(err.message,true)}
    return;
  }
  if(a==='adjust'){openAdjustment();return}
  openDecision('reject');
}
function modal(body){const r=document.createElement('div');r.className='modal-root';r.innerHTML='<div class="backdrop" data-close></div><section class="modal">'+body+'</section>';document.body.append(r);r.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>r.remove());return r}
function openHelp(){
  modal('<header><div><small>COMO FUNCIONA</small><h2>Acompanhe a execução no PDV à distância</h2></div><button data-close>×</button></header><div class="modal-body help-flow"><div class="help-step"><span>1</span><div><b>Escolha na fila</b><p>A coluna da esquerda é sua fila de trabalho. Pendentes ainda precisam de decisão; reenviadas voltaram depois de uma correção.</p></div></div><div class="help-step"><span>2</span><div><b>Confira a execução</b><p>A foto principal mostra o que aconteceu no PDV. O painel à direita traz loja, tarefa, equipe e critérios para dar contexto à análise.</p></div></div><div class="help-step"><span>3</span><div><b>Decida</b><p><strong>Aprovar</strong> valida a execução. <strong>Solicitar ajuste</strong> gera a mensagem pronta e abre o WhatsApp. <strong>Reprovar</strong> marca a execução como não aceita.</p></div></div><div class="status-guide"><b>Status</b><div><span class="pill pending">Pendente</span><small>Aguardando análise</small></div><div><span class="pill adjustment_requested">Ajuste solicitado</span><small>Correção enviada ao campo</small></div><div><span class="pill resubmitted">Reenviada</span><small>Nova foto aguardando revisão</small></div><div><span class="pill approved">Aprovada</span><small>Execução validada</small></div><div><span class="pill rejected">Reprovada</span><small>Execução não aceita</small></div></div></div><footer><button data-close class="primary">Entendi</button></footer>');
}
function normalizeWhats(value){
  let d=String(value||'').replace(/\D/g,'');
  if((d.length===10||d.length===11)&&!d.startsWith('55'))d='55'+d;
  return /^55\d{10,11}$/.test(d)?d:'';
}
const adjustmentCopy={
  'Agrupamento de SKUs':'realizar o agrupamento dos SKUs conforme o padrão/planograma, evitando produtos dispersos e melhorando a leitura do shopper.',
  'Alinhamento da execução':'alinhar a execução conforme o padrão combinado (organização, frentes e consistência da exposição), garantindo uma apresentação mais uniforme.',
  'Alinhamento da Caixaria':'alinhar a caixaria conforme o padrão (posicionamento/organização), evitando bloqueios visuais e mantendo o ponto de venda mais limpo.',
  'Aumento de share':'reforçar a ocupação para aumento de share, respeitando o espaço e o planograma, buscando melhor visibilidade e disponibilidade do produto.',
  'Organização da gôndola':'organizar a gôndola (produtos alinhados, frenteados e com melhor visibilidade), mantendo a execução no padrão esperado.',
  'Volume alto e pouco produto na gôndola':'ajustar o abastecimento: há indício de volume alto fora da gôndola e pouco produto exposto. Por favor, orientar reposição adequada na gôndola.',
  'Baixo giro':'revisar a execução e a exposição do produto de baixo giro, garantindo visibilidade, organização e melhor oportunidade de saída.',
  'Produto sem preço':'regularizar a precificação do produto, garantindo que o preço fique visível e associado corretamente ao item.',
  'Foto desfocada':'refazer a foto com nitidez, boa iluminação e enquadramento suficiente para validar toda a execução.',
  'Execução incompleta':'refazer a foto mostrando todos os elementos necessários para validar a execução.',
  'Enquadramento inadequado':'refazer a foto com um enquadramento mais aberto e centralizado, permitindo visualizar a execução completa.',
  'Material incorreto':'corrigir o material aplicado e enviar uma nova foto após o ajuste.'
};
function buildAdjustmentMessage(x,type,note=''){
  const loc=[x.network,x.store].filter(Boolean).join(' – ');
  const alvo=loc+(x.code?' (cód. '+x.code+')':'');
  const detail=adjustmentCopy[type]||'realizar o ajuste conforme o padrão de execução.';
  let msg='*Solicitação de ajuste · CIA*\n';
  msg+='Loja: '+alvo+'\n';
  msg+='Tarefa: '+x.task+'\n';
  msg+='Data da foto: '+date(x.captured_at)+'\n';
  if(x.image_url)msg+='Foto: '+x.image_url+'\n';
  msg+='\nOlá! Tudo bem? 😊\n\nPor gentileza, poderia orientar o(a) promotor(a) a '+detail;
  if(note)msg+='\n\nObservação: '+note;
  msg+='\n\nMuito obrigado(a) pelo apoio!';
  return msg;
}
async function saveEvidenceContact(e,phone){
  e.whatsapp=phone;e._metadata={...(e._metadata||{}),whatsapp:phone};
  if(state.demo||String(e.id).startsWith('ev-'))return;
  const {error}=await supabase.from('evidences').update({metadata:e._metadata}).eq('id',e.id);if(error)throw error;
}
function openAdjustment(){
  const x=current();
  const types=Object.keys(adjustmentCopy);
  const r=modal('<header><div><small>SOLICITAR AJUSTE</small><h2>Prepare a mensagem para o WhatsApp</h2><p class="modal-sub">Escolha o ajuste. O CIA monta a mensagem pronta e registra a solicitação.</p></div><button data-close>×</button></header><div class="modal-body adjustment-flow"><label class="field-label">Tipo de ajuste<select id="adjustType">'+types.map(t=>'<option value="'+esc(t)+'">'+esc(t)+'</option>').join('')+'</select></label><label class="field-label">WhatsApp do supervisor<input id="adjustPhone" inputmode="tel" placeholder="Ex.: 11 99999-9999" value="'+esc(x.whatsapp||'')+'"><small>O CIA original também direcionava o ajuste pelo contato do supervisor. Se o número vier no CSV, ele será preenchido automaticamente.</small></label><label class="field-label">Observação adicional <textarea id="adjustNote" rows="2" placeholder="Opcional — acrescente apenas se precisar contextualizar algo específico."></textarea></label><div class="message-preview"><div><span>Mensagem pronta</span><button id="copyAdjust" type="button">Copiar</button></div><textarea id="adjustMessage" rows="9" readonly></textarea></div></div><footer><button data-close>Cancelar</button><button id="sendAdjust" class="whatsapp-primary">Salvar ajuste e abrir WhatsApp ↗</button></footer>');
  const type=r.querySelector('#adjustType'),phone=r.querySelector('#adjustPhone'),note=r.querySelector('#adjustNote'),preview=r.querySelector('#adjustMessage');
  const sync=()=>{preview.value=buildAdjustmentMessage(x,type.value,note.value.trim())};sync();type.onchange=sync;note.oninput=sync;
  r.querySelector('#copyAdjust').onclick=async()=>{try{await navigator.clipboard.writeText(preview.value);toast('Mensagem copiada')}catch{toast('Não foi possível copiar',true)}};
  r.querySelector('#sendAdjust').onclick=async()=>{
    const wa=normalizeWhats(phone.value);
    if(!wa){phone.focus();phone.classList.add('field-error');toast('Informe um WhatsApp válido com DDD.',true);return}
    const msg=buildAdjustmentMessage(x,type.value,note.value.trim());
    const url='https://wa.me/'+wa+'?text='+encodeURIComponent(msg);
    const win=window.open('about:blank','_blank');
    try{
      await saveEvidenceContact(x,wa);
      await saveCloudDecision(x,'adjustment_requested',type.value,msg);
      x.status='adjustment_requested';x.history.push('Ajuste solicitado via WhatsApp: '+type.value);persist();
      if(win)win.location.href=url;else window.location.href=url;
      r.remove();nextOpen();toast('Ajuste registrado e WhatsApp aberto');render();
    }catch(err){if(win)win.close();toast(err.message,true)}
  };
}
function openDecision(){
  const reasons=['Foto sem relação com a tarefa','Foto duplicada','Imagem ilegível','Loja ou execução incorreta','Outro'];
  const r=modal('<header><div><small>REPROVAR EXECUÇÃO</small><h2>Por que esta execução não pode ser aceita?</h2></div><button data-close>×</button></header><div class="modal-body"><p>A reprovação encerra esta análise. Se o problema puder ser corrigido no PDV, prefira “Solicitar ajuste”.</p><div class="reasons">'+reasons.map((x,i)=>'<label><input type="radio" name="reason" value="'+x+'" '+(i===0?'checked':'')+'><span>'+x+'</span></label>').join('')+'</div><textarea id="comment" placeholder="Observação opcional"></textarea></div><footer><button data-close>Cancelar</button><button id="confirm" class="danger-btn">Reprovar execução</button></footer>');
  r.querySelector('#confirm').onclick=async()=>{const x=current(),reason=r.querySelector('input:checked').value,comment=r.querySelector('#comment').value.trim();try{await saveCloudDecision(x,'rejected',reason,comment);x.status='rejected';x.history.push('Execução reprovada: '+reason+(comment?' — '+comment:''));persist();r.remove();nextOpen();toast('Execução reprovada',true);render()}catch(err){toast(err.message,true)}};
}
function parseCSV(text){
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i],next=text[i+1];
    if(ch==='"'&&quoted&&next==='"'){cell+='"';i++;continue}
    if(ch==='"'){quoted=!quoted;continue}
    if(ch===','&&!quoted){row.push(cell.trim());cell='';continue}
    if((ch==='\n'||ch==='\r')&&!quoted){
      if(ch==='\r'&&next==='\n')i++;
      row.push(cell.trim());cell='';
      if(row.some(v=>v!==''))rows.push(row);
      row=[];continue
    }
    cell+=ch;
  }
  if(cell.length||row.length){row.push(cell.trim());if(row.some(v=>v!==''))rows.push(row)}
  if(rows.length<2)return [];
  const headers=rows[0].map(h=>h.trim());
  return rows.slice(1).map((r,idx)=>({__row:idx+2,...Object.fromEntries(headers.map((h,i)=>[h,r[i]??'']))}));
}
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function guessHeader(headers,aliases){
  const n=headers.map(h=>[h,norm(h)]);
  for(const a of aliases){const target=norm(a);const exact=n.find(x=>x[1]===target);if(exact)return exact[0]}
  for(const a of aliases){const target=norm(a);const near=n.find(x=>x[1].includes(target)||target.includes(x[1]));if(near)return near[0]}
  return '';
}
async function importCsvToSupabase(rows,map,fileName){
  const workspaceId=state.membership.workspace_id;
  const valid=rows.filter(r=>map.store&&map.url&&r[map.store]&&r[map.url]);
  if(!valid.length)throw new Error('Nenhuma linha válida para importar.');

  let {data:ops,error:opReadErr}=await supabase.from('operations').select('id,name').eq('workspace_id',workspaceId).eq('active',true).limit(1);
  if(opReadErr)throw opReadErr;
  let operationId=ops?.[0]?.id;
  if(!operationId){
    const {data:op,error}=await supabase.from('operations').insert({workspace_id:workspaceId,name:'Importação CSV',client_name:'Cliente'}).select('id').single();
    if(error)throw error; operationId=op.id;
  }

  const {data:imp,error:impErr}=await supabase.from('imports').insert({
    workspace_id:workspaceId,operation_id:operationId,file_name:fileName,mapping:map,status:'processing'
  }).select('id').single();
  if(impErr)throw impErr;

  const storesByKey=new Map(),tasksByTitle=new Map();
  const storePayload=[];
  for(const r of valid){
    const code=(map.code&&r[map.code])||('CSV-'+r.__row);
    const key=code.trim();
    if(!storesByKey.has(key)){
      const item={workspace_id:workspaceId,code:key,name:r[map.store].trim(),network:map.network?r[map.network]||null:null,region:map.region?r[map.region]||null:null};
      storesByKey.set(key,item);storePayload.push(item);
    }
  }
  const {data:storeRows,error:storeErr}=await supabase.from('stores').upsert(storePayload,{onConflict:'workspace_id,code'}).select('id,code');
  if(storeErr)throw storeErr;
  const storeIds=new Map((storeRows||[]).map(s=>[s.code,s.id]));

  const titles=[...new Set(valid.map(r=>(map.task&&r[map.task]?r[map.task]:'Foto de execução').trim()))];
  const {data:existingTasks,error:taskReadErr}=await supabase.from('photo_tasks').select('id,title').eq('workspace_id',workspaceId).eq('operation_id',operationId).in('title',titles);
  if(taskReadErr)throw taskReadErr;
  (existingTasks||[]).forEach(t=>tasksByTitle.set(t.title,t.id));
  const missing=titles.filter(t=>!tasksByTitle.has(t));
  if(missing.length){
    const {data:newTasks,error:taskErr}=await supabase.from('photo_tasks').insert(missing.map(title=>({workspace_id:workspaceId,operation_id:operationId,title,min_photos:1,required:true}))).select('id,title');
    if(taskErr)throw taskErr;(newTasks||[]).forEach(t=>tasksByTitle.set(t.title,t.id));
  }

  const evidencePayload=valid.map(r=>{
    const code=((map.code&&r[map.code])||('CSV-'+r.__row)).trim();
    const title=((map.task&&r[map.task])||'Foto de execução').trim();
    const rawDate=map.date?r[map.date]:'';
    const parsedDate=rawDate&& !Number.isNaN(Date.parse(rawDate)) ? new Date(rawDate).toISOString() : null;
    return {
      workspace_id:workspaceId,operation_id:operationId,store_id:storeIds.get(code),photo_task_id:tasksByTitle.get(title),import_id:imp.id,
      source:'csv_import',status:'pending',external_url:r[map.url].trim(),captured_at:parsedDate,
      metadata:{promoter:map.promoter?r[map.promoter]||'—':'—',supervisor:map.supervisor?r[map.supervisor]||'—':'—',whatsapp:map.phone?r[map.phone]||'':'',network:map.network?r[map.network]||'—':'—',csv_row:r.__row}
    }
  });
  const {data:inserted,error:evidenceErr}=await supabase.from('evidences').insert(evidencePayload).select('id');
  if(evidenceErr)throw evidenceErr;

  await supabase.from('imports').update({status:'completed',valid_rows:inserted?.length||0,error_rows:rows.length-valid.length,completed_at:new Date().toISOString()}).eq('id',imp.id);
  return {imported:inserted?.length||0,errors:rows.length-valid.length};
}
function openImport(){
  let step=1,fileName='',rows=[],headers=[],map={};
  const r=modal('<header><div><small>IMPORTAÇÃO</small><h2>Importar execuções por CSV</h2></div><button data-close>×</button></header><div id="importBody" class="modal-body"></div>');
  const aliases={
    store:['Nome PDV','Loja','PDV','Ponto de venda'],
    code:['Código','Codigo','Código loja','ID PDV'],
    promoter:['Consultor','Promotor','Colaborador'],
    supervisor:['Supervisor','Coordenador'],
    phone:['WhatsApp','Whatsapp','Telefone','Celular','WPP','Telefone supervisor'],
    date:['Data visita','Data','Data da visita'],
    task:['Tipo foto','Tarefa','Tipo de foto','Evidência'],
    url:['URL imagem','Link da foto','Foto URL','URL foto','Imagem'],
    network:['Rede','Canal'],
    region:['Região','Regional','Cidade']
  };
  function autoMap(){for(const [k,a] of Object.entries(aliases))map[k]=guessHeader(headers,a)}
  function selectField(key,label,required=false){
    return '<div><label>'+label+(required?' *':'')+'</label><select data-map="'+key+'"><option value="">— Não mapear —</option>'+headers.map(h=>'<option value="'+esc(h)+'" '+(map[key]===h?'selected':'')+'>'+esc(h)+'</option>').join('')+'</select></div>';
  }
  function validateRows(){
    let valid=0,badUrl=0,missing=0;const seen=new Set();let duplicates=0;
    for(const row of rows){
      const store=map.store?row[map.store]:'',url=map.url?row[map.url]:'';
      if(!store||!url){missing++;continue}
      try{new URL(url)}catch{badUrl++;continue}
      const key=(map.code?row[map.code]:store)+'|'+url;
      if(seen.has(key))duplicates++;else seen.add(key);
      valid++;
    }
    return {valid,badUrl,missing,duplicates};
  }
  function draw(){
    const b=r.querySelector('#importBody');
    if(step===1)b.innerHTML='<div class="stepper"><b>1 · Upload</b> → 2 · Mapeamento → 3 · Validação → 4 · Importar</div><div class="drop"><h3>Selecione seu CSV</h3><p>O arquivo deve conter os metadados e os links das fotos.</p><input id="csv" type="file" accept=".csv,text/csv"><button id="choose">Selecionar CSV</button></div>';
    if(step===2)b.innerHTML='<div class="stepper">✓ Upload → <b>2 · Mapeamento</b> → 3 · Validação → 4 · Importar</div><p><b>'+esc(fileName)+'</b> · '+rows.length+' linhas</p><div class="mapping-form">'+selectField('store','Loja',true)+selectField('code','Código da loja')+selectField('promoter','Promotor')+selectField('supervisor','Supervisor')+selectField('phone','WhatsApp do supervisor')+selectField('date','Data da visita')+selectField('task','Tarefa')+selectField('url','Link da foto',true)+selectField('network','Rede')+selectField('region','Região')+'</div><button id="next" class="primary wide">Validar arquivo</button>';
    if(step===3){const v=validateRows();b.innerHTML='<div class="stepper">✓ Upload → ✓ Mapeamento → <b>3 · Validação</b> → 4 · Importar</div><div class="validation"><div><b>'+v.valid+'</b><span>Linhas válidas</span></div><div><b>'+v.duplicates+'</b><span>Possíveis duplicidades</span></div><div><b>'+v.missing+'</b><span>Campos obrigatórios ausentes</span></div><div><b>'+v.badUrl+'</b><span>URLs inválidas</span></div></div><button id="next" class="primary wide" '+(!map.store||!map.url||!v.valid?'disabled':'')+'>Importar '+v.valid+' execuções</button>'}
    if(step===4)b.innerHTML='<div class="success"><div>✓</div><h3>Importação concluída</h3><p id="importResult">Processando...</p><button data-close class="primary">Ir para a fila</button></div>';
    b.querySelector('#choose')?.addEventListener('click',()=>b.querySelector('#csv').click());
    b.querySelector('#csv')?.addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;fileName=f.name;rows=parseCSV(await f.text());headers=rows.length?Object.keys(rows[0]).filter(k=>k!=='__row'):[];autoMap();step=2;draw()});
    b.querySelectorAll('[data-map]').forEach(s=>s.addEventListener('change',e=>{map[e.target.dataset.map]=e.target.value}));
    b.querySelector('#next')?.addEventListener('click',async()=>{if(step===2){step=3;draw();return}if(step===3){step=4;draw();try{const result=await importCsvToSupabase(rows,map,fileName);b.querySelector('#importResult').innerHTML='<b>'+result.imported+'</b> execuções foram adicionadas ao CIA.'+(result.errors?' '+result.errors+' linhas não foram importadas.':'');await loadCloudRows()}catch(err){b.querySelector('#importResult').textContent='Erro: '+err.message}return}});
    b.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>{r.remove();render()})
  }draw()
}
function field(){const stores=[['Vivo Shopping Ibirapuera','Vivo',4,2],['Fast Shop Morumbi','Fast Shop',5,0],['Claro Center Norte','Claro',3,0]];app.innerHTML='<div class="field"><header><button id="reviewBtn"><span>C</span><b>CIA Campo</b></button><i>JS</i></header><section class="field-hero"><small>Terça, 20 de outubro</small><h1>Bom dia, João.</h1><p>Hoje você tem 3 lojas e 12 fotos de execução previstas.</p></section><section class="field-stats"><div><b>3</b><span>Lojas</span></div><div><b>12</b><span>Fotos</span></div><div><b>2</b><span>Concluídas</span></div></section><main><div class="route-title"><h2>Rota de hoje</h2><span>São Paulo</span></div>'+stores.map((s,i)=>'<article class="store"><strong>'+(i+1)+'</strong><div><small>'+s[1]+'</small><h3>'+s[0]+'</h3><p>'+(i?3+i:'0,2')+' km de distância</p><div class="bar"><i style="width:'+Math.round(s[3]/s[2]*100)+'%"></i></div><em>'+s[3]+'/'+s[2]+' tarefas concluídas</em></div><button data-store="'+i+'">'+(i===0?'Continuar':'Abrir')+'</button></article>').join('')+'</main><button id="cameraFab" class="camera-fab">＋ Nova foto de execução</button></div>';document.getElementById('reviewBtn').onclick=()=>{state.mode='review';location.hash='';render()};document.querySelectorAll('[data-store],#cameraFab').forEach(b=>b.onclick=openVisit)}
function openVisit(){let checked=false;const r=modal('<header><div><small>VIVO · SHOPPING IBIRAPUERA</small><h2>Visita em campo</h2></div><button data-close>×</button></header><div class="modal-body"><div class="checkin"><div><b>Check-in</b><span>Registre sua chegada à loja.</span></div><button id="checkin" class="primary">Fazer check-in</button></div><div class="tasks">'+['Fachada da loja','Exposição Echo','Precificação','Material promocional'].map((t,i)=>'<article><strong>'+(i+1)+'</strong><div><b>'+t+'</b><small>'+(i===1?'3 fotos':'1 foto')+' obrigatória'+(i===1?'s':'')+'</small></div><button data-photo>Fotografar</button></article>').join('')+'</div><button id="checkout" class="checkout" disabled>Finalizar visita · Check-out</button></div>');r.querySelector('#checkin').onclick=e=>{checked=true;e.target.disabled=true;e.target.textContent='Check-in realizado';r.querySelector('#checkout').disabled=false;toast('Check-in registrado')};r.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{if(!checked){toast('Faça o check-in primeiro',true);return}const i=document.createElement('input');i.type='file';i.accept='image/*';i.capture='environment';i.onchange=()=>{if(i.files?.[0]){b.textContent='Foto adicionada ✓';b.closest('article').classList.add('done');toast('Foto de execução adicionada')}};i.click()});r.querySelector('#checkout').onclick=()=>{toast('Visita finalizada');r.remove()}}
function render(){state.mode==='field'?field():review()}
window.addEventListener('hashchange',()=>{state.mode=location.hash==='#campo'?'field':'review';render()});
window.addEventListener('keydown',e=>{if(state.mode!=='review'||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.querySelector('.modal-root'))return;const k=e.key.toLowerCase();if(k==='a')decision('approve');if(k==='j')decision('adjust');if(k==='r')decision('reject');if(e.key==='ArrowRight')navigate(1);if(e.key==='ArrowLeft')navigate(-1)});
start();
