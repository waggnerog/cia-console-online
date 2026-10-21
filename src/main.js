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
const makeRows=()=>seed.map((r,i)=>({id:'ev-'+(i+1),client:'Amazon',operation:'Execução Echo',store:r[0],code:'12'+(345+i),task:r[1],promoter:r[2],supervisor:i%2?'Maria Santos':'Carlos Rocha',whatsapp:'',network:r[3],region:i===2?'Zona Norte':i===3?'Zona Oeste':i===4?'Zona Leste':'Zona Sul',source:r[4],status:r[5],captured_at:new Date(2026,9,20,10+i,12).toISOString(),image_url:imgs[r[6]],criteria:{product:false,display:false,material:false,price:false,organization:false,quality:false},history:['Execução recebida'],reviews:r[5]==='adjustment_requested'?[{decision:'adjustment_requested',reason:'Produto sem preço'}]:r[5]==='rejected'?[{decision:'rejected',reason:'Imagem ilegível'}]:[],_metadata:{}}));
const saved=localStorage.getItem('cia-evidencias-demo');
const state={rows:saved?JSON.parse(saved):makeRows(),selected:null,queue:'pending',search:'',source:'all',network:'all',zoom:1,rotation:0,mobile:'queue',membership:null,environments:[],user:null,workspace:{name:'Principal',settings:{timezone:'America/Sao_Paulo'}},services:{bko_enabled:true,field_enabled:false},subscription:null,imports:[],masterImports:[],people:[],assignments:[],assignmentMap:new Map(),users:[],publicPlans:[],commercial:[]};
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
  const actions=canAnalyze()
    ? '<div class="decision-dock" aria-label="Decisão da execução"><div class="decision-copy"><small>3 · DECIDA</small><b>Qual é o resultado desta execução?</b></div><button data-action="approve" class="approve"><span class="decision-icon">✓</span><span><b>Aprovar</b><small>Execução correta</small></span><kbd>A</kbd></button><button data-action="adjust" class="adjust"><span class="decision-icon">↗</span><span><b>Solicitar ajuste</b><small>Corrigir via WhatsApp</small></span><kbd>J</kbd></button><button data-action="reject" class="reject"><span class="decision-icon">×</span><span><b>Reprovar</b><small>Execução não aceita</small></span><kbd>R</kbd></button></div>'
    : '<div class="readonly-dock"><b>Modo acompanhamento</b><span>Seu perfil pode acompanhar a execução e os relatórios, mas não tomar decisões.</span></div>';
  return '<div class="viewer-head"><div class="viewer-title"><small>2 · CONFIRA A EXECUÇÃO</small><b>'+esc(x.task)+'</b><span>'+esc(x.network)+' · '+esc(x.store)+'</span></div><div><button data-z="out" aria-label="Reduzir zoom">−</button><span>'+Math.round(state.zoom*100)+'%</span><button data-z="in" aria-label="Aumentar zoom">+</button><button data-z="rotate" aria-label="Girar foto">↻</button><button data-z="fit">Ajustar</button></div></div><div class="photo-stage"><button data-nav="-1" aria-label="Execução anterior">‹</button><img src="'+x.image_url+'" alt="Foto da execução '+esc(x.task)+' em '+esc(x.store)+'" style="transform:scale('+state.zoom+') rotate('+state.rotation+'deg)"><button data-nav="1" aria-label="Próxima execução">›</button></div>'+actions;
}
function analysis(x){
  return '<div class="analysis-scroll"><div class="analysis-title"><div><small>CONTEXTO DA EXECUÇÃO</small><b>Informações para decidir com segurança</b></div><span class="pill '+x.status+'">'+statusLabel[x.status]+'</span></div>'+
  '<section class="context-identity"><div class="context-eyebrow">LOJA</div><div class="store-identity"><div><b>'+esc(x.store)+'</b><span>'+esc(x.network)+' · '+esc(x.region||'—')+'</span></div><code>'+esc(x.code||'—')+'</code></div></section>'+
  '<section class="context-group"><h3>Execução</h3><div class="context-grid"><div><span>Tarefa</span><b>'+esc(x.task)+'</b></div><div><span>Cliente</span><b>'+esc(x.client)+'</b></div><div><span>Operação</span><b>'+esc(x.operation)+'</b></div><div><span>Capturada em</span><b>'+date(x.captured_at)+' · '+time(x.captured_at)+'</b></div><div><span>Origem</span><b>'+(x.source==='mobile_app'?'CIA Campo':'Importação CSV')+'</b></div></div></section>'+
  '<section class="context-group"><h3>Equipe responsável</h3><div class="people-list"><div><span class="person-avatar">P</span><div><span>Promotor</span><b>'+esc(x.promoter)+'</b><small>'+(contactPhone(x.promoterContact)?'WhatsApp cadastrado':'Contato não cadastrado')+'</small></div></div><div><span class="person-avatar">S</span><div><span>Supervisor</span><b>'+esc(x.supervisor)+'</b><small>'+(contactPhone(x.supervisorContact)?'WhatsApp cadastrado':'Contato não cadastrado')+'</small></div></div></div></section>'+
  '<details class="history-card"><summary>Histórico da execução <span>'+x.history.length+'</span></summary><ol>'+x.history.slice().reverse().map(h=>'<li>'+esc(h)+'</li>').join('')+'</ol></details></div>';
}
async function loadPublicPlans(){
  if(state.publicPlans?.length)return state.publicPlans;
  const {data,error}=await supabase.from('service_plans').select('code,name,short_description,bko_enabled,field_enabled,trial_days,display_order').eq('active',true).eq('self_service',true).order('display_order');
  if(error){console.warn(error);state.publicPlans=[
    {code:'bko',name:'CIA BKO',short_description:'Análise remota da execução com entrada por CSV.',bko_enabled:true,field_enabled:false,trial_days:14},
    {code:'full',name:'CIA BKO + Campo',short_description:'Execução no PDV pelo CIA Campo integrada à análise remota.',bko_enabled:true,field_enabled:true,trial_days:14}
  ]}else state.publicPlans=data||[];
  return state.publicPlans;
}
function publicRoute(){
  const route=(location.hash||'#inicio').replace('#','').split('?')[0];
  return ['inicio','login','contratar'].includes(route)?route:'inicio';
}
function publicHeader(active='inicio'){
  return '<header class="public-header"><button class="public-brand" data-public-route="inicio" aria-label="CIA início"><span>C</span><div><b>CIA</b><small>Execução PDV</small></div></button><nav><a href="#produto">Produto</a><a href="#como-funciona">Como funciona</a><a href="#servicos">Serviços</a></nav><div class="public-actions"><button data-public-route="login" class="public-login-btn">Fazer login</button><button data-public-route="contratar" class="public-primary-btn">Contratar</button></div></header>';
}
function bindPublicNav(){
  document.querySelectorAll('[data-public-route]').forEach(b=>b.onclick=()=>{location.hash=b.dataset.publicRoute});
  document.querySelectorAll('[data-contract-plan]').forEach(b=>b.onclick=()=>{sessionStorage.setItem('cia-contract-plan',b.dataset.contractPlan);location.hash='contratar'});
}
function publicLanding(){
  const bko=state.publicPlans.find(p=>p.code==='bko')||state.publicPlans[0];
  const full=state.publicPlans.find(p=>p.code==='full')||state.publicPlans[1]||bko;
  app.innerHTML='<div class="public-site">'+publicHeader('inicio')+
  '<main><section class="public-hero"><div class="hero-copy"><span class="hero-kicker">GESTÃO DE EXECUÇÃO NO PDV</span><h1>Acompanhe a execução no ponto de venda sem precisar estar lá.</h1><p>O CIA organiza as fotos de campo, dá contexto para quem analisa e transforma problemas de execução em ajustes claros e mensuráveis.</p><div class="hero-actions"><button data-public-route="contratar" class="public-primary-btn large">Contratar CIA</button><button data-public-route="login" class="public-secondary-btn large">Já sou cliente</button></div><div class="hero-proof"><span>✓ Ambiente isolado por cliente</span><span>✓ Permissões por função</span><span>✓ BKO, Campo e CSV no mesmo produto</span></div></div>'+
  '<div class="hero-product" aria-label="Prévia do CIA"><div class="mock-window"><div class="mock-top"><span class="mock-logo">C</span><i></i><i></i><i></i></div><div class="mock-body"><aside><small>FILA DE ANÁLISE</small><b>12 pendentes</b><div class="mock-row active"><i></i><span><b>Vivo Ibirapuera</b><small>Exposição Echo</small></span></div><div class="mock-row"><i></i><span><b>Fast Shop Morumbi</b><small>Precificação</small></span></div><div class="mock-row"><i></i><span><b>Claro Center Norte</b><small>Material promocional</small></span></div></aside><section><div class="mock-photo"><span>FOTO DA EXECUÇÃO</span></div><div class="mock-decisions"><b>✓ Aprovar</b><b>↗ Ajustar</b><b>× Reprovar</b></div></section><aside class="mock-context"><small>CONTEXTO</small><h3>Vivo Shopping Ibirapuera</h3><p>Rede · Região · Promotor · Supervisor</p><div></div><div></div><div></div></aside></div></div></div></section>'+
  '<section id="produto" class="public-section"><div class="section-intro"><span>UM FLUXO ÚNICO</span><h2>Da foto no PDV à decisão no BKO.</h2><p>O CIA conecta quem executa, quem acompanha e quem corrige, mantendo cada papel simples.</p></div><div class="product-pillars"><article><span>01</span><h3>Receba a execução</h3><p>Fotos chegam pelo CIA Campo ou por CSV, conforme os serviços contratados pelo Ambiente.</p></article><article><span>02</span><h3>Analise com contexto</h3><p>Loja, rede, região, Promotor, Supervisor e histórico aparecem junto da foto.</p></article><article><span>03</span><h3>Corrija rápido</h3><p>O CIA identifica os responsáveis, prepara a mensagem e abre o WhatsApp sem digitar contatos.</p></article><article><span>04</span><h3>Encontre padrões</h3><p>Relatórios mostram onde os problemas se concentram por região, rede, loja, tarefa e motivo.</p></article></div></section>'+
  '<section id="como-funciona" class="public-section workflow-section"><div class="section-intro"><span>COMO FUNCIONA</span><h2>Uma operação inteira organizada em quatro passos.</h2></div><div class="public-flow"><div><b>1</b><span><strong>Configure o Ambiente</strong><small>Admin, equipe, lojas e Cadastro Mestre.</small></span></div><i>→</i><div><b>2</b><span><strong>Receba as fotos</strong><small>CIA Campo ou CSV, sem duplicar processos.</small></span></div><i>→</i><div><b>3</b><span><strong>Analise e ajuste</strong><small>BKO decide e aciona o responsável.</small></span></div><i>→</i><div><b>4</b><span><strong>Acompanhe resultados</strong><small>Dashboard mostra onde agir primeiro.</small></span></div></div></section>'+
  '<section id="servicos" class="public-section services-section"><div class="section-intro"><span>SERVIÇOS</span><h2>Comece pelo modelo que combina com sua operação.</h2><p>A copy comercial e os preços serão refinados depois; a arquitetura de contratação já está pronta.</p></div><div class="public-plans">'+
  planCard(bko,'BKO remoto','Para operações que já possuem um sistema de campo e querem centralizar análise, ajustes e relatórios.')+
  planCard(full,'Operação integrada','Para operações que querem executar as fotos no CIA Campo e analisar tudo no BKO.')+
  '</div></section>'+
  '<section class="public-cta"><span>CIA · EXECUÇÃO PDV</span><h2>Veja o que está acontecendo no campo. Decida antes que o problema vire resultado.</h2><div><button data-public-route="contratar" class="public-primary-btn large">Contratar CIA</button><button data-public-route="login" class="public-secondary-btn large">Fazer login</button></div></section></main>'+
  '<footer class="public-footer"><div class="public-brand static"><span>C</span><div><b>CIA</b><small>Execução PDV</small></div></div><span>Produto em evolução · São Paulo, Brasil</span></footer></div>';
  bindPublicNav();
}
function planCard(plan,label,description){
  if(!plan)return '';
  const features=plan.field_enabled
    ? ['Tudo do CIA BKO','CIA Campo para Promotores','Check-in e check-out','Fotos integradas automaticamente','CSV como canal complementar']
    : ['Análise remota de fotos','Importação CSV','Ajustes via WhatsApp','Relatórios de execução','Cadastro Mestre e usuários'];
  return '<article class="public-plan '+(plan.field_enabled?'featured':'')+'">'+(plan.field_enabled?'<span class="plan-tag">OPERAÇÃO COMPLETA</span>':'')+'<small>'+esc(label)+'</small><h3>'+esc(plan.name)+'</h3><p>'+esc(description||plan.short_description||'')+'</p><ul>'+features.map(x=>'<li>✓ '+esc(x)+'</li>').join('')+'</ul><button class="'+(plan.field_enabled?'public-primary-btn':'public-secondary-btn')+'" data-contract-plan="'+esc(plan.code)+'">Contratar</button></article>';
}
function publicLogin(){
  app.innerHTML='<div class="public-site public-auth-page">'+publicHeader('login')+'<main class="auth-main"><section class="auth-side"><span>ACESSO AO CIA</span><h1>Entre no seu Ambiente.</h1><p>Use a conta criada pelo Admin da sua empresa ou o convite recebido por e-mail.</p><button data-public-route="inicio" class="text-back">← Voltar para o site</button></section><section class="auth-card"><div class="login-brand"><span>C</span><div><b>CIA</b><small>Execução PDV</small></div></div><h2>Fazer login</h2><form id="authForm"><label>E-mail<input id="authEmail" type="email" autocomplete="email" required placeholder="nome@empresa.com"></label><label>Senha<input id="authPass" type="password" autocomplete="current-password" minlength="6" required placeholder="Sua senha"></label><button class="public-primary-btn full" type="submit">Entrar</button><button id="magicBtn" class="public-secondary-btn full" type="button">Receber link de acesso</button><small id="authMsg">Primeiro acesso? Abra o convite enviado ao seu e-mail.</small></form><div class="auth-divider"><span>AINDA NÃO É CLIENTE?</span></div><button data-public-route="contratar" class="text-contract">Conhecer contratação →</button></section></main></div>';
  bindPublicNav();
  const form=document.getElementById('authForm'),msg=document.getElementById('authMsg'),email=()=>document.getElementById('authEmail').value.trim();
  form.onsubmit=async e=>{e.preventDefault();msg.textContent='Entrando...';const {error}=await supabase.auth.signInWithPassword({email:email(),password:document.getElementById('authPass').value});if(error){msg.textContent='Não foi possível entrar. Confira os dados ou use o link de acesso.';return}history.replaceState({},'',location.pathname);await start()};
  document.getElementById('magicBtn').onclick=async()=>{if(!email()){msg.textContent='Informe seu e-mail primeiro.';return}msg.textContent='Enviando link...';const {error}=await supabase.auth.signInWithOtp({email:email(),options:{shouldCreateUser:false,emailRedirectTo:'https://app.usecia.com/?welcome=1'}});msg.textContent=error?error.message:'Link enviado. Verifique seu e-mail.'};
}
function contractPage(preselected=''){
  const plans=state.publicPlans||[];
  let step=1;
  const draft={plan_code:preselected||plans[0]?.code||'bko',company_name:'',trade_name:'',document:'',company_size:'',admin_name:'',admin_email:'',admin_phone:'',commercial_consent:false};
  app.innerHTML='<div class="public-site public-contract-page">'+publicHeader('contratar')+'<main class="contract-main"><aside class="contract-aside"><span>CONTRATAÇÃO</span><h1>Crie seu Ambiente CIA.</h1><p>Você escolhe os serviços, informa a empresa e define o primeiro Admin. O restante é provisionado automaticamente.</p><ol><li class="active"><b>1</b><span>Serviços</span></li><li><b>2</b><span>Empresa</span></li><li><b>3</b><span>Administrador</span></li><li><b>4</b><span>Revisão</span></li></ol><small>A cobrança automática ainda não está conectada. O Ambiente é criado em avaliação e a ativação comercial definitiva é controlada pelo CIA.</small></aside><section id="contractCard" class="contract-card"></section></main></div>';
  bindPublicNav();
  const sideSteps=[...document.querySelectorAll('.contract-aside li')];
  function mark(){sideSteps.forEach((x,i)=>x.classList.toggle('active',i===step-1));}
  function selectedPlan(){return plans.find(p=>p.code===draft.plan_code)||plans[0]}
  function draw(){
    mark();
    const card=document.getElementById('contractCard'),plan=selectedPlan();
    if(step===1)card.innerHTML='<div class="contract-head"><span>PASSO 1 DE 4</span><h2>Quais serviços sua operação precisa?</h2><p>Você não precisa escolher entre Campo e CSV. Os canais disponíveis são definidos pelo pacote contratado.</p></div><div class="contract-plan-list">'+plans.map(p=>'<label class="'+(draft.plan_code===p.code?'selected':'')+'"><input type="radio" name="contractPlan" value="'+esc(p.code)+'" '+(draft.plan_code===p.code?'checked':'')+'><span class="contract-plan-icon">'+(p.field_enabled?'FULL':'BKO')+'</span><div><b>'+esc(p.name)+'</b><small>'+esc(p.short_description||'')+'</small><em>'+ (p.field_enabled?'CIA Campo + BKO + CSV complementar':'BKO + CSV') +'</em></div></label>').join('')+'</div><div class="contract-actions"><button data-public-route="inicio" class="public-secondary-btn">Cancelar</button><button id="contractNext" class="public-primary-btn">Continuar</button></div>';
    if(step===2)card.innerHTML='<div class="contract-head"><span>PASSO 2 DE 4</span><h2>Conte sobre a empresa.</h2><p>Esses dados identificam o Ambiente e podem ser refinados depois pelo Admin.</p></div><div class="contract-fields"><label class="span-2">Razão social / empresa *<input id="companyName" value="'+esc(draft.company_name)+'" autocomplete="organization"></label><label class="span-2">Nome que aparecerá no CIA<input id="tradeName" value="'+esc(draft.trade_name)+'" placeholder="Ex.: Amazon Brasil"></label><label>CNPJ / documento<input id="document" value="'+esc(draft.document)+'" inputmode="numeric"></label><label>Porte<select id="companySize"><option value="">Não informar</option><option value="small" '+(draft.company_size==='small'?'selected':'')+'>Pequena</option><option value="medium" '+(draft.company_size==='medium'?'selected':'')+'>Média</option><option value="large" '+(draft.company_size==='large'?'selected':'')+'>Grande</option><option value="enterprise" '+(draft.company_size==='enterprise'?'selected':'')+'>Enterprise</option></select></label></div><div class="contract-actions"><button id="contractBack" class="public-secondary-btn">Voltar</button><button id="contractNext" class="public-primary-btn">Continuar</button></div>';
    if(step===3)card.innerHTML='<div class="contract-head"><span>PASSO 3 DE 4</span><h2>Quem será o Admin do Ambiente?</h2><p>Este usuário poderá carregar o Cadastro Mestre, convidar pessoas e administrar a operação.</p></div><div class="contract-fields"><label class="span-2">Nome completo *<input id="adminName" value="'+esc(draft.admin_name)+'" autocomplete="name"></label><label>E-mail corporativo *<input id="adminEmail" type="email" value="'+esc(draft.admin_email)+'" autocomplete="email"></label><label>WhatsApp / telefone<input id="adminPhone" value="'+esc(draft.admin_phone)+'" inputmode="tel" autocomplete="tel"></label></div><div class="contract-note"><b>Como funciona o acesso</b><span>Se este e-mail ainda não tiver conta, o CIA enviará um convite. Se já tiver, o novo Ambiente aparecerá na conta existente.</span></div><div class="contract-actions"><button id="contractBack" class="public-secondary-btn">Voltar</button><button id="contractNext" class="public-primary-btn">Continuar</button></div>';
    if(step===4)card.innerHTML='<div class="contract-head"><span>PASSO 4 DE 4</span><h2>Revise antes de criar o Ambiente.</h2><p>O provisionamento leva os serviços escolhidos, cria o Ambiente e vincula o Admin automaticamente.</p></div><div class="contract-review"><div><span>EMPRESA</span><b>'+esc(draft.trade_name||draft.company_name)+'</b><small>'+esc(draft.company_name)+'</small></div><div><span>SERVIÇOS</span><b>'+esc(plan?.name||draft.plan_code)+'</b><small>'+(plan?.field_enabled?'BKO + CIA Campo':'BKO + CSV')+'</small></div><div><span>ADMIN</span><b>'+esc(draft.admin_name)+'</b><small>'+esc(draft.admin_email)+'</small></div><div><span>STATUS INICIAL</span><b>Ambiente de avaliação</b><small>Sem cobrança online nesta etapa</small></div></div><label class="contract-consent"><input id="commercialConsent" type="checkbox" '+(draft.commercial_consent?'checked':'')+'><span>Confirmo que os dados estão corretos e autorizo a criação deste Ambiente para avaliação comercial do CIA.</span></label><div id="contractError" class="contract-error"></div><div class="contract-actions"><button id="contractBack" class="public-secondary-btn">Voltar</button><button id="contractSubmit" class="public-primary-btn">Criar Ambiente</button></div>';
    bindPublicNav();
    document.querySelectorAll('input[name=contractPlan]').forEach(i=>i.onchange=e=>{draft.plan_code=e.target.value;draw()});
    document.getElementById('contractBack')?.addEventListener('click',()=>{saveStep();step--;draw()});
    document.getElementById('contractNext')?.addEventListener('click',()=>{if(!saveStep(true))return;step++;draw()});
    document.getElementById('contractSubmit')?.addEventListener('click',submit);
  }
  function saveStep(validate=false){
    if(step===2){
      draft.company_name=document.getElementById('companyName').value.trim();
      draft.trade_name=document.getElementById('tradeName').value.trim();
      draft.document=document.getElementById('document').value.trim();
      draft.company_size=document.getElementById('companySize').value;
      if(validate&&draft.company_name.length<2){toast('Informe o nome da empresa.',true);return false}
    }
    if(step===3){
      draft.admin_name=document.getElementById('adminName').value.trim();
      draft.admin_email=document.getElementById('adminEmail').value.trim();
      draft.admin_phone=document.getElementById('adminPhone').value.trim();
      if(validate&&draft.admin_name.length<2){toast('Informe o nome do Admin.',true);return false}
      if(validate&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.admin_email)){toast('Informe um e-mail válido.',true);return false}
    }
    return true;
  }
  async function submit(){
    draft.commercial_consent=document.getElementById('commercialConsent').checked;
    const errorEl=document.getElementById('contractError');
    if(!draft.commercial_consent){errorEl.textContent='Confirme os dados para continuar.';return}
    const btn=document.getElementById('contractSubmit');btn.disabled=true;btn.textContent='Criando Ambiente...';errorEl.textContent='';
    const {data,error}=await supabase.functions.invoke('public-contract',{body:draft});
    if(error||data?.error){btn.disabled=false;btn.textContent='Criar Ambiente';errorEl.textContent=data?.error||error.message||'Não foi possível concluir.';return}
    const card=document.getElementById('contractCard');
    card.innerHTML='<div class="contract-success"><span>✓</span><h2>Ambiente criado.</h2><p>'+esc(data.message||'Seu Ambiente CIA está pronto para o próximo passo.')+'</p><div class="success-summary"><div><small>EMPRESA</small><b>'+esc(draft.trade_name||draft.company_name)+'</b></div><div><small>SERVIÇO</small><b>'+esc(data.plan?.name||selectedPlan()?.name||'CIA')+'</b></div></div>'+(data.invited?'<div class="success-next"><b>Agora abra o convite enviado para '+esc(draft.admin_email)+'.</b><span>O link confirma o acesso e leva o Admin ao onboarding inicial.</span></div>':'<div class="success-next"><b>Esta conta já existe.</b><span>Faça login e o novo Ambiente estará disponível.</span></div>')+'<button data-public-route="login" class="public-primary-btn full">Fazer login</button><button data-public-route="inicio" class="public-secondary-btn full">Voltar ao site</button></div>';
    bindPublicNav();
  }
  draw();
}
function renderPublic(){
  const route=publicRoute();
  if(route==='login'){publicLogin();return}
  if(route==='contratar'){const preset=sessionStorage.getItem('cia-contract-plan')||'';sessionStorage.removeItem('cia-contract-plan');contractPage(preset);return}
  publicLanding();
}
async function ensureWorkspace(){
  const {data,error}=await supabase.from('memberships').select('workspace_id,role,display_name,created_at,workspace:workspaces(id,name,settings)').order('created_at');
  if(error) throw error;
  if(!data?.length){
    const {data:boot,error:bootErr}=await supabase.functions.invoke('bootstrap-workspace',{body:{}});
    if(bootErr)throw bootErr;throw new Error(boot?.error||'Seu usuário ainda não foi vinculado a um Ambiente.');
  }
  state.environments=data.map(m=>({...m,workspace_name:m.workspace?.name||'Ambiente'}));
  const savedId=localStorage.getItem('cia-active-environment');
  const chosen=state.environments.find(x=>x.workspace_id===savedId)||state.environments[0];
  localStorage.setItem('cia-active-environment',chosen.workspace_id);
  return chosen;
}
async function switchEnvironment(workspaceId){
  const next=state.environments.find(x=>x.workspace_id===workspaceId);
  if(!next)return;
  state.membership=next;localStorage.setItem('cia-active-environment',workspaceId);
  state.rows=makeRows();state.selected=state.rows[0]?.id||null;
  await loadWorkspaceContext();await loadCloudRows();render();
}
async function loadWorkspaceContext(){
  const workspaceId=state.membership.workspace_id;
  const canAdmin=['owner','admin'].includes(state.membership.role);
  const [{data:ws,error:wsErr},{data:imports,error:impErr},{data:services,error:svcErr},{data:subscription,error:subErr},{data:masterImports,error:miErr},{data:people,error:pErr},{data:assignments,error:aErr},{data:{user},error:userErr}]=await Promise.all([
    supabase.from('workspaces').select('id,name,settings').eq('id',workspaceId).single(),
    supabase.from('imports').select('id,file_name,status,valid_rows,error_rows,created_at,completed_at').eq('workspace_id',workspaceId).order('created_at',{ascending:false}).limit(5),
    supabase.from('environment_services').select('bko_enabled,field_enabled').eq('workspace_id',workspaceId).single(),
    supabase.from('environment_subscriptions').select('workspace_id,plan_code,status,billing_provider,trial_started_at,trial_ends_at,active_since,suspended_at,cancelled_at,plan:service_plans(code,name,bko_enabled,field_enabled)').eq('workspace_id',workspaceId).maybeSingle(),
    supabase.from('master_imports').select('id,file_name,status,stores_count,promoters_count,supervisors_count,error_rows,created_at,completed_at').eq('workspace_id',workspaceId).order('created_at',{ascending:false}).limit(5),
    supabase.from('people').select('id,external_code,full_name,person_role,phone,whatsapp,email,auth_user_id,active').eq('workspace_id',workspaceId).eq('active',true),
    supabase.from('store_assignments').select('id,store_id,promoter_id,supervisor_id,active,store:stores(id,code,name),promoter:people!store_assignments_promoter_id_fkey(id,full_name,whatsapp,phone,email),supervisor:people!store_assignments_supervisor_id_fkey(id,full_name,whatsapp,phone,email)').eq('workspace_id',workspaceId).eq('active',true),
    supabase.auth.getUser()
  ]);
  if(wsErr)throw wsErr;if(impErr)throw impErr;if(svcErr)throw svcErr;if(subErr)throw subErr;if(miErr)throw miErr;if(pErr)throw pErr;if(aErr)throw aErr;if(userErr)throw userErr;
  state.workspace=ws||state.workspace;state.imports=imports||[];state.services=services||{bko_enabled:true,field_enabled:false};state.subscription=subscription||null;state.masterImports=masterImports||[];state.people=people||[];state.assignments=assignments||[];state.user=user;
  state.assignmentMap=new Map();
  for(const a of state.assignments){if(a.store?.code)state.assignmentMap.set(String(a.store.code),a);if(a.store_id)state.assignmentMap.set(String(a.store_id),a)}
  state.users=[];
  if(canAdmin){
    const {data}=await supabase.functions.invoke('environment-admin',{body:{action:'list_users',workspace_id:workspaceId}});
    if(data?.users)state.users=data.users;
  }
}
async function saveWorkspaceSettings(nextSettings,name){
  const workspaceId=state.membership.workspace_id;
  const payload={settings:{...(state.workspace.settings||{}),...nextSettings}};
  if(name)payload.name=name.trim();
  const {data,error}=await supabase.from('workspaces').update(payload).eq('id',workspaceId).select('id,name,settings').single();
  if(error)throw error;state.workspace=data;return data;
}
async function saveProfileName(displayName){
  const {data,error}=await supabase.from('memberships').update({display_name:displayName.trim()}).eq('workspace_id',state.membership.workspace_id).eq('user_id',state.user.id).select('workspace_id,role,display_name').single();
  if(error)throw error;state.membership={...state.membership,...data};return data;
}
async function loadCloudRows(){
  const {data,error}=await supabase
    .from('evidences')
    .select('id,source,status,storage_path,external_url,captured_at,uploaded_at,metadata,current_revision,promoter_id,supervisor_id,store:stores(id,name,code,network,region),task:photo_tasks(title),operation:operations(name,client_name)')
    .eq('workspace_id',state.membership.workspace_id)
    .order('uploaded_at',{ascending:false})
    .limit(500);
  if(error) throw error;
  if(!data?.length){state.demo=true;return}
  const ids=data.map(r=>r.id);
  const {data:reviewRows,error:reviewErr}=await supabase.from('evidence_reviews').select('evidence_id,decision,reason,comment,created_at').in('evidence_id',ids).order('created_at',{ascending:false});
  if(reviewErr)throw reviewErr;
  const reviewMap=new Map();
  for(const review of reviewRows||[]){if(!reviewMap.has(review.evidence_id))reviewMap.set(review.evidence_id,[]);reviewMap.get(review.evidence_id).push(review)}
  const mapped=await Promise.all(data.map(async row=>{
    let image=row.external_url||'';
    if(!image&&row.storage_path){
      const {data:signed}=await supabase.storage.from('cia-evidencias').createSignedUrl(row.storage_path,3600);
      image=signed?.signedUrl||'';
    }
    return {
      id:row.id,client:row.operation?.client_name||'Cliente',operation:row.operation?.name||'Operação',
      store:row.store?.name||'Loja',code:row.store?.code||'',task:row.task?.title||row.metadata?.task||'Execução',
      promoter:(state.assignmentMap.get(String(row.store?.id))?.promoter?.full_name||row.metadata?.promoter||'—'),
      supervisor:(state.assignmentMap.get(String(row.store?.id))?.supervisor?.full_name||row.metadata?.supervisor||'—'),
      promoterContact:state.assignmentMap.get(String(row.store?.id))?.promoter||null,
      supervisorContact:state.assignmentMap.get(String(row.store?.id))?.supervisor||null,
      whatsapp:state.assignmentMap.get(String(row.store?.id))?.supervisor?.whatsapp||state.assignmentMap.get(String(row.store?.id))?.supervisor?.phone||'',
      network:row.store?.network||row.metadata?.network||'—',region:row.store?.region||row.metadata?.region||'—',source:row.source,status:row.status,
      captured_at:row.captured_at||row.uploaded_at,image_url:image||imgs[0],
      criteria:row.metadata?.criteria||{product:false,display:false,material:false,price:false,organization:false,quality:false},
      history:row.metadata?.history||['Execução recebida'],reviews:reviewMap.get(row.id)||[],_metadata:row.metadata||{}
    }
  }));
  state.rows=mapped;state.demo=false;state.selected=(mapped.find(x=>x.status==='pending')||mapped[0]).id;
}
async function saveCloudDecision(e,decision,reason='',comment=''){
  if(state.demo||String(e.id).startsWith('ev-')) return;
  const review={workspace_id:state.membership.workspace_id,evidence_id:e.id,reviewer_id:state.user?.id||null,decision,reason:reason||null,comment:comment||null,criteria:e.criteria};
  const {error:rErr}=await supabase.from('evidence_reviews').insert(review); if(rErr) throw rErr;
  const {error:uErr}=await supabase.from('evidences').update({status:decision}).eq('id',e.id); if(uErr) throw uErr;
}
async function start(){
  if(!supabase){renderPublic();return}
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){await loadPublicPlans();renderPublic();return}
  try{
    state.membership=await ensureWorkspace();
    await loadWorkspaceContext();
    await loadCloudRows();
    const welcome=new URLSearchParams(location.search).get('welcome')==='1';
    if(welcome&&hasRole('admin')){welcomeOnboarding();return}
    if(canUseField()&&!canViewExecution())location.hash='campo';
    render();
  }catch(err){app.innerHTML='<div class="fatal"><b>Não foi possível iniciar o CIA.</b><span>'+esc(err.message)+'</span></div>'}
}
const roleLabel={owner:'Proprietário CIA',admin:'Admin',bko:'BKO',supervisor:'Supervisor',promoter:'Promotor',analyst:'BKO',field:'Promotor',viewer:'Supervisor'};
function hasRole(...roles){return roles.includes(state.membership?.role)}
function canViewExecution(){return state.services?.bko_enabled&&hasRole('owner','admin','bko','analyst','supervisor','viewer')}
function canAnalyze(){return state.services?.bko_enabled&&hasRole('owner','admin','bko','analyst')}
function canReport(){return state.services?.bko_enabled&&hasRole('owner','admin','bko','analyst','supervisor','viewer')}
function canSettings(){return hasRole('owner','admin','bko','analyst')}
function canMaster(){return hasRole('owner','admin')}
function canManageUsers(){return hasRole('owner','admin')}
function canManageEnvironments(){return hasRole('owner')}
function canUseCsv(){return state.services?.bko_enabled&&hasRole('owner','admin','bko','analyst')}
function canUseField(){return state.services?.field_enabled&&hasRole('promoter','field')}
function routeName(){
  const route=(location.hash||'#execucao').replace('#','');
  return ['execucao','relatorios','configuracoes','perfil','campo','ambientes'].includes(route)?route:'execucao';
}
function initials(name){
  return String(name||'U').trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()||'').join('')||'U';
}
function appHeader(active){
  const display=state.membership?.display_name||state.user?.email?.split('@')[0]||'Usuário';
  const envOptions=state.environments.map(e=>'<option value="'+e.workspace_id+'" '+(e.workspace_id===state.membership?.workspace_id?'selected':'')+'>'+esc(e.workspace_name)+'</option>').join('');
  const nav=(canViewExecution()?'<button data-route="execucao" class="'+(active==='execucao'?'active':'')+'">Execução</button>':'')+(canReport()?'<button data-route="relatorios" class="'+(active==='relatorios'?'active':'')+'">Relatórios</button>':'')+(canSettings()?'<button data-route="configuracoes" class="'+(active==='configuracoes'?'active':'')+'">Configurações</button>':'')+(canManageEnvironments()?'<button data-route="ambientes" class="'+(active==='ambientes'?'active':'')+'">Ambientes</button>':'');
  return '<header class="topbar app-header"><div class="brand"><span>C</span><div><b>CIA</b><small>Execução PDV</small></div></div><div class="environment-switch"><small>AMBIENTE</small><select id="environmentSwitch" '+(state.environments.length<2?'disabled':'')+'>'+envOptions+'</select></div><nav class="main-nav">'+nav+'</nav><div class="top-actions"><button id="helpBtn" class="help-icon" title="Como funciona" aria-label="Como funciona">?</button><button data-route="perfil" class="avatar avatar-btn" title="Perfil">'+initials(display)+'</button></div></header>';
}
function bindGlobalNav(){
  document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{location.hash=b.dataset.route});
  document.getElementById('helpBtn')?.addEventListener('click',openHelp);
  document.getElementById('environmentSwitch')?.addEventListener('change',e=>switchEnvironment(e.target.value));
}
function issueReason(row){
  const review=(row.reviews||[]).find(r=>r.reason);
  if(review?.reason)return review.reason;
  const h=(row.history||[]).slice().reverse().find(x=>String(x).includes(':'));
  return h?String(h).split(':').slice(1).join(':').trim():'Sem motivo classificado';
}
function analyzedRows(){return state.rows.filter(r=>['approved','adjustment_requested','rejected'].includes(r.status))}
function problemRows(){return state.rows.filter(r=>['adjustment_requested','rejected'].includes(r.status))}
function aggregateBy(key){
  const map=new Map();
  for(const row of analyzedRows()){
    const label=String(row[key]||'Não informado');
    if(!map.has(label))map.set(label,{label,total:0,issues:0,approved:0,adjust:0,rejected:0});
    const x=map.get(label);x.total++;
    if(row.status==='approved')x.approved++;
    if(row.status==='adjustment_requested'){x.adjust++;x.issues++}
    if(row.status==='rejected'){x.rejected++;x.issues++}
  }
  return [...map.values()].map(x=>({...x,rate:x.total?Math.round(x.issues/x.total*100):0})).sort((a,b)=>b.rate-a.rate||b.issues-a.issues);
}
function reasonBreakdown(){
  const map=new Map();
  for(const row of problemRows()){const reason=issueReason(row);map.set(reason,(map.get(reason)||0)+1)}
  return [...map.entries()].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
}
function riskTone(rate){return rate>=50?'high':rate>=25?'medium':'low'}
function barRows(rows,limit=7){
  const max=Math.max(1,...rows.slice(0,limit).map(x=>x.rate));
  return rows.slice(0,limit).map(x=>'<div class="dash-bar-row"><div class="dash-bar-label"><b>'+esc(x.label)+'</b><span>'+x.issues+' problema'+(x.issues===1?'':'s')+' em '+x.total+' análises</span></div><div class="dash-bar-track"><i class="'+riskTone(x.rate)+'" style="width:'+Math.max(4,Math.round(x.rate/max*100))+'%"></i></div><strong>'+x.rate+'%</strong></div>').join('');
}
function review(){
  const x=current(),k=metrics(),a=list(),nets=[...new Set(state.rows.map(v=>v.network))];
  const pendingCount=state.rows.filter(v=>v.status==='pending').length;
  const resubmittedCount=state.rows.filter(v=>v.status==='resubmitted').length;
  app.innerHTML='<div class="shell">'+appHeader('execucao')+
  '<section class="metrics"><div title="Total de execuções recebidas no período"><span><small>Execuções</small><em>Total no período</em></span><b>'+k.all+'</b></div><div title="Execuções que ainda precisam de decisão"><span><small>A analisar</small><em>Aguardam decisão</em></span><b>'+k.pending+'</b></div><div title="Execuções validadas como corretas"><span><small>Aprovadas</small><em>Execução validada</em></span><b>'+k.approved+'</b></div><div title="Execuções devolvidas ao campo para correção"><span><small>Com ajuste</small><em>Retorno ao campo</em></span><b>'+k.adjust+'</b></div><div title="Execuções não aceitas"><span><small>Reprovadas</small><em>Não aceitas</em></span><b>'+k.rejected+'</b></div><div title="Percentual de execuções aprovadas"><span><small>Taxa de aprovação</small><em>Aprovadas ÷ total</em></span><b>'+(k.all?Math.round(k.approved/k.all*100):0)+'%</b></div></section>'+
  '<section class="filters"><div class="filter-context"><b>Amazon · Execução Echo</b><span>Outubro 2026</span></div><input id="search" value="'+esc(state.search)+'" placeholder="Buscar loja, tarefa ou promotor"><select id="networkFilter"><option value="all">Todas as redes</option>'+nets.map(n=>'<option '+(state.network===n?'selected':'')+'>'+esc(n)+'</option>').join('')+'</select><select id="sourceFilter"><option value="all">Todas as origens</option><option value="mobile_app" '+(state.source==='mobile_app'?'selected':'')+'>CIA Campo</option><option value="csv_import" '+(state.source==='csv_import'?'selected':'')+'>Importação CSV</option></select></section>'+
  '<main class="workspace"><aside class="queue pane '+(state.mobile==='queue'?'active':'')+'"><div class="pane-title"><span>1 · FILA DE ANÁLISE</span><b>O que precisa da sua atenção</b><small>Clique em uma execução abaixo para abrir a foto.</small></div><div class="queue-guide"><b>Como funciona</b><span><i class="guide-dot pending"></i><strong>Pendentes</strong> ainda não foram analisadas.</span><span><i class="guide-dot resubmitted"></i><strong>Reenviadas</strong> voltaram após um ajuste.</span></div><div class="tabs"><button data-q="pending" class="'+(state.queue==='pending'?'active':'')+'">Pendentes <b>'+pendingCount+'</b></button><button data-q="resubmitted" class="'+(state.queue==='resubmitted'?'active':'')+'">Reenviadas <b>'+resubmittedCount+'</b></button><button data-q="all" class="'+(state.queue==='all'?'active':'')+'">Todas <b>'+state.rows.length+'</b></button></div><div class="queue-list">'+(a.map(qcard).join('')||'<div class="empty">Nenhuma execução neste filtro.</div>')+'</div></aside><section class="viewer pane '+(state.mobile==='viewer'?'active':'')+'">'+viewer(x)+'</section><aside class="analysis pane '+(state.mobile==='analysis'?'active':'')+'">'+analysis(x)+'</aside></main>'+
  '<nav class="mobile-nav"><button data-tab="queue" class="'+(state.mobile==='queue'?'active':'')+'">1 · Fila</button><button data-tab="viewer" class="'+(state.mobile==='viewer'?'active':'')+'">2 · Execução</button><button data-tab="analysis" class="'+(state.mobile==='analysis'?'active':'')+'">Contexto</button></nav></div>';
  bindGlobalNav();bindReview();
}
function bindReview(){
  document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{state.queue=b.dataset.q;render()});
  document.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{state.selected=b.dataset.id;state.zoom=1;state.rotation=0;if(innerWidth<900)state.mobile='viewer';render()});
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.mobile=b.dataset.tab;render()});
  document.getElementById('search').oninput=e=>{state.search=e.target.value;render();setTimeout(()=>{const i=document.getElementById('search');i?.focus();i?.setSelectionRange(i.value.length,i.value.length)},0)};
  document.getElementById('networkFilter').onchange=e=>{state.network=e.target.value;render()};
  document.getElementById('sourceFilter').onchange=e=>{state.source=e.target.value;render()};
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
  modal('<header><div><small>COMO FUNCIONA</small><h2>Acompanhe a execução no PDV à distância</h2></div><button data-close>×</button></header><div class="modal-body help-flow"><div class="help-step"><span>1</span><div><b>Escolha na fila</b><p>A coluna da esquerda é sua fila de trabalho. Pendentes ainda precisam de decisão; reenviadas voltaram depois de uma correção.</p></div></div><div class="help-step"><span>2</span><div><b>Confira a execução</b><p>A foto principal mostra o que aconteceu no PDV. O painel à direita traz loja, tarefa e equipe responsável para dar contexto à análise.</p></div></div><div class="help-step"><span>3</span><div><b>Decida</b><p><strong>Aprovar</strong> valida a execução. <strong>Solicitar ajuste</strong> gera a mensagem pronta e abre o WhatsApp. <strong>Reprovar</strong> marca a execução como não aceita.</p></div></div><div class="status-guide"><b>Status</b><div><span class="pill pending">Pendente</span><small>Aguardando análise</small></div><div><span class="pill adjustment_requested">Ajuste solicitado</span><small>Correção enviada ao campo</small></div><div><span class="pill resubmitted">Reenviada</span><small>Nova foto aguardando revisão</small></div><div><span class="pill approved">Aprovada</span><small>Execução validada</small></div><div><span class="pill rejected">Reprovada</span><small>Execução não aceita</small></div></div></div><footer><button data-close class="primary">Entendi</button></footer>');
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
function contactPhone(person){return normalizeWhats(person?.whatsapp||person?.phone||'')}
function openAdjustment(){
  const x=current();
  const types=Object.keys(adjustmentCopy);
  const contacts=[
    {key:'promoter',label:'Promotor',name:x.promoter,person:x.promoterContact},
    {key:'supervisor',label:'Supervisor',name:x.supervisor,person:x.supervisorContact}
  ].map(v=>({...v,phone:contactPhone(v.person)}));
  const available=contacts.filter(v=>v.phone);
  const r=modal('<header><div><small>SOLICITAR AJUSTE</small><h2>Quem deve receber o ajuste?</h2><p class="modal-sub">Os contatos vêm do Cadastro Mestre do Ambiente. Nenhum número precisa ser digitado.</p></div><button data-close>×</button></header><div class="modal-body adjustment-flow"><div class="recipient-options">'+contacts.map((ct,i)=>'<label class="'+(ct.phone?'':'disabled')+'"><input type="radio" name="recipient" value="'+ct.key+'" '+(ct.phone&&i===contacts.findIndex(x=>x.phone)?'checked':'')+' '+(!ct.phone?'disabled':'')+'><span class="recipient-avatar">'+ct.label[0]+'</span><div><b>'+ct.label+' · '+esc(ct.name||'Não identificado')+'</b><small>'+(ct.phone?'WhatsApp cadastrado':'Sem contato no Cadastro Mestre')+'</small></div></label>').join('')+'</div>'+(!available.length?'<div class="contact-warning"><b>Contato não disponível</b><span>Peça ao Admin para atualizar o Cadastro Mestre deste Ambiente.</span></div>':'')+'<label class="field-label">Tipo de ajuste<select id="adjustType">'+types.map(t=>'<option value="'+esc(t)+'">'+esc(t)+'</option>').join('')+'</select></label><label class="field-label">Observação adicional <textarea id="adjustNote" rows="2" placeholder="Opcional — acrescente apenas se precisar contextualizar algo específico."></textarea></label><div class="message-preview"><div><span>Mensagem pronta</span><button id="copyAdjust" type="button">Copiar</button></div><textarea id="adjustMessage" rows="9" readonly></textarea></div></div><footer><button data-close>Cancelar</button><button id="sendAdjust" class="whatsapp-primary" '+(!available.length?'disabled':'')+'>Salvar ajuste e abrir WhatsApp ↗</button></footer>');
  const type=r.querySelector('#adjustType'),note=r.querySelector('#adjustNote'),preview=r.querySelector('#adjustMessage');
  const chosen=()=>{const key=r.querySelector('input[name=recipient]:checked')?.value;return contacts.find(x=>x.key===key)||available[0]};
  const sync=()=>{const ct=chosen();preview.value=buildAdjustmentMessage(x,type.value,note.value.trim())+(ct?'\n\nDestinatário: '+ct.label+' · '+ct.name:'')};sync();
  type.onchange=sync;note.oninput=sync;r.querySelectorAll('input[name=recipient]').forEach(i=>i.onchange=sync);
  r.querySelector('#copyAdjust').onclick=async()=>{try{await navigator.clipboard.writeText(preview.value);toast('Mensagem copiada')}catch{toast('Não foi possível copiar',true)}};
  r.querySelector('#sendAdjust').onclick=async()=>{
    const ct=chosen();
    if(!ct?.phone){toast('Não há contato válido no Cadastro Mestre.',true);return}
    const msg=buildAdjustmentMessage(x,type.value,note.value.trim());
    const url='https://wa.me/'+ct.phone+'?text='+encodeURIComponent(msg);
    const win=window.open('about:blank','_blank');
    try{
      await saveCloudDecision(x,'adjustment_requested',type.value,'Destinatário: '+ct.label+' · '+ct.name+(note.value.trim()?' — '+note.value.trim():''));
      x.status='adjustment_requested';x.history.push('Ajuste enviado ao '+ct.label+' via WhatsApp: '+type.value);persist();
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
  const assignmentByStore=new Map();
  if(storeRows?.length){
    const {data:masterAssignments,error:maErr}=await supabase.from('store_assignments').select('store_id,promoter_id,supervisor_id,promoter:people!store_assignments_promoter_id_fkey(full_name,whatsapp,phone,email),supervisor:people!store_assignments_supervisor_id_fkey(full_name,whatsapp,phone,email)').eq('workspace_id',workspaceId).eq('active',true).in('store_id',storeRows.map(s=>s.id));
    if(maErr)throw maErr;(masterAssignments||[]).forEach(a=>assignmentByStore.set(a.store_id,a));
  }

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
    const storeId=storeIds.get(code),assignment=assignmentByStore.get(storeId);
    return {
      workspace_id:workspaceId,operation_id:operationId,store_id:storeId,photo_task_id:tasksByTitle.get(title),import_id:imp.id,
      promoter_id:assignment?.promoter_id||null,supervisor_id:assignment?.supervisor_id||null,
      source:'csv_import',status:'pending',external_url:r[map.url].trim(),captured_at:parsedDate,
      metadata:{promoter:assignment?.promoter?.full_name||(map.promoter?r[map.promoter]||'—':'—'),supervisor:assignment?.supervisor?.full_name||(map.supervisor?r[map.supervisor]||'—':'—'),network:map.network?r[map.network]||'—':'—',csv_row:r.__row}
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

function welcomeOnboarding(){
  const hasMaster=(state.masterImports||[]).some(x=>x.status==='completed');
  const hasUsers=(state.users||[]).filter(x=>x.role!=='owner'&&x.role!=='admin').length>0;
  app.innerHTML='<div class="page-shell">'+appHeader('')+'<main class="onboarding-main"><div class="onboarding-hero"><span>PRIMEIRO ACESSO</span><h1>Seu Ambiente CIA está pronto.</h1><p>Complete estes passos para começar a receber e analisar execução real.</p></div><div class="onboarding-steps"><article class="'+(hasMaster?'done':'')+'"><b>'+(hasMaster?'✓':'1')+'</b><div><h2>Cadastro Mestre</h2><p>Carregue lojas, Promotores, Supervisores e contatos.</p></div><button data-route="configuracoes" class="btn '+(hasMaster?'ghost':'primary')+'">'+(hasMaster?'Revisar':'Configurar')+'</button></article><article class="'+(hasUsers?'done':'')+'"><b>'+(hasUsers?'✓':'2')+'</b><div><h2>Usuários</h2><p>Convide BKO, Supervisores e Promotores conforme os serviços contratados.</p></div><button data-route="configuracoes" class="btn ghost">Gerenciar</button></article><article><b>3</b><div><h2>Entrada das fotos</h2><p>'+(state.services.field_enabled?'CIA Campo já está habilitado. O CSV também pode ser usado como complemento.':'Este Ambiente usa CSV para entrada das fotos de execução.')+'</p></div><button data-route="configuracoes" class="btn ghost">Ver entrada</button></article></div><div class="onboarding-footer"><button id="finishWelcome" class="public-primary-btn">Entrar no CIA</button></div></main></div>';
  bindGlobalNav();
  document.getElementById('finishWelcome').onclick=()=>{history.replaceState({},'',location.pathname+'#configuracoes');location.hash='configuracoes';render()};
}
async function loadCommercial(){
  const {data,error}=await supabase.functions.invoke('environment-admin',{body:{action:'list_commercial'}});
  if(error||data?.error)throw new Error(data?.error||error.message);
  state.commercial=data.environments||[];
}
function commercialPage(){
  app.innerHTML='<div class="page-shell">'+appHeader('ambientes')+'<main class="page-main commercial-page"><div class="page-heading"><div><span>AMBIENTES</span><h1>Clientes e contratos</h1><p>Acompanhe os Ambientes criados pela landing e controle o estado comercial sem sair do CIA.</p></div><button id="refreshCommercial" class="btn ghost">Atualizar</button></div><div id="commercialBody"><div class="loading-card">Carregando Ambientes...</div></div></main></div>';
  bindGlobalNav();
  const draw=async()=>{
    const body=document.getElementById('commercialBody');
    try{await loadCommercial()}catch(err){body.innerHTML='<div class="access-denied"><b>Não foi possível carregar</b><span>'+esc(err.message)+'</span></div>';return}
    const rows=state.commercial;
    body.innerHTML='<section class="commercial-summary"><article><span>Ambientes</span><b>'+rows.length+'</b></article><article><span>Em avaliação</span><b>'+rows.filter(x=>x.status==='trialing').length+'</b></article><article><span>Ativos</span><b>'+rows.filter(x=>x.status==='active').length+'</b></article><article><span>Suspensos</span><b>'+rows.filter(x=>x.status==='suspended').length+'</b></article></section><section class="commercial-list">'+(rows.map(x=>'<article class="commercial-row"><div class="commercial-company"><span class="status-chip '+x.status+'">'+statusCommercial(x.status)+'</span><h3>'+esc(x.workspace?.name||x.request?.company_name||'Ambiente')+'</h3><p>'+esc(x.request?.company_name||'')+'</p></div><div><small>PLANO</small><b>'+esc(x.plan?.name||x.plan_code)+'</b><span>'+((x.plan?.field_enabled)?'BKO + Campo':'BKO')+'</span></div><div><small>ADMIN</small><b>'+esc(x.request?.admin_name||'—')+'</b><span>'+esc(x.request?.admin_email||'—')+'</span></div><div><small>AVALIAÇÃO</small><b>'+ (x.trial_ends_at?date(x.trial_ends_at):'—') +'</b><span>'+esc(x.billing_provider||'manual')+'</span></div><div class="commercial-actions">'+(x.status!=='active'?'<button data-sub-action="active" data-ws="'+x.workspace_id+'" class="btn primary">Ativar</button>':'')+(x.status!=='suspended'?'<button data-sub-action="suspended" data-ws="'+x.workspace_id+'" class="btn ghost">Suspender</button>':'')+(x.status==='suspended'?'<button data-sub-action="trialing" data-ws="'+x.workspace_id+'" class="btn ghost">Reabrir avaliação</button>':'')+'</div></article>').join('')||'<div class="empty">Nenhum Ambiente comercial criado pela landing ainda.</div>')+'</section>';
    body.querySelectorAll('[data-sub-action]').forEach(b=>b.onclick=async()=>{b.disabled=true;const {data,error}=await supabase.functions.invoke('environment-admin',{body:{action:'set_subscription_status',target_workspace_id:b.dataset.ws,status:b.dataset.subAction}});if(error||data?.error){toast(data?.error||error.message,true);b.disabled=false;return}toast('Status comercial atualizado');draw()});
  };
  document.getElementById('refreshCommercial').onclick=draw;draw();
}
function statusCommercial(v){return ({trialing:'Em avaliação',active:'Ativo',suspended:'Suspenso',cancelled:'Cancelado',past_due:'Pagamento pendente',pending_activation:'Aguardando ativação'})[v]||v}
function reports(){
  const analyzed=analyzedRows(),problems=problemRows(),approval=analyzed.length?Math.round(analyzed.filter(x=>x.status==='approved').length/analyzed.length*100):0;
  const regions=aggregateBy('region'),networks=aggregateBy('network'),stores=aggregateBy('store'),tasks=aggregateBy('task'),reasons=reasonBreakdown();
  const topRegion=regions[0],topReason=reasons[0];
  app.innerHTML='<div class="page-shell">'+appHeader('relatorios')+'<main class="page-main reports-page"><div class="page-heading"><div><span>RELATÓRIOS</span><h1>Onde a execução está falhando?</h1><p>Transforme as análises das fotos em prioridade de campo. O foco aqui é mostrar onde agir primeiro.</p></div><div class="period-chip">Outubro 2026</div></div>'+
  '<section class="report-kpis"><article><span>Execuções analisadas</span><b>'+analyzed.length+'</b><small>Base das análises concluídas</small></article><article><span>Taxa de aprovação</span><b>'+approval+'%</b><small>'+analyzed.filter(x=>x.status==='approved').length+' execuções aprovadas</small></article><article class="attention"><span>Com problema</span><b>'+problems.length+'</b><small>Ajustes + reprovações</small></article><article><span>Principal problema</span><b class="text-kpi">'+esc(topReason?.label||'Sem dados')+'</b><small>'+(topReason?.value||0)+' ocorrência'+((topReason?.value||0)===1?'':'s')+'</small></article></section>'+
  '<section class="insight-banner"><div><span>PRIORIDADE</span><h2>'+(topRegion?esc(topRegion.label):'Sem dados suficientes')+'</h2><p>'+(topRegion?'É a região com maior incidência proporcional de problemas: '+topRegion.rate+'% das execuções analisadas precisam de atenção.':'Analise execuções para gerar uma prioridade de campo.')+'</p></div><strong>'+(topRegion?topRegion.issues:'0')+'</strong><small>problemas</small></section>'+
  '<section class="dashboard-grid"><article class="dash-card wide"><header><div><span>POR REGIÃO</span><h3>Onde concentrar acompanhamento</h3></div><small>% de execuções com problema</small></header><div class="dash-bars">'+barRows(regions)+'</div></article><article class="dash-card"><header><div><span>POR REDE</span><h3>Redes com mais desvio</h3></div></header><div class="dash-bars compact">'+barRows(networks,5)+'</div></article><article class="dash-card"><header><div><span>CAUSAS</span><h3>Problemas mais recorrentes</h3></div></header><ol class="reason-list">'+(reasons.slice(0,6).map((r,i)=>'<li><span>'+(i+1)+'</span><b>'+esc(r.label)+'</b><strong>'+r.value+'</strong></li>').join('')||'<li class="no-data">Sem problemas classificados.</li>')+'</ol></article></section>'+
  '<section class="dashboard-grid bottom"><article class="dash-card wide"><header><div><span>LOJAS CRÍTICAS</span><h3>PDVs que merecem ação primeiro</h3></div></header><div class="hotspot-table"><div class="table-head"><span>Loja</span><span>Análises</span><span>Problemas</span><span>Taxa</span></div>'+stores.slice(0,8).map(x=>'<div class="table-row"><b>'+esc(x.label)+'</b><span>'+x.total+'</span><span>'+x.issues+'</span><strong class="'+riskTone(x.rate)+'">'+x.rate+'%</strong></div>').join('')+'</div></article><article class="dash-card"><header><div><span>POR TAREFA</span><h3>Tipos de execução com mais falhas</h3></div></header><div class="dash-bars compact">'+barRows(tasks,6)+'</div></article></section></main></div>';
  bindGlobalNav();
}
function safeFileName(name){return String(name||'arquivo.csv').replace(/[^a-zA-Z0-9._-]+/g,'-')}
function downloadMasterTemplate(){
  const header=['loja_codigo','loja_nome','rede','regiao','endereco','promotor_codigo','promotor_nome','promotor_whatsapp','promotor_email','supervisor_codigo','supervisor_nome','supervisor_whatsapp','supervisor_email'];
  const sample=['001','Vivo Shopping Ibirapuera','Vivo','Zona Sul','Av. Ibirapuera, 3103','P001','João Silva','11999999999','joao@empresa.com','S001','Maria Santos','11988888888','maria@empresa.com'];
  const blob=new Blob([header.join(',')+'\n'+sample.join(',')+'\n'],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='modelo-cadastro-mestre-cia.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
async function importMasterData(rows,map,file){
  if(!canMaster())throw new Error('Somente o Admin pode atualizar o Cadastro Mestre.');
  const workspaceId=state.membership.workspace_id;
  const valid=rows.filter(r=>r[map.store_code]&&r[map.store_name]&&r[map.promoter_name]&&r[map.supervisor_name]);
  if(!valid.length)throw new Error('Nenhuma linha válida encontrada no arquivo.');
  const storagePath=workspaceId+'/cadastro-mestre/'+Date.now()+'-'+safeFileName(file.name);
  const {error:uploadErr}=await supabase.storage.from('cia-cadastros').upload(storagePath,file,{contentType:'text/csv',upsert:false});
  if(uploadErr)throw uploadErr;
  const {data:imp,error:impErr}=await supabase.from('master_imports').insert({workspace_id:workspaceId,uploaded_by:state.user.id,file_name:file.name,storage_path:storagePath,mapping:map,status:'processing'}).select('id').single();
  if(impErr)throw impErr;

  const storesMap=new Map(),peopleMap=new Map();
  for(const r of valid){
    const storeCode=String(r[map.store_code]).trim();
    if(!storesMap.has(storeCode))storesMap.set(storeCode,{workspace_id:workspaceId,code:storeCode,name:String(r[map.store_name]).trim(),network:map.network?r[map.network]||null:null,region:map.region?r[map.region]||null:null,address:map.address?r[map.address]||null:null});
    const pc=(map.promoter_code&&r[map.promoter_code]?String(r[map.promoter_code]):'PROM-'+norm(r[map.promoter_name])).trim();
    const sc=(map.supervisor_code&&r[map.supervisor_code]?String(r[map.supervisor_code]):'SUP-'+norm(r[map.supervisor_name])).trim();
    peopleMap.set('promoter|'+pc,{workspace_id:workspaceId,external_code:pc,full_name:String(r[map.promoter_name]).trim(),person_role:'promoter',whatsapp:map.promoter_whatsapp?r[map.promoter_whatsapp]||null:null,email:map.promoter_email?r[map.promoter_email]||null:null});
    peopleMap.set('supervisor|'+sc,{workspace_id:workspaceId,external_code:sc,full_name:String(r[map.supervisor_name]).trim(),person_role:'supervisor',whatsapp:map.supervisor_whatsapp?r[map.supervisor_whatsapp]||null:null,email:map.supervisor_email?r[map.supervisor_email]||null:null});
  }
  const {data:storeRows,error:storeErr}=await supabase.from('stores').upsert([...storesMap.values()],{onConflict:'workspace_id,code'}).select('id,code');
  if(storeErr)throw storeErr;
  const {data:personRows,error:personErr}=await supabase.from('people').upsert([...peopleMap.values()],{onConflict:'workspace_id,external_code,person_role'}).select('id,external_code,person_role,email');
  if(personErr)throw personErr;

  const storeIds=new Map((storeRows||[]).map(s=>[String(s.code),s.id]));
  const personIds=new Map((personRows||[]).map(p=>[p.person_role+'|'+p.external_code,p.id]));
  const assignments=[];
  for(const r of valid){
    const storeCode=String(r[map.store_code]).trim();
    const pc=(map.promoter_code&&r[map.promoter_code]?String(r[map.promoter_code]):'PROM-'+norm(r[map.promoter_name])).trim();
    const sc=(map.supervisor_code&&r[map.supervisor_code]?String(r[map.supervisor_code]):'SUP-'+norm(r[map.supervisor_name])).trim();
    assignments.push({workspace_id:workspaceId,store_id:storeIds.get(storeCode),promoter_id:personIds.get('promoter|'+pc)||null,supervisor_id:personIds.get('supervisor|'+sc)||null,active:true});
  }
  const storeIdList=[...new Set(assignments.map(a=>a.store_id).filter(Boolean))];
  if(storeIdList.length){const {error:delErr}=await supabase.from('store_assignments').delete().eq('workspace_id',workspaceId).eq('active',true).in('store_id',storeIdList);if(delErr)throw delErr}
  if(assignments.length){const {error:aErr}=await supabase.from('store_assignments').insert(assignments);if(aErr)throw aErr}

  for(const u of state.users||[]){
    if(!['promoter','supervisor'].includes(u.role)||!u.email)continue;
    await supabase.from('people').update({auth_user_id:u.user_id}).eq('workspace_id',workspaceId).eq('person_role',u.role).ilike('email',u.email);
  }

  await supabase.from('master_imports').update({status:'completed',stores_count:storesMap.size,promoters_count:[...peopleMap.keys()].filter(k=>k.startsWith('promoter|')).length,supervisors_count:[...peopleMap.keys()].filter(k=>k.startsWith('supervisor|')).length,error_rows:rows.length-valid.length,completed_at:new Date().toISOString()}).eq('id',imp.id);
  await loadWorkspaceContext();await loadCloudRows();
  return {stores:storesMap.size,people:peopleMap.size,errors:rows.length-valid.length};
}
function openMasterImport(){
  if(!canMaster()){toast('Somente o Admin pode atualizar o Cadastro Mestre.',true);return}
  let rows=[],headers=[],map={},file=null;
  const aliases={
    store_code:['loja_codigo','Código loja','Codigo loja','ID PDV'],store_name:['loja_nome','Loja','Nome PDV'],network:['rede','Rede'],region:['regiao','Região','Regional'],address:['endereco','Endereço'],
    promoter_code:['promotor_codigo','Código promotor','Matricula promotor'],promoter_name:['promotor_nome','Promotor','Consultor'],promoter_whatsapp:['promotor_whatsapp','WhatsApp promotor','Telefone promotor'],promoter_email:['promotor_email','Email promotor'],
    supervisor_code:['supervisor_codigo','Código supervisor'],supervisor_name:['supervisor_nome','Supervisor','Coordenador'],supervisor_whatsapp:['supervisor_whatsapp','WhatsApp supervisor','Telefone supervisor'],supervisor_email:['supervisor_email','Email supervisor']
  };
  const r=modal('<header><div><small>CADASTRO MESTRE</small><h2>Atualizar lojas e equipe por arquivo</h2><p class="modal-sub">Este arquivo alimenta automaticamente contatos, vínculos e destinatários do WhatsApp.</p></div><button data-close>×</button></header><div id="masterBody" class="modal-body"></div>');
  function auto(){for(const [k,a] of Object.entries(aliases))map[k]=guessHeader(headers,a)}
  function sel(k,label,required=false){return '<div><label>'+label+(required?' *':'')+'</label><select data-master-map="'+k+'"><option value="">— Não mapear —</option>'+headers.map(h=>'<option value="'+esc(h)+'" '+(map[k]===h?'selected':'')+'>'+esc(h)+'</option>').join('')+'</select></div>'}
  function draw(){
    const b=r.querySelector('#masterBody');
    if(!file)b.innerHTML='<div class="master-intro"><div><b>Um arquivo, uma base operacional</b><p>Cada linha representa uma loja e seus responsáveis atuais. O CIA usa esse cadastro para relacionar execução, Promotor, Supervisor e WhatsApp.</p></div><button id="downloadMasterModel" class="btn ghost">Baixar modelo CSV</button></div><div class="drop"><h3>Selecione o arquivo de cadastro</h3><p>CSV com lojas, promotores, supervisores e contatos.</p><input id="masterFile" type="file" accept=".csv,text/csv"><button id="chooseMaster">Selecionar arquivo</button></div>';
    else b.innerHTML='<div class="stepper"><b>'+esc(file.name)+'</b> · '+rows.length+' linhas</div><div class="mapping-form">'+sel('store_code','Código da loja',true)+sel('store_name','Nome da loja',true)+sel('network','Rede')+sel('region','Região')+sel('address','Endereço')+sel('promoter_code','Código do promotor')+sel('promoter_name','Promotor',true)+sel('promoter_whatsapp','WhatsApp do promotor')+sel('promoter_email','E-mail do promotor')+sel('supervisor_code','Código do supervisor')+sel('supervisor_name','Supervisor',true)+sel('supervisor_whatsapp','WhatsApp do supervisor')+sel('supervisor_email','E-mail do supervisor')+'</div><div class="master-summary"><b>O CIA vai atualizar o Cadastro Mestre deste Ambiente.</b><span>Cadastros anteriores da mesma loja/pessoa serão atualizados; os vínculos ativos da loja serão substituídos pelos deste arquivo.</span></div><button id="processMaster" class="primary wide">Validar e atualizar cadastro</button>';
    b.querySelector('#downloadMasterModel')?.addEventListener('click',downloadMasterTemplate);
    b.querySelector('#chooseMaster')?.addEventListener('click',()=>b.querySelector('#masterFile').click());
    b.querySelector('#masterFile')?.addEventListener('change',async e=>{file=e.target.files[0];if(!file)return;rows=parseCSV(await file.text());headers=rows.length?Object.keys(rows[0]).filter(k=>k!=='__row'):[];auto();draw()});
    b.querySelectorAll('[data-master-map]').forEach(s=>s.onchange=e=>{map[e.target.dataset.masterMap]=e.target.value});
    b.querySelector('#processMaster')?.addEventListener('click',async e=>{if(!map.store_code||!map.store_name||!map.promoter_name||!map.supervisor_name){toast('Mapeie os campos obrigatórios.',true);return}e.currentTarget.disabled=true;e.currentTarget.textContent='Atualizando cadastro...';try{const result=await importMasterData(rows,map,file);r.remove();toast('Cadastro Mestre atualizado: '+result.stores+' lojas');render()}catch(err){e.currentTarget.disabled=false;e.currentTarget.textContent='Validar e atualizar cadastro';toast(err.message,true)}});
  }draw();
}
async function inviteEnvironmentUser(){
  const r=modal('<header><div><small>USUÁRIOS</small><h2>Convidar usuário</h2></div><button data-close>×</button></header><div class="modal-body"><div class="mapping-form"><div><label>Nome</label><input id="inviteName" placeholder="Nome completo"></div><div><label>E-mail</label><input id="inviteEmail" type="email" placeholder="nome@empresa.com"></div><div><label>Função</label><select id="inviteRole">'+(hasRole('owner')?'<option value="admin">Admin</option>':'')+'<option value="bko">BKO</option><option value="supervisor">Supervisor</option><option value="promoter">Promotor</option></select></div></div><div class="role-hint">Promotor recebe acesso ao CIA Campo somente quando o serviço Campo estiver ativo no Ambiente.</div></div><footer><button data-close>Cancelar</button><button id="sendInvite" class="primary">Enviar convite</button></footer>');
  r.querySelector('#sendInvite').onclick=async()=>{const name=r.querySelector('#inviteName').value.trim(),email=r.querySelector('#inviteEmail').value.trim(),role=r.querySelector('#inviteRole').value;if(!email){toast('Informe o e-mail.',true);return}const {data,error}=await supabase.functions.invoke('environment-admin',{body:{action:'invite_user',workspace_id:state.membership.workspace_id,email,display_name:name,role}});if(error||data?.error){toast(data?.error||error.message,true);return}r.remove();await loadWorkspaceContext();toast('Convite enviado');render()};
}
function openCreateEnvironment(){
  if(!canManageEnvironments())return;
  const r=modal('<header><div><small>AMBIENTES</small><h2>Cadastrar empresa cliente</h2><p class="modal-sub">Cada Ambiente isola dados, usuários, serviços e cadastros do cliente.</p></div><button data-close>×</button></header><div class="modal-body"><div class="mapping-form"><div><label>Nome do Ambiente</label><input id="envName" placeholder="Ex.: Amazon Brasil"></div><div><label>Nome do Admin cliente</label><input id="envAdminName" placeholder="Nome completo"></div><div><label>E-mail do Admin cliente</label><input id="envAdminEmail" type="email" placeholder="admin@cliente.com"></div></div><div class="service-builder"><label><input id="envBko" type="checkbox" checked><span><b>BKO</b><small>Análise, relatórios e CSV</small></span></label><label><input id="envField" type="checkbox"><span><b>CIA Campo</b><small>Check-in, tarefas e fotos no PDV</small></span></label></div></div><footer><button data-close>Cancelar</button><button id="createEnv" class="primary">Criar Ambiente</button></footer>');
  r.querySelector('#createEnv').onclick=async()=>{const body={action:'create_environment',workspace_id:state.membership.workspace_id,name:r.querySelector('#envName').value.trim(),admin_name:r.querySelector('#envAdminName').value.trim(),admin_email:r.querySelector('#envAdminEmail').value.trim(),bko_enabled:r.querySelector('#envBko').checked,field_enabled:r.querySelector('#envField').checked};const {data,error}=await supabase.functions.invoke('environment-admin',{body});if(error||data?.error){toast(data?.error||error.message,true);return}localStorage.setItem('cia-active-environment',data.workspace.id);r.remove();state.membership=await ensureWorkspace();await loadWorkspaceContext();await loadCloudRows();toast('Ambiente criado');render()};
}
function openServiceEditor(){
  if(!canManageEnvironments())return;
  const r=modal('<header><div><small>SERVIÇOS</small><h2>Serviços contratados neste Ambiente</h2></div><button data-close>×</button></header><div class="modal-body"><div class="service-builder"><label><input id="svcBko" type="checkbox" '+(state.services.bko_enabled?'checked':'')+'><span><b>BKO</b><small>Análise remota, relatórios e CSV.</small></span></label><label><input id="svcField" type="checkbox" '+(state.services.field_enabled?'checked':'')+'><span><b>CIA Campo</b><small>Execução em campo e envio automático de fotos.</small></span></label></div></div><footer><button data-close>Cancelar</button><button id="saveSvc" class="primary">Salvar serviços</button></footer>');
  r.querySelector('#saveSvc').onclick=async()=>{const {data,error}=await supabase.functions.invoke('environment-admin',{body:{action:'update_services',workspace_id:state.membership.workspace_id,bko_enabled:r.querySelector('#svcBko').checked,field_enabled:r.querySelector('#svcField').checked}});if(error||data?.error){toast(data?.error||error.message,true);return}r.remove();await loadWorkspaceContext();toast('Serviços atualizados');render()};
}
function settings(){
  const canAdmin=canMaster(),isOwner=canManageEnvironments(),imports=state.imports||[],masters=state.masterImports||[],users=state.users||[];
  const peopleCounts={promoters:state.people.filter(p=>p.person_role==='promoter').length,supervisors:state.people.filter(p=>p.person_role==='supervisor').length,stores:new Set(state.assignments.map(a=>a.store_id)).size};
  const fieldOn=!!state.services?.field_enabled,bkoOn=!!state.services?.bko_enabled;
  const sourceSummary=fieldOn&&bkoOn?'Fotos automáticas do CIA Campo + CSV disponível como alternativa':fieldOn?'Fotos automáticas pelo CIA Campo':'CSV é o canal de entrada das fotos';
  app.innerHTML='<div class="page-shell">'+appHeader('configuracoes')+'<main class="page-main settings-page"><div class="page-heading"><div><span>CONFIGURAÇÕES</span><h1>'+esc(state.workspace?.name||'Ambiente')+'</h1><p>Serviços, cadastros e acessos deste Ambiente. A rotina de análise continua separada destas configurações.</p></div><div class="environment-status"><span class="'+(bkoOn?'on':'off')+'">BKO '+(bkoOn?'ativo':'inativo')+'</span><span class="'+(fieldOn?'on':'off')+'">CIA Campo '+(fieldOn?'ativo':'inativo')+'</span></div></div>'+
  '<section class="settings-layout"><div class="settings-stack">'+
  '<article class="settings-card service-overview"><header><span>SERVIÇOS CONTRATADOS</span><h2>Como este Ambiente recebe e analisa a execução</h2><p>Não existe escolha entre Campo e CSV. A disponibilidade é definida pelos serviços contratados.</p></header><div class="contracted-services"><div class="'+(bkoOn?'active':'inactive')+'"><span>BKO</span><b>'+(bkoOn?'Contratado':'Não contratado')+'</b><small>Análise remota, relatórios e importação CSV.</small></div><div class="'+(fieldOn?'active':'inactive')+'"><span>CIA CAMPO</span><b>'+(fieldOn?'Contratado':'Não contratado')+'</b><small>Check-in, tarefas e fotos feitas no PDV.</small></div></div><div class="flow-summary"><span>FLUXO DE FOTOS</span><b>'+sourceSummary+'</b><p>'+(fieldOn?'Quando a operação usa CIA Campo, as fotos entram automaticamente. O CSV continua disponível para contingência, legado ou complemento.':'Como este Ambiente não possui CIA Campo, a importação por CSV fica disponível no BKO como canal operacional.')+'</p></div>'+(isOwner?'<button id="editServices" class="btn ghost">Editar serviços contratados</button>':'')+'</article>'+
  (canAdmin?'<article class="settings-card master-card"><header><span>CADASTRO MESTRE</span><h2>Lojas, Promotores, Supervisores e contatos</h2><p>Somente o Admin atualiza esta base. O CIA usa esses dados para vínculos, permissões e envio de ajustes pelo WhatsApp.</p></header><div class="master-kpis"><div><b>'+peopleCounts.stores+'</b><span>Lojas vinculadas</span></div><div><b>'+peopleCounts.promoters+'</b><span>Promotores</span></div><div><b>'+peopleCounts.supervisors+'</b><span>Supervisores</span></div></div><div class="master-actions"><button id="downloadMaster" class="btn ghost">Baixar modelo CSV</button><button id="uploadMaster" class="btn primary">Atualizar Cadastro Mestre</button></div><div class="import-history"><h3>Últimas atualizações</h3>'+(masters.length?masters.map(i=>'<div><span><b>'+esc(i.file_name)+'</b><small>'+date(i.created_at)+' · '+esc(i.status)+'</small></span><strong>'+i.stores_count+' lojas</strong></div>').join(''):'<p>O Cadastro Mestre ainda não foi importado.</p>')+'</div></article>':'')+
  (canUseCsv()?'<article class="settings-card"><header><span>ENTRADA POR CSV</span><h2>Importar fotos de execução</h2><p>Use para operações sem CIA Campo ou como canal complementar quando o Ambiente possui os dois serviços.</p></header><div class="import-action"><div><b>CSV de execução</b><small>O Cadastro Mestre completa automaticamente Promotor, Supervisor e contatos pela loja.</small></div><button id="settingsImport" class="btn primary">Importar CSV</button></div><div class="import-history"><h3>Últimas importações</h3>'+(imports.length?imports.map(i=>'<div><span><b>'+esc(i.file_name)+'</b><small>'+date(i.created_at)+' · '+esc(i.status)+'</small></span><strong>'+i.valid_rows+' fotos</strong></div>').join(''):'<p>Nenhuma importação realizada ainda.</p>')+'</div></article>':'')+
  '</div><aside class="settings-stack">'+
  (canManageUsers()?'<article class="settings-card users-card"><header><span>USUÁRIOS</span><h2>Acessos deste Ambiente</h2><p>O Admin controla quem entra e em qual função. O sistema aplica essas permissões também no backend.</p></header><div class="user-list">'+users.map(u=>'<div class="user-row"><span class="user-avatar">'+initials(u.display_name||u.email)+'</span><div><b>'+esc(u.display_name||u.email)+'</b><small>'+esc(u.email||'')+'</small></div><select data-user-role="'+u.user_id+'" '+(u.role==='owner'||(u.role==='admin'&&!isOwner)?'disabled':'')+'><option value="owner" '+(u.role==='owner'?'selected':'')+' disabled>Proprietário CIA</option><option value="admin" '+(u.role==='admin'?'selected':'')+'>Admin</option><option value="bko" '+(u.role==='bko'?'selected':'')+'>BKO</option><option value="supervisor" '+(u.role==='supervisor'?'selected':'')+'>Supervisor</option><option value="promoter" '+(u.role==='promoter'?'selected':'')+'>Promotor</option></select>'+(u.role!=='owner'&&u.user_id!==state.user?.id?'<button data-remove-user="'+u.user_id+'" class="row-remove" title="Remover acesso">×</button>':'')+'</div>').join('')+'</div><button id="inviteUser" class="btn primary full">Convidar usuário</button></article>':'')+
  '<article class="settings-card permissions-card"><header><span>PERMISSÕES</span><h2>Funções no CIA</h2></header><div class="permission-matrix"><div><b>Admin</b><span>Cadastro Mestre, usuários, BKO, relatórios e CSV</span></div><div><b>BKO</b><span>Analisa fotos, aprova/reprova, solicita ajustes, importa CSV e vê relatórios</span></div><div><b>Supervisor</b><span>Acompanha execução e relatórios, sem alterar cadastros ou decisões</span></div><div><b>Promotor</b><span>Usa somente CIA Campo quando o serviço está contratado</span></div></div></article>'+
  '<article class="settings-card"><header><span>AMBIENTE</span><h2>Identificação</h2></header><label class="settings-field">Nome do Ambiente<input id="workspaceName" value="'+esc(state.workspace?.name||'Ambiente')+'" '+(!canAdmin?'disabled':'')+'></label><label class="settings-field">Fuso horário<select id="timezone" '+(!canAdmin?'disabled':'')+'><option value="America/Sao_Paulo" selected>São Paulo (BRT)</option></select></label>'+(canAdmin?'<button id="saveWorkspace" class="btn ghost full">Salvar identificação</button>':'')+'</article>'+
  (isOwner?'<article class="settings-card environments-card"><header><span>AMBIENTES CLIENTES</span><h2>Empresas cadastradas</h2><p>Ambiente é a unidade isolada de um cliente no CIA.</p></header><div class="environment-list">'+state.environments.map(e=>'<button data-env-open="'+e.workspace_id+'" class="'+(e.workspace_id===state.membership.workspace_id?'active':'')+'"><span><b>'+esc(e.workspace_name)+'</b><small>'+esc(roleLabel[e.role]||e.role)+'</small></span><strong>→</strong></button>').join('')+'</div><button id="createEnvironment" class="btn primary full">Cadastrar novo Ambiente</button></article>':'')+
  '</aside></section></main></div>';
  bindGlobalNav();
  document.getElementById('editServices')?.addEventListener('click',openServiceEditor);
  document.getElementById('downloadMaster')?.addEventListener('click',downloadMasterTemplate);
  document.getElementById('uploadMaster')?.addEventListener('click',openMasterImport);
  document.getElementById('settingsImport')?.addEventListener('click',openImport);
  document.getElementById('inviteUser')?.addEventListener('click',inviteEnvironmentUser);
  document.getElementById('createEnvironment')?.addEventListener('click',openCreateEnvironment);
  document.querySelectorAll('[data-env-open]').forEach(b=>b.onclick=()=>switchEnvironment(b.dataset.envOpen));
  document.getElementById('saveWorkspace')?.addEventListener('click',async()=>{try{await saveWorkspaceSettings({timezone:document.getElementById('timezone').value},document.getElementById('workspaceName').value);state.environments=state.environments.map(e=>e.workspace_id===state.membership.workspace_id?{...e,workspace_name:state.workspace.name}:e);toast('Ambiente atualizado');render()}catch(err){toast(err.message,true)}});
  document.querySelectorAll('[data-user-role]').forEach(s=>s.onchange=async e=>{const {data,error}=await supabase.functions.invoke('environment-admin',{body:{action:'update_role',workspace_id:state.membership.workspace_id,user_id:e.target.dataset.userRole,role:e.target.value}});if(error||data?.error){toast(data?.error||error.message,true);await loadWorkspaceContext();render();return}await loadWorkspaceContext();toast('Função atualizada');render()});
  document.querySelectorAll('[data-remove-user]').forEach(b=>b.onclick=async()=>{if(!confirm('Remover o acesso deste usuário ao Ambiente?'))return;const {data,error}=await supabase.functions.invoke('environment-admin',{body:{action:'remove_user',workspace_id:state.membership.workspace_id,user_id:b.dataset.removeUser}});if(error||data?.error){toast(data?.error||error.message,true);return}await loadWorkspaceContext();toast('Acesso removido');render()});
}
function profile(){
  const display=state.membership?.display_name||'',email=state.user?.email||'—';
  app.innerHTML='<div class="page-shell">'+appHeader('perfil')+'<main class="page-main profile-page"><div class="page-heading"><div><span>PERFIL</span><h1>Sua conta no CIA</h1><p>Dados pessoais, função atual e segurança da conta.</p></div></div><section class="profile-grid"><article class="profile-card identity-card"><div class="profile-avatar">'+initials(display||email)+'</div><h2>'+esc(display||email.split('@')[0])+'</h2><p>'+esc(email)+'</p><span class="role-badge">'+esc(roleLabel[state.membership?.role]||state.membership?.role||'—')+'</span><small class="profile-environment">'+esc(state.workspace?.name||'Ambiente')+'</small></article><article class="profile-card"><h2>Dados pessoais</h2><label class="settings-field">Nome de exibição<input id="profileName" value="'+esc(display)+'" placeholder="Seu nome"></label><label class="settings-field">E-mail<input value="'+esc(email)+'" disabled></label><button id="saveProfile" class="btn primary full">Salvar perfil</button></article><article class="profile-card"><h2>Senha</h2><p class="profile-copy">Defina uma senha para entrar normalmente depois de aceitar um convite ou link de acesso.</p><label class="settings-field">Nova senha<input id="newPassword" type="password" minlength="8" placeholder="Mínimo de 8 caracteres"></label><button id="updatePassword" class="btn ghost full">Atualizar senha</button></article><article class="profile-card session-card"><h2>Sessão</h2><p>Ao sair, será necessário entrar novamente por senha ou link de acesso.</p><button id="logoutBtn" class="btn danger-outline full">Sair do CIA</button></article></section></main></div>';
  bindGlobalNav();
  document.getElementById('saveProfile').onclick=async()=>{try{await saveProfileName(document.getElementById('profileName').value);toast('Perfil atualizado');render()}catch(err){toast(err.message,true)}};
  document.getElementById('updatePassword').onclick=async()=>{const password=document.getElementById('newPassword').value;if(password.length<8){toast('Use pelo menos 8 caracteres.',true);return}const {error}=await supabase.auth.updateUser({password});if(error){toast(error.message,true);return}document.getElementById('newPassword').value='';toast('Senha atualizada')};
  document.getElementById('logoutBtn').onclick=async()=>{await supabase.auth.signOut();state.membership=null;state.user=null;state.environments=[];state.subscription=null;history.replaceState({},'',location.pathname);await loadPublicPlans();renderPublic()};
}
function field(){const stores=[['Vivo Shopping Ibirapuera','Vivo',4,2],['Fast Shop Morumbi','Fast Shop',5,0],['Claro Center Norte','Claro',3,0]];app.innerHTML='<div class="field"><header><div class="field-brand"><span>C</span><b>CIA Campo</b></div><i>'+initials(state.membership?.display_name||'P')+'</i></header><section class="field-hero"><small>Terça, 20 de outubro</small><h1>Bom dia, João.</h1><p>Hoje você tem 3 lojas e 12 fotos de execução previstas.</p></section><section class="field-stats"><div><b>3</b><span>Lojas</span></div><div><b>12</b><span>Fotos</span></div><div><b>2</b><span>Concluídas</span></div></section><main><div class="route-title"><h2>Rota de hoje</h2><span>São Paulo</span></div>'+stores.map((s,i)=>'<article class="store"><strong>'+(i+1)+'</strong><div><small>'+s[1]+'</small><h3>'+s[0]+'</h3><p>'+(i?3+i:'0,2')+' km de distância</p><div class="bar"><i style="width:'+Math.round(s[3]/s[2]*100)+'%"></i></div><em>'+s[3]+'/'+s[2]+' tarefas concluídas</em></div><button data-store="'+i+'">'+(i===0?'Continuar':'Abrir')+'</button></article>').join('')+'</main><button id="cameraFab" class="camera-fab">＋ Nova foto de execução</button></div>';document.querySelectorAll('[data-store],#cameraFab').forEach(b=>b.onclick=openVisit)}
function openVisit(){let checked=false;const r=modal('<header><div><small>VIVO · SHOPPING IBIRAPUERA</small><h2>Visita em campo</h2></div><button data-close>×</button></header><div class="modal-body"><div class="checkin"><div><b>Check-in</b><span>Registre sua chegada à loja.</span></div><button id="checkin" class="primary">Fazer check-in</button></div><div class="tasks">'+['Fachada da loja','Exposição Echo','Precificação','Material promocional'].map((t,i)=>'<article><strong>'+(i+1)+'</strong><div><b>'+t+'</b><small>'+(i===1?'3 fotos':'1 foto')+' obrigatória'+(i===1?'s':'')+'</small></div><button data-photo>Fotografar</button></article>').join('')+'</div><button id="checkout" class="checkout" disabled>Finalizar visita · Check-out</button></div>');r.querySelector('#checkin').onclick=e=>{checked=true;e.target.disabled=true;e.target.textContent='Check-in realizado';r.querySelector('#checkout').disabled=false;toast('Check-in registrado')};r.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{if(!checked){toast('Faça o check-in primeiro',true);return}const i=document.createElement('input');i.type='file';i.accept='image/*';i.capture='environment';i.onchange=()=>{if(i.files?.[0]){b.textContent='Foto adicionada ✓';b.closest('article').classList.add('done');toast('Foto de execução adicionada')}};i.click()});r.querySelector('#checkout').onclick=()=>{toast('Visita finalizada');r.remove()}}
function accessDenied(title,message){
  app.innerHTML='<div class="page-shell">'+appHeader('')+'<main class="page-main"><div class="access-denied"><b>'+esc(title)+'</b><span>'+esc(message)+'</span><button data-route="perfil" class="btn ghost">Ver meu perfil</button></div></main></div>';bindGlobalNav();
}
function render(){
  const route=routeName();
  if(route==='campo'){if(canUseField()){field();return}accessDenied('CIA Campo indisponível','Seu usuário ou este Ambiente não possui acesso ao serviço CIA Campo.');return}
  if(route==='relatorios'){if(canReport()){reports();return}routeName();accessDenied('Relatórios indisponíveis','Sua função não possui acesso aos relatórios deste Ambiente.');return}
  if(route==='configuracoes'){if(canSettings()){settings();return}accessDenied('Configurações indisponíveis','Sua função não administra configurações deste Ambiente.');return}
  if(route==='perfil'){profile();return}
  if(route==='ambientes'){if(canManageEnvironments()){commercialPage();return}accessDenied('Ambientes indisponíveis','Apenas o proprietário da plataforma pode acessar esta área.');return}
  if(canViewExecution()){review();return}
  if(canUseField()){location.hash='campo';return}
  if(canSettings()){location.hash='configuracoes';return}
  accessDenied('Sem módulo disponível','Verifique os serviços contratados e a função atribuída ao seu usuário.');
}
window.addEventListener('hashchange',()=>{
  const publicAnchor=(location.hash||'').replace('#','');
  if(!state.membership&&['produto','como-funciona','servicos'].includes(publicAnchor))return;
  if(state.membership)render();else renderPublic();
});
window.addEventListener('keydown',e=>{
  if(routeName()!=='execucao'||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.querySelector('.modal-root'))return;
  if(e.key==='ArrowRight'){navigate(1);return}
  if(e.key==='ArrowLeft'){navigate(-1);return}
  if(!canAnalyze())return;
  const k=e.key.toLowerCase();
  if(k==='a')decision('approve');
  if(k==='j')decision('adjust');
  if(k==='r')decision('reject');
});
start();