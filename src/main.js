import { createClient } from '@supabase/supabase-js';
import './styles/evidencias.css';
import './styles/cia-design.css';

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
const DEV_DEMO=import.meta.env.DEV&&new URLSearchParams(location.search).get('demo')==='1';
const initialRows=DEV_DEMO?(saved?JSON.parse(saved):makeRows()):[];
const state={rows:initialRows,selected:null,queue:'pending',search:'',source:'all',network:'all',zoom:1,rotation:0,mobile:'queue',membership:null,environments:[],user:null,workspace:{name:'Principal',settings:{timezone:'America/Sao_Paulo'}},services:{bko_enabled:true,field_enabled:false},subscription:null,imports:[],masterImports:[],people:[],assignments:[],assignmentMap:new Map(),users:[],usage:null,publicPlans:[],commercial:[]};
state.selected=(state.rows.find(x=>x.status==='pending')||state.rows[0]||{}).id||null;
const app=document.getElementById('app'), toastRoot=document.getElementById('toastRoot');
let sessionGuardTimer=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=v=>new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit'}).format(new Date(v));
const date=v=>new Intl.DateTimeFormat('pt-BR').format(new Date(v));
const persist=()=>{if(DEV_DEMO||state.demo)localStorage.setItem('cia-evidencias-demo',JSON.stringify(state.rows))};
const current=()=>state.rows.find(x=>x.id===state.selected)||state.rows[0]||null;
function operationContext(){
  const rows=state.rows||[];
  if(!rows.length)return {client:state.workspace?.name||'Ambiente',operation:'Sem execuções',period:'Aguardando dados'};
  const countBy=(key)=>{const m=new Map();for(const r of rows){const v=String(r?.[key]||'').trim();if(v)m.set(v,(m.get(v)||0)+1)}return [...m.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||''};
  const dates=rows.map(r=>new Date(r.captured_at)).filter(d=>!Number.isNaN(d.getTime())).sort((a,b)=>a-b);
  let period='Período sem data';
  if(dates.length){
    const first=dates[0],last=dates[dates.length-1];
    const fmt=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'});
    period=first.getMonth()===last.getMonth()&&first.getFullYear()===last.getFullYear()
      ? fmt.format(last).replace(/^./,m=>m.toUpperCase())
      : new Intl.DateTimeFormat('pt-BR',{month:'short',year:'numeric'}).format(first)+' – '+new Intl.DateTimeFormat('pt-BR',{month:'short',year:'numeric'}).format(last);
  }
  return {client:countBy('client')||state.workspace?.name||'Ambiente',operation:countBy('operation')||'Execução',period};
}
async function logoutUser(){
  if(sessionGuardTimer){clearInterval(sessionGuardTimer);sessionGuardTimer=null}
  await supabase?.auth.signOut().catch(()=>{});
  state.membership=null;state.user=null;state.environments=[];state.subscription=null;state.rows=[];state.selected=null;
  history.replaceState({},'',location.pathname+'#login');
  await loadPublicPlans();
  renderPublic();
}
function toast(msg,bad){const el=document.createElement('div');el.className='toast'+(bad?' bad':'');el.textContent=msg;toastRoot.append(el);setTimeout(()=>el.remove(),2400)}
function list(){let a=state.rows.slice();if(state.queue!=='all')a=a.filter(x=>x.status===state.queue);if(state.search){const q=state.search.toLowerCase();a=a.filter(x=>[x.store,x.task,x.promoter,x.network].some(v=>String(v||'').toLowerCase().includes(q)))}if(state.source!=='all')a=a.filter(x=>x.source===state.source);if(state.network!=='all')a=a.filter(x=>x.network===state.network);return a}
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
  const fields='code,name,short_description,bko_enabled,field_enabled,trial_days,display_order,monthly_price_cents,annual_price_cents,management_seats,field_seats,photo_limit_monthly,featured,audience,extra_management_seat_cents,extra_field_seat_cents,extra_10000_photos_cents';
  const {data,error}=await supabase.from('service_plans').select(fields).eq('active',true).eq('self_service',true).order('display_order');
  if(error){console.warn(error);state.publicPlans=[]}else state.publicPlans=data||[];
  return state.publicPlans;
}
function money(cents){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format((Number(cents)||0)/100)}
function publicRoute(){
  const route=(location.hash||'#inicio').replace('#','').split('?')[0];
  return ['inicio','login','contratar','faq','suporte','quem-somos','seguranca','termos','privacidade','cookies','assinatura'].includes(route)?route:'inicio';
}
function publicHeader(active='inicio'){
  return '<header class="public-header"><button class="public-brand" data-public-route="inicio" aria-label="CIA início"><span>C</span><div><b>CIA</b><small>Execução à distância</small></div></button><nav><button data-home-section="produto">Produto</button><button data-home-section="demonstracao">Demonstração</button><button data-home-section="para-quem">Para quem</button><button data-home-section="servicos">Planos</button><button data-home-section="faq-resumo">FAQ</button></nav><div class="public-actions"><button data-public-route="login" class="public-login-btn">Fazer login</button><button data-public-route="contratar" class="public-primary-btn">Começar avaliação</button></div></header>';
}
function bindPublicNav(){
  document.querySelectorAll('[data-public-route]').forEach(b=>b.onclick=()=>{location.hash=b.dataset.publicRoute});
  document.querySelectorAll('[data-contract-plan]').forEach(b=>b.onclick=()=>{sessionStorage.setItem('cia-contract-plan',b.dataset.contractPlan);location.hash='contratar'});
  document.querySelectorAll('[data-scroll]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:'smooth'}));
  document.querySelectorAll('[data-home-section]').forEach(b=>b.onclick=()=>{
    const section=b.dataset.homeSection;
    if(publicRoute()==='inicio')document.getElementById(section)?.scrollIntoView({behavior:'smooth'});
    else{sessionStorage.setItem('cia-home-section',section);location.hash='inicio'}
  });
}
function setupLandingNavigation(){
  document.querySelector('.back-to-top')?.remove();
  if(window.__ciaLandingObserver)window.__ciaLandingObserver.disconnect();
  if(window.__ciaLandingScroll)window.removeEventListener('scroll',window.__ciaLandingScroll);
  const root=document.querySelector('.public-site');
  if(!root)return;
  const ids=['produto','demonstracao','para-quem','servicos','faq-resumo'];
  const buttons=[...document.querySelectorAll('[data-home-section]')];
  const setActive=id=>buttons.forEach(b=>b.classList.toggle('active',b.dataset.homeSection===id));
  const observer=new IntersectionObserver(entries=>{
    const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(visible)setActive(visible.target.id);
  },{root:null,rootMargin:'-24% 0px -58% 0px',threshold:[.05,.25,.5]});
  ids.forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el)});window.__ciaLandingObserver=observer;
  const top=document.createElement('button');
  top.className='back-to-top';
  top.setAttribute('aria-label','Voltar ao topo');
  top.innerHTML='↑';
  top.onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
  document.body.appendChild(top);
  const updateTop=()=>top.classList.toggle('visible',window.scrollY>520);
  window.__ciaLandingScroll=updateTop;updateTop();window.addEventListener('scroll',updateTop,{passive:true});
}

function mediaSlot(kind,title,caption,ratio='landscape',extra=''){
  return '<div class="cia-media-slot '+ratio+' '+extra+'" data-media-kind="'+esc(kind)+'"><div class="media-slot-grid" aria-hidden="true"></div><div class="media-slot-content"><span class="media-slot-index">'+esc(kind)+'</span><div><b>'+esc(title)+'</b><small>'+esc(caption)+'</small></div><em>CONTEÚDO A PRODUZIR</em></div></div>';
}
function publicLanding(){
  const plans=state.publicPlans||[];
  app.innerHTML='<div class="public-site human-cia">'+publicHeader('inicio')+
  '<main>'+
    '<section class="public-hero human-hero">'+
      '<div class="hero-ghost-word" aria-hidden="true">EXECUÇÃO</div>'+
      '<div class="human-hero-grid"><div class="hero-copy"><span class="hero-kicker">CONTROLE DE EXECUÇÃO À DISTÂNCIA</span><h1>Veja o campo.<br><span class="gradient-text">Decida antes.</span><br>Corrija enquanto importa.</h1><p>O CIA transforma fotos de execução em contexto, decisão e ação. Para quem precisa acompanhar lojas, equipes e padrões sem estar fisicamente em cada ponto.</p><div class="hero-actions"><button data-public-route="contratar" class="public-primary-btn large">Começar avaliação <span>→</span></button><button data-scroll="demonstracao" class="public-secondary-btn large">Ver o produto</button></div><div class="hero-proof"><span>14 dias de avaliação</span><span>Acessos nomeados</span><span>Campo + BKO + CSV</span></div></div>'+
      '<div class="hero-visual">'+mediaSlot('01','Filme manifesto do CIA','Cena de execução em loja + interface real do CIA sobreposta. Desejo, contexto e produto no mesmo filme.','hero-media','primary-media')+'</div></div>'+
    '</section>'+
    '<section class="human-intro-band"><div><span>O PROBLEMA</span><h2>Seu time já produz fotos.<br>O que falta é <em>transformá-las em decisão.</em></h2></div><p>Quando a execução vive entre WhatsApp, planilhas, drives e galerias, o BKO perde tempo procurando contexto. O CIA organiza o que aconteceu, quem é responsável e qual ação precisa acontecer agora.</p></section>'+
    '<section id="produto" class="public-section human-product">'+
      '<div class="human-section-label"><span>01</span><b>PRODUTO</b></div>'+
      '<div class="human-split-head"><h2>Um sistema feito para o momento entre <em>“a foto chegou”</em> e <em>“o problema foi resolvido”.</em></h2><p>Não tentamos substituir tudo. O CIA domina o trecho mais crítico da execução visual: receber, contextualizar, decidir, corrigir e aprender com o padrão.</p></div>'+
      '<div class="human-feature-grid">'+
        '<article class="feature-large"><span>01</span><h3>Receba a execução.</h3><p>Fotos entram pelo CIA Campo ou por CSV. Quem já usa outro sistema pode manter sua operação e conectar apenas o fluxo de análise.</p>'+mediaSlot('A','Interface real — fila de análise','Screenshot do BKO com fila, foto principal e contexto.','wide')+'</article>'+
        '<article><span>02</span><h3>Entenda sem perguntar.</h3><p>Loja, rede, região, tarefa, Promotor, Supervisor e histórico aparecem junto da foto.</p></article>'+
        '<article><span>03</span><h3>Decida em segundos.</h3><p>Aprove, reprove ou solicite ajuste sem abandonar o fluxo de análise.</p></article>'+
        '<article class="feature-wide"><span>04</span><h3>Corrija com o responsável certo.</h3><p>O contato vem do Cadastro Mestre. O CIA prepara a mensagem e abre o WhatsApp para Promotor ou Supervisor.</p>'+mediaSlot('B','Momento da correção','Foto de execução + modal de ajuste + WhatsApp, em composição editorial.','strip')+'</article>'+
      '</div>'+
    '</section>'+
    '<section id="demonstracao" class="public-section human-demo">'+
      '<div class="human-section-label"><span>02</span><b>DEMONSTRAÇÃO</b></div>'+
      '<div class="demo-editorial-grid"><div class="demo-title"><h2>De foto a ação.<br><em>Em quatro movimentos.</em></h2><p>Uma demonstração curta deve mostrar o CIA trabalhando — sem apresentação longa, sem slides e sem esconder o produto.</p></div>'+
      mediaSlot('PLAY','Demonstração do produto','Walkthrough de 60–90 segundos: fila → análise → ajuste → relatório.','cinema','demo-main')+
      '<div class="demo-steps"><article><b>01</b><span><strong>Receba</strong><small>Campo ou CSV.</small></span></article><article><b>02</b><span><strong>Analise</strong><small>Foto + contexto.</small></span></article><article><b>03</b><span><strong>Corrija</strong><small>WhatsApp certo.</small></span></article><article><b>04</b><span><strong>Aprenda</strong><small>Relatórios mostram o padrão.</small></span></article></div></div>'+
    '</section>'+
    '<section id="para-quem" class="public-section human-audience">'+
      '<div class="human-section-label"><span>03</span><b>PARA QUEM</b></div>'+
      '<div class="human-split-head"><h2>Se alguém executa longe e outra pessoa precisa <em>validar à distância</em>, o CIA pode entrar no fluxo.</h2><p>Trade Marketing é o mercado de entrada. A lógica do produto se estende a qualquer operação distribuída em que uma imagem prova o trabalho e o tempo de correção importa.</p></div>'+
      '<div class="usecase-editorial">'+
        '<article class="usecase-primary"><div><span>FOCO PRINCIPAL</span><h3>Trade Marketing<br>& Merchandising</h3><p>Exposição, precificação, MPDV, ponto extra, campanha, ruptura visual e auditoria rápida de execução.</p></div>'+mediaSlot('C','Caso de uso — Trade','Promotor em loja + execução real + interface do CIA no BKO.','portrait')+'</article>'+
        '<article><div><span>02</span><h3>Franquias & redes</h3><p>Padrão visual, campanhas, comunicação e conformidade entre unidades.</p></div>'+mediaSlot('D','Caso de uso — Franquias','Antes/depois de unidade + padrão esperado.','square')+'</article>'+
        '<article><div><span>03</span><h3>Facilities & serviços</h3><p>Limpeza, instalação, manutenção e comprovação visual em múltiplos locais.</p></div>'+mediaSlot('E','Caso de uso — Facilities','Execução técnica documentada com foto.','square')+'</article>'+
        '<article><div><span>04</span><h3>Auditorias de campo</h3><p>Inspeções, antes/depois e qualidade de execução com histórico rastreável.</p></div>'+mediaSlot('F','Caso de uso — Auditoria','Sequência visual de conformidade e não conformidade.','square')+'</article>'+
      '</div>'+
    '</section>'+
    '<section class="public-section human-results">'+
      '<div class="human-section-label"><span>04</span><b>DO CAMPO À GESTÃO</b></div>'+
      '<div class="results-stage"><div class="results-copy"><span>RELATÓRIOS</span><h2>O CIA não termina quando a foto é aprovada.</h2><p>Cada decisão alimenta uma leitura gerencial. Região, rede, loja, tarefa e causa passam a mostrar onde o padrão está quebrando.</p><div class="results-statements"><b>Onde agir.</b><b>Por que agir.</b><b>Em quem agir.</b></div></div>'+mediaSlot('G','Relatórios do CIA','Screenshot editorial da página de Relatórios com KPIs, insight e ranking.','dashboard','dashboard-media')+'</div>'+
    '</section>'+
    '<section class="brand-manifesto"><div class="manifesto-word" aria-hidden="true">CIA</div><span>VER · DECIDIR · CORRIGIR</span><h2>Menos tempo procurando evidência.<br><em>Mais tempo corrigindo execução.</em></h2><p>Essa é a função do CIA.</p></section>'+
    '<section class="public-section human-security"><div class="human-section-label"><span>05</span><b>CONTROLE</b></div><div class="security-editorial"><div><h2>Produto empresarial exige <em>controle empresarial.</em></h2><p>Acesso não é uma senha compartilhada. Cada pessoa tem sua licença, seu papel e sua sessão. Cada cliente opera em um Ambiente isolado.</p></div><div class="security-list"><article><b>01</b><span><strong>1 sessão ativa</strong><small>Novo login substitui a sessão anterior.</small></span></article><article><b>02</b><span><strong>Ambientes isolados</strong><small>Dados de clientes não se misturam.</small></span></article><article><b>03</b><span><strong>Permissões por função</strong><small>Admin, BKO, Supervisor e Promotor.</small></span></article><article><b>04</b><span><strong>Limites no backend</strong><small>Licenças e fotos seguem o plano contratado.</small></span></article></div></div></section>'+
    '<section id="servicos" class="public-section human-pricing"><div class="human-section-label"><span>06</span><b>PLANOS</b></div><div class="human-split-head"><h2>Comece com o que precisa.<br><em>E escale sem refazer a operação.</em></h2><p>Todos os planos incluem 14 dias de avaliação. No anual, o valor equivale a 10 mensalidades. Licenças e volume podem crescer junto com a operação.</p></div><div class="public-plans three">'+plans.map(planCard).join('')+'</div><div class="pricing-foot"><b>Precisa de capacidade adicional?</b><span>Gestão +R$ 79/mês por acesso · CIA Campo +R$ 19/mês por acesso · +10 mil fotos por R$ 149/mês. Configurações multiambiente entram no Scale.</span></div></section>'+
    '<section id="faq-resumo" class="public-section human-faq"><div class="human-section-label"><span>07</span><b>FAQ</b></div><div class="faq-editorial"><div><h2>Antes de começar.</h2><p>As dúvidas que normalmente aparecem antes de colocar o CIA dentro de uma operação real.</p><button data-public-route="faq" class="public-secondary-btn">Ver FAQ completo</button></div><div class="faq-list"><details><summary>Preciso trocar meu aplicativo de campo?</summary><p>Não. O CIA Auditoria trabalha com CSV e links de fotos. Nos planos com CIA Campo, a coleta pode acontecer dentro do próprio CIA.</p></details><details><summary>Posso usar Campo e CSV juntos?</summary><p>Sim. O CSV continua disponível como canal complementar quando o Campo está contratado.</p></details><details><summary>Posso compartilhar um login?</summary><p>Não. Licenças são nomeadas e cada usuário mantém apenas uma sessão ativa.</p></details><details><summary>Como funciona a avaliação?</summary><p>O Ambiente é criado por 14 dias dentro dos limites do plano escolhido.</p></details></div></div></section>'+
    '<section class="human-final-cta"><div class="final-cta-ghost" aria-hidden="true">CAMPO</div><span>PRONTO PARA VER O CIA TRABALHANDO?</span><h2>O campo não precisa estar perto.<br><em>A decisão precisa.</em></h2><div><button data-public-route="contratar" class="public-primary-btn large">Começar avaliação <span>→</span></button><button data-public-route="login" class="public-secondary-btn large">Fazer login</button></div></section>'+
  '</main>'+publicFooter()+'</div>';
  bindPublicNav();setupLandingNavigation();
  const target=sessionStorage.getItem('cia-home-section');if(target){sessionStorage.removeItem('cia-home-section');setTimeout(()=>document.getElementById(target)?.scrollIntoView({behavior:'smooth'}),80)}
}
function planCard(plan){
  if(!plan)return '';
  const annualEq=plan.annual_price_cents?Math.round(plan.annual_price_cents/12):0;
  const features=[
    plan.management_seats+' acessos de gestão nomeados',
    (plan.field_seats>0?plan.field_seats+' acessos CIA Campo':'Entrada de fotos por CSV'),
    new Intl.NumberFormat('pt-BR').format(plan.photo_limit_monthly||0)+' fotos/mês',
    'Cadastro Mestre + WhatsApp',
    'Dashboard e relatórios'
  ];
  if(plan.field_enabled)features.splice(3,0,'CIA Campo + CSV complementar');
  return '<article class="public-plan '+(plan.featured?'featured':'')+'">'+(plan.featured?'<span class="plan-tag">MAIS INDICADO</span>':'')+'<small>'+esc(plan.audience||'')+'</small><h3>'+esc(plan.name)+'</h3><div class="plan-price"><b>'+money(plan.monthly_price_cents)+'</b><span>/mês</span></div><em>ou '+money(plan.annual_price_cents)+'/ano · equivalente a '+money(annualEq)+'/mês</em><p>'+esc(plan.short_description||'')+'</p><ul>'+features.map(x=>'<li>✓ '+esc(x)+'</li>').join('')+'</ul><button class="'+(plan.featured?'public-primary-btn':'public-secondary-btn')+'" data-contract-plan="'+esc(plan.code)+'">Testar por '+(plan.trial_days||14)+' dias</button></article>';
}
function publicFooter(){
  return '<footer class="site-footer"><div class="footer-top"><div class="footer-brand"><div class="public-brand static"><span>C</span><div><b>CIA</b><small>Execução à distância</small></div></div><p>Controle visual de operações distribuídas. Veja, decida e corrija sem depender da próxima visita.</p></div><div class="footer-col"><b>Produto</b><button data-public-route="inicio">Visão geral</button><button data-public-route="contratar">Planos e avaliação</button><button data-public-route="faq">FAQ</button><button data-public-route="seguranca">Segurança</button></div><div class="footer-col"><b>Empresa</b><button data-public-route="quem-somos">Quem somos</button><button data-public-route="suporte">Suporte e contato</button><button data-public-route="login">Fazer login</button></div><div class="footer-col"><b>Legal</b><button data-public-route="termos">Termos de Uso</button><button data-public-route="privacidade">Privacidade e LGPD</button><button data-public-route="cookies">Cookies</button><button data-public-route="assinatura">Política comercial</button></div></div><div class="footer-bottom"><span>© 2026 CIA. Todos os direitos reservados.</span><span>Versão institucional 1.0 · 21/10/2026</span></div></footer>';
}
function publicPageShell(kicker,title,intro,body){
  return '<div class="public-site institutional-site">'+publicHeader()+'<main class="institutional-main"><section class="institutional-hero"><span>'+esc(kicker)+'</span><h1>'+title+'</h1><p>'+intro+'</p></section>'+body+'</main>'+publicFooter()+'</div>';
}
function faqPage(){
  const groups=[
    ['Produto',[['O que é o CIA?','O CIA é uma plataforma para acompanhar execução visual à distância. Ele organiza fotos, contexto operacional, decisões, ajustes e relatórios em um único fluxo.'],['Preciso substituir meu aplicativo de campo?','Não. O CIA Auditoria recebe fotos por CSV. Nos planos com CIA Campo, a coleta pode acontecer dentro do próprio CIA e o CSV continua disponível como complemento.'],['O CIA serve apenas para Trade Marketing?','Trade Marketing e Merchandising são o foco inicial, mas o mesmo fluxo atende franquias, redes, facilities, inspeções e auditorias em que uma foto comprova execução.']]],
    ['Acessos e segurança',[['Posso compartilhar uma senha com outra pessoa?','Não. As licenças são nomeadas e pessoais. Uma conta mantém somente uma sessão ativa por vez; um novo acesso substitui a sessão anterior.'],['Os dados de uma empresa podem aparecer para outra?','Não. Cada empresa opera em um Ambiente isolado e as permissões do banco restringem o acesso ao Ambiente e à função do usuário.'],['Quem pode administrar usuários e cadastros?','O Admin do Ambiente administra usuários e o Cadastro Mestre. BKO, Supervisor e Promotor têm permissões diferentes, aplicadas também no backend.']]],
    ['Operação',[['Como funciona um pedido de ajuste?','O BKO escolhe o motivo e o destinatário — Promotor ou Supervisor. O número vem do Cadastro Mestre e o CIA abre o WhatsApp com a mensagem preparada.'],['Como o CIA sabe quem é o responsável pela loja?','O Admin carrega o Cadastro Mestre com lojas, Promotores, Supervisores e contatos. Esse vínculo é reutilizado em toda a operação.'],['O Supervisor pode aprovar fotos?','Por padrão, não. Supervisor acompanha equipe e relatórios; decisões de aprovação, ajuste e reprovação ficam com Admin/BKO autorizados.']]],
    ['Planos e contratação',[['A avaliação tem cobrança?','A avaliação inicial é de 14 dias. Enquanto a cobrança automática não está integrada, a ativação comercial definitiva é tratada pelo CIA antes de qualquer cobrança recorrente.'],['O que acontece se eu atingir um limite?','O CIA aplica limites de acessos e fotos no backend. Você pode contratar adicionais ou migrar de plano sem compartilhar credenciais.'],['Posso cancelar?','Sim. As condições de cancelamento, vigência e eventuais valores já pagos seguem a Política Comercial, a proposta aceita e a legislação aplicável.']]]
  ];
  const body='<section class="faq-full">'+groups.map(g=>'<div class="faq-group"><h2>'+esc(g[0])+'</h2>'+g[1].map(q=>'<details><summary>'+esc(q[0])+'</summary><p>'+esc(q[1])+'</p></details>').join('')+'</div>').join('')+'</section><section class="institutional-cta"><div><span>AINDA TEM DÚVIDA?</span><h2>Fale com o CIA.</h2></div><button data-public-route="suporte" class="public-primary-btn">Abrir suporte</button></section>';
  app.innerHTML=publicPageShell('CENTRAL DE DÚVIDAS','Perguntas frequentes.','Respostas diretas sobre produto, operação, acessos, segurança e contratação.',body); bindPublicNav();
}
function aboutPage(){
  const body='<section class="story-grid"><article class="story-main glass-panel"><span>POR QUE O CIA EXISTE</span><h2>Fotos de campo só têm valor quando viram decisão.</h2><p>O CIA nasceu de um problema operacional comum: equipes distribuídas produzem muitas fotos, mas a análise continua espalhada entre WhatsApp, planilhas, drives e sistemas que não foram desenhados para decidir rápido.</p><p>Em vez de tentar substituir toda a operação de campo, o CIA concentra o trecho mais crítico: receber a execução, dar contexto, decidir, acionar quem precisa corrigir e transformar as análises em informação gerencial.</p></article><div class="story-values"><article class="glass-panel"><b>01</b><h3>Clareza antes de complexidade</h3><p>O produto deve reduzir trabalho operacional, não criar uma nova camada de burocracia.</p></article><article class="glass-panel"><b>02</b><h3>Execução antes de evidência</h3><p>A foto é o meio. O que importa é saber se a execução aconteceu do jeito certo.</p></article><article class="glass-panel"><b>03</b><h3>Correção enquanto ainda importa</h3><p>A informação precisa chegar ao responsável antes que o problema vire resultado perdido.</p></article></div></section><section class="company-focus"><span>FOCO INICIAL</span><h2>Trade Marketing é o ponto de partida. Execução distribuída é o mercado.</h2><div><b>Trade & Merchandising</b><b>Franquias & Redes</b><b>Facilities</b><b>Auditorias de campo</b></div></section>';
  app.innerHTML=publicPageShell('SOBRE O CIA','Um produto construído para enxergar o campo à distância.','O CIA conecta execução, contexto, decisão e correção em operações distribuídas.',body); bindPublicNav();
}
function securityPage(){
  const body='<section class="trust-grid">'+[['01','Ambientes isolados','Dados, usuários, lojas, fotos e relatórios são separados por Ambiente. As regras de acesso são aplicadas no banco, não apenas na interface.'],['02','Acessos nomeados','Cada licença pertence a uma pessoa. Uma conta mantém uma única sessão ativa; novo login substitui a sessão anterior.'],['03','Permissão por função','Admin, BKO, Supervisor e Promotor possuem capacidades distintas. O backend valida função e serviço contratado antes de executar ações.'],['04','Armazenamento protegido','Arquivos operacionais e cadastros usam armazenamento privado e controles de acesso vinculados ao Ambiente.'],['05','Princípio do menor acesso','Usuários veem apenas os módulos e dados necessários ao trabalho.'],['06','Segurança por concepção','Limites de plano, sessões, autorização e isolamento fazem parte da arquitetura.']].map(x=>'<article class="trust-card"><span>'+x[0]+'</span><h2>'+x[1]+'</h2><p>'+x[2]+'</p></article>').join('')+'</section><section class="security-note-page"><span>DIVULGAÇÃO RESPONSÁVEL</span><h2>Encontrou uma vulnerabilidade?</h2><p>Não explore dados de terceiros. Envie os detalhes pela categoria Segurança em nosso formulário de suporte para investigação prioritária.</p><button data-public-route="suporte" class="public-primary-btn">Reportar segurança</button></section>';
  app.innerHTML=publicPageShell('CENTRAL DE CONFIANÇA','Segurança não é um recurso opcional.','A arquitetura do CIA separa clientes, funções e sessões para reduzir acesso indevido e proteger a operação.',body); bindPublicNav();
}
function supportPage(){
  const body='<section class="support-layout"><div class="support-info"><article class="glass-panel"><span>SUPORTE</span><h2>Precisa de ajuda com o produto?</h2><p>Envie o contexto e, se possível, informe o Ambiente, tela e comportamento observado. Nossa meta de primeira resposta durante a fase atual é de até 1 dia útil.</p></article><article class="glass-panel"><span>PRIVACIDADE E SEGURANÇA</span><h2>Pedidos LGPD ou incidentes</h2><p>Use as categorias Privacidade ou Segurança. Essas solicitações recebem triagem separada.</p></article><article class="glass-panel"><span>COMERCIAL</span><h2>Planos, adicionais e contratação</h2><p>Use a categoria Comercial para dúvidas de avaliação, licenças, volumes ou projetos multiambiente.</p></article></div><form id="supportForm" class="support-form glass-panel"><div class="support-form-head"><span>FALE COM O CIA</span><h2>Como podemos ajudar?</h2></div><input id="supportWebsite" class="honeypot" tabindex="-1" autocomplete="off"><div class="support-fields"><label>Categoria<select id="supportCategory"><option value="support">Suporte técnico</option><option value="sales">Comercial</option><option value="billing">Planos e cobrança</option><option value="privacy">Privacidade / LGPD</option><option value="security">Segurança</option><option value="other">Outro</option></select></label><label>Nome<input id="supportName" autocomplete="name" required></label><label>E-mail<input id="supportEmail" type="email" autocomplete="email" required></label><label>Empresa<input id="supportCompany" autocomplete="organization"></label><label class="span-2">Assunto<input id="supportSubject" required></label><label class="span-2">Mensagem<textarea id="supportMessage" rows="6" required placeholder="Explique o que aconteceu ou o que você precisa."></textarea></label></div><div id="supportMsg" class="support-msg"></div><button class="public-primary-btn full" type="submit">Enviar solicitação</button></form></section>';
  app.innerHTML=publicPageShell('SUPORTE E CONTATO','Um caminho simples para falar com o CIA.','Suporte técnico, comercial, privacidade e segurança em um único ponto de contato.',body); bindPublicNav();
  const form=document.getElementById('supportForm'),msg=document.getElementById('supportMsg');
  form.onsubmit=async e=>{e.preventDefault();msg.textContent='Enviando...'; const payload={category:document.getElementById('supportCategory').value,name:document.getElementById('supportName').value.trim(),email:document.getElementById('supportEmail').value.trim(),company:document.getElementById('supportCompany').value.trim(),subject:document.getElementById('supportSubject').value.trim(),message:document.getElementById('supportMessage').value.trim(),website:document.getElementById('supportWebsite').value}; const {data,error}=await supabase.functions.invoke('public-support',{body:payload}); if(error||data?.error){msg.textContent=data?.error||error.message||'Não foi possível enviar.';msg.className='support-msg bad';return} msg.textContent='Recebemos sua solicitação. Protocolo '+String(data.id||'').slice(0,8).toUpperCase()+'.';msg.className='support-msg good';form.reset();};
}
const legalCopy={
  termos:{kicker:'TERMOS DE USO',title:'Regras para usar o CIA.',intro:'Condições gerais de acesso e utilização da plataforma CIA.',sections:[['1. Escopo','Estes Termos disciplinam o acesso e uso do CIA, plataforma de gestão de execução visual à distância, incluindo módulos BKO, CIA Campo, relatórios, importações e recursos administrativos.'],['2. Público e contas','O CIA é destinado principalmente a pessoas jurídicas e seus usuários autorizados. Cada acesso é pessoal, nominal e intransferível. O compartilhamento de credenciais é proibido e uma conta mantém somente uma sessão ativa por vez.'],['3. Responsabilidade do cliente','O cliente é responsável pela exatidão dos cadastros, legitimidade das imagens e dados enviados, definição de usuários autorizados e instruções dadas aos trabalhadores e prestadores que utilizam a plataforma.'],['4. Uso aceitável','É proibido utilizar o CIA para conteúdo ilícito, violação de direitos de terceiros, tentativa de acesso não autorizado, engenharia reversa abusiva, exploração de vulnerabilidades ou interferência na disponibilidade do serviço.'],['5. Conteúdo do cliente','O cliente mantém os direitos sobre seus dados, fotos e materiais. O CIA recebe autorização limitada para armazenar, processar e disponibilizar esse conteúdo na medida necessária para prestar o serviço.'],['6. Disponibilidade e evolução','O CIA pode receber melhorias, correções e alterações de interface. Níveis de serviço específicos só se aplicam quando formalizados em proposta ou contrato.'],['7. Suspensão','O acesso pode ser suspenso por violação destes Termos, risco de segurança, uso indevido, encerramento de avaliação ou situação comercial prevista na contratação.'],['8. Propriedade intelectual','A marca CIA, interface, código, modelos, componentes e documentação pertencem aos respectivos titulares e não são transferidos ao cliente pela assinatura.'],['9. Integrações externas','Integrações como WhatsApp e futuros meios de pagamento também estão sujeitas às condições de seus respectivos fornecedores.'],['10. Lei aplicável','Aplicam-se as leis brasileiras. Direitos obrigatórios previstos em lei prevalecem sobre estes Termos quando aplicáveis.']]},
  privacidade:{kicker:'PRIVACIDADE E LGPD',title:'Dados pessoais com finalidade e controle.',intro:'Como o CIA trata dados pessoais no site, na contratação e dentro dos Ambientes.',sections:[['1. Papéis de tratamento','Nos dados necessários para cadastro, contratação, segurança, suporte e relacionamento comercial, a entidade responsável pelo CIA atua como controladora. Para dados operacionais enviados por empresas clientes, o CIA tende a atuar como operador, seguindo instruções do cliente controlador, conforme o contexto contratual.'],['2. Dados tratados','Podem ser tratados dados de identificação e contato, função profissional, autenticação e sessão, registros técnicos de segurança, suporte, empresa, lojas, vínculos operacionais e conteúdo enviado pelo cliente.'],['3. Finalidades','Usamos dados para criar Ambientes, autenticar usuários, executar o produto, proteger sessões, prestar suporte, processar contratação, aplicar limites, prevenir fraude e cumprir obrigações legais.'],['4. Bases legais','O tratamento pode se apoiar, conforme o caso, na execução de contrato, procedimentos preliminares, obrigação legal, legítimo interesse, exercício regular de direitos e consentimento quando adequado.'],['5. Compartilhamento','Dados podem ser processados por fornecedores de infraestrutura, autenticação, hospedagem, comunicação e, futuramente, pagamento, limitados ao necessário para a prestação do serviço.'],['6. Segurança','O CIA utiliza isolamento por Ambiente, permissões por função, controles de sessão, armazenamento privado e políticas de acesso no backend.'],['7. Retenção','Dados são mantidos pelo período necessário às finalidades informadas, cumprimento contratual, segurança, obrigações legais e exercício de direitos.'],['8. Direitos dos titulares','Titulares podem exercer os direitos previstos na LGPD conforme o contexto aplicável, incluindo confirmação, acesso, correção e informações sobre tratamento.'],['9. Solicitações','Pedidos relacionados a dados pessoais devem ser enviados pela página de Suporte, categoria Privacidade / LGPD.'],['10. Atualizações','Esta política poderá ser atualizada para acompanhar mudanças do produto, fornecedores ou legislação.']]},
  cookies:{kicker:'POLÍTICA DE COOKIES',title:'Poucos rastreadores. Mais transparência.',intro:'Como o site e o aplicativo lidam com armazenamento local e tecnologias semelhantes.',sections:[['1. Necessários','O CIA utiliza mecanismos necessários para autenticação, sessão, segurança, preferência de Ambiente e funcionamento da aplicação.'],['2. Analíticos','Nesta versão, o CIA não depende de cookies de publicidade para funcionar. Caso ferramentas analíticas não essenciais sejam ativadas, elas deverão respeitar a preferência registrada.'],['3. Marketing','Cookies ou identificadores de marketing não necessários não serão tratados como essenciais. Se forem introduzidos, a finalidade e o fornecedor serão informados.'],['4. Armazenamento local','Algumas preferências podem ser guardadas no navegador, como dispositivo reconhecido, preferências de cookies e Ambiente ativo.'],['5. Gestão','O banner permite manter apenas o necessário ou aceitar categorias opcionais. Hoje, nenhuma ferramenta opcional de analytics/marketing é carregada por essa escolha.']]},
  assinatura:{kicker:'POLÍTICA COMERCIAL',title:'Planos, licenças, avaliação e cancelamento.',intro:'Regras comerciais que complementam a proposta ou contratação aceita pelo cliente.',sections:[['1. Avaliação','Os planos públicos incluem período inicial de avaliação de 14 dias, sujeito aos limites técnicos do plano escolhido. Enquanto a cobrança automática não está conectada, a ativação definitiva ocorre após validação comercial.'],['2. Planos e limites','Cada plano define quantidade de acessos de gestão, acessos CIA Campo e volume mensal de fotos. Os limites são aplicados tecnicamente no backend.'],['3. Licenças','Licenças são nomeadas, pessoais e não compartilháveis. Acessos extras podem ser contratados conforme preços vigentes.'],['4. Mensal e anual','O cliente pode optar pela periodicidade disponibilizada. A oferta anual atualmente apresentada equivale a 10 mensalidades, salvo condição comercial diferente expressamente informada.'],['5. Volume adicional','Blocos adicionais de fotos e licenças extras podem ser adicionados ao Ambiente.'],['6. Renovação e pagamento','Quando a cobrança automática for habilitada, renovação, método de pagamento, falha de cobrança, upgrade, downgrade e cancelamento serão apresentados antes da confirmação.'],['7. Suspensão','Ambientes podem ser suspensos por encerramento da avaliação, inadimplência futura, risco de segurança ou violação contratual.'],['8. Cancelamento e direitos legais','Contratos empresariais seguem a proposta aceita. Quando normas de proteção ao consumidor forem aplicáveis à relação concreta, os direitos legais correspondentes prevalecem.'],['9. Identificação do fornecedor','Antes do início de cobrança automática, checkout e documentos comerciais deverão exibir razão social, CNPJ, endereço e canais da pessoa jurídica responsável pela comercialização do CIA.']] }
};
function legalArticlePage(type){
  const p=legalCopy[type]; const sections=p.sections.map(s=>'<h2>'+esc(s[0])+'</h2><p>'+esc(s[1])+'</p>').join('');
  const body='<section class="legal-layout"><article class="legal-article glass-panel">'+sections+'<hr><p class="legal-version">Versão 1.0 · vigente a partir de 21 de outubro de 2026.</p></article><aside class="legal-side"><div class="glass-panel"><b>Base jurídica em preparação</b><p>Antes da primeira cobrança real, os dados societários e fiscais da empresa responsável devem ser inseridos e estes documentos devem passar por revisão jurídica profissional.</p></div><button data-public-route="suporte" class="public-secondary-btn full">Falar sobre este documento</button></aside></section>';
  app.innerHTML=publicPageShell(p.kicker,p.title,p.intro,body); bindPublicNav();
}
function renderCookieBanner(){
  if(document.querySelector('.cookie-banner')||localStorage.getItem('cia-cookie-preferences'))return;
  const el=document.createElement('div'); el.className='cookie-banner glass-panel';
  el.innerHTML='<div><b>Privacidade por padrão.</b><span>Usamos armazenamento necessário para o CIA funcionar. Categorias opcionais só serão usadas conforme sua preferência quando forem ativadas.</span></div><div><button id="cookieNecessary" class="public-secondary-btn">Somente necessários</button><button data-public-route="cookies" class="public-secondary-btn">Ver política</button><button id="cookieAll" class="public-primary-btn">Aceitar opcionais</button></div>';
  document.body.appendChild(el); bindPublicNav();
  document.getElementById('cookieNecessary').onclick=()=>{localStorage.setItem('cia-cookie-preferences',JSON.stringify({necessary:true,analytics:false,marketing:false,at:new Date().toISOString()}));el.remove()};
  document.getElementById('cookieAll').onclick=()=>{localStorage.setItem('cia-cookie-preferences',JSON.stringify({necessary:true,analytics:true,marketing:true,at:new Date().toISOString()}));el.remove()};
}
function publicLogin(){
  document.body.classList.add('public-mode');
  app.innerHTML='<div class="public-site public-auth-page human-auth">'+publicHeader('login')+'<main class="human-auth-main"><section class="human-auth-visual">'+mediaSlot('LOGIN','O campo na sua tela','Imagem futura: gestor analisando uma execução real com o CIA sobreposto, em composição editorial.','auth-media')+'<div class="auth-visual-copy"><span>ACESSO AO CIA</span><h1>Entre.<br><em>Veja o que está acontecendo.</em></h1><p>Seu Ambiente, suas execuções e suas decisões continuam de onde você parou.</p></div></section><section class="human-auth-panel"><div class="login-brand"><span>C</span><div><b>CIA</b><small>Execução à distância</small></div></div><div class="auth-form-title"><span>ÁREA DO CLIENTE</span><h2>Fazer login</h2><p>Use seu acesso individual. Cada conta mantém somente uma sessão ativa.</p></div><form id="authForm"><label>E-mail<input id="authEmail" type="email" autocomplete="email" required placeholder="nome@empresa.com"></label><label>Senha<input id="authPass" type="password" autocomplete="current-password" minlength="6" required placeholder="Sua senha"></label><button class="public-primary-btn full" type="submit">Entrar <span>→</span></button><button id="magicBtn" class="public-secondary-btn full" type="button">Receber link de acesso</button><small id="authMsg">Primeiro acesso? Abra o convite enviado ao seu e-mail.</small></form><div class="auth-divider"><span>AINDA NÃO É CLIENTE?</span></div><button data-public-route="contratar" class="text-contract">Conhecer planos e avaliação →</button></section></main></div>';
  bindPublicNav();
  const form=document.getElementById('authForm'),msg=document.getElementById('authMsg'),email=()=>document.getElementById('authEmail').value.trim();
  form.onsubmit=async e=>{e.preventDefault();msg.textContent='Entrando...';const {error}=await supabase.auth.signInWithPassword({email:email(),password:document.getElementById('authPass').value});if(error){msg.textContent='Não foi possível entrar. Confira os dados ou use o link de acesso.';return}history.replaceState({},'',location.pathname);await start()};
  document.getElementById('magicBtn').onclick=async()=>{if(!email()){msg.textContent='Informe seu e-mail primeiro.';return}msg.textContent='Enviando link...';const {error}=await supabase.auth.signInWithOtp({email:email(),options:{shouldCreateUser:false,emailRedirectTo:'https://app.usecia.com/?welcome=1'}});msg.textContent=error?error.message:'Link enviado. Verifique seu e-mail.'};
}
function contractPage(preselected=''){
  const plans=state.publicPlans||[];
  let step=1;
  const draft={plan_code:preselected||plans[0]?.code||'bko',billing_interval:'monthly',company_name:'',trade_name:'',document:'',company_size:'',admin_name:'',admin_email:'',admin_phone:'',commercial_consent:false,legal_acceptance:false};
  app.innerHTML='<div class="public-site public-contract-page">'+publicHeader('contratar')+'<main class="contract-main"><aside class="contract-aside"><span>AVALIAÇÃO DE 14 DIAS</span><h1>Crie seu Ambiente CIA.</h1><p>Escolha o plano, cadastre a empresa e defina o primeiro Admin. O CIA provisiona o Ambiente e as licenças automaticamente.</p><ol><li class="active"><b>1</b><span>Plano</span></li><li><b>2</b><span>Empresa</span></li><li><b>3</b><span>Administrador</span></li><li><b>4</b><span>Revisão</span></li></ol><small>Cada acesso é pessoal. O plano define quantos usuários de gestão, usuários de campo e fotos mensais o Ambiente pode utilizar.</small></aside><section id="contractCard" class="contract-card"></section></main></div>';
  bindPublicNav();
  const sideSteps=[...document.querySelectorAll('.contract-aside li')];
  const selectedPlan=()=>plans.find(p=>p.code===draft.plan_code)||plans[0];
  const selectedPrice=()=>draft.billing_interval==='annual'?selectedPlan()?.annual_price_cents:selectedPlan()?.monthly_price_cents;
  function mark(){sideSteps.forEach((x,i)=>x.classList.toggle('active',i===step-1))}
  function draw(){
    mark();
    const card=document.getElementById('contractCard'),plan=selectedPlan();
    if(step===1){
      card.innerHTML='<div class="contract-head"><span>PASSO 1 DE 4</span><h2>Escolha o tamanho da sua operação.</h2><p>Você pode mudar de plano depois. O anual equivale a 10 mensalidades.</p></div><div class="billing-toggle"><button data-billing="monthly" class="'+(draft.billing_interval==='monthly'?'active':'')+'">Mensal</button><button data-billing="annual" class="'+(draft.billing_interval==='annual'?'active':'')+'">Anual <b>2 meses grátis</b></button></div><div class="contract-plan-list">'+plans.map(p=>'<label class="'+(draft.plan_code===p.code?'selected':'')+'"><input type="radio" name="contractPlan" value="'+esc(p.code)+'" '+(draft.plan_code===p.code?'checked':'')+'><span class="contract-plan-icon">'+(p.code==='scale'?'SCALE':p.field_enabled?'CAMPO':'AUDIT')+'</span><div><b>'+esc(p.name)+'</b><strong>'+money(draft.billing_interval==='annual'?p.annual_price_cents:p.monthly_price_cents)+(draft.billing_interval==='annual'?' / ano':' / mês')+'</strong><small>'+esc(p.short_description||'')+'</small><em>'+p.management_seats+' gestão · '+p.field_seats+' campo · '+new Intl.NumberFormat('pt-BR').format(p.photo_limit_monthly)+' fotos/mês</em></div></label>').join('')+'</div><div class="contract-actions"><button data-public-route="inicio" class="public-secondary-btn">Cancelar</button><button id="contractNext" class="public-primary-btn">Continuar</button></div>';
    }
    if(step===2){
      card.innerHTML='<div class="contract-head"><span>PASSO 2 DE 4</span><h2>Qual empresa vai usar o CIA?</h2><p>Esse cadastro cria o Ambiente isolado onde ficarão usuários, lojas, fotos e relatórios.</p></div><div class="contract-fields"><label class="span-2">Razão social / empresa *<input id="companyName" value="'+esc(draft.company_name)+'" autocomplete="organization"></label><label class="span-2">Nome que aparecerá no CIA<input id="tradeName" value="'+esc(draft.trade_name)+'" placeholder="Ex.: Operação Amazon Brasil"></label><label>CNPJ / documento<input id="document" value="'+esc(draft.document)+'" inputmode="numeric"></label><label>Porte<select id="companySize"><option value="">Não informar</option><option value="small" '+(draft.company_size==='small'?'selected':'')+'>Pequena</option><option value="medium" '+(draft.company_size==='medium'?'selected':'')+'>Média</option><option value="large" '+(draft.company_size==='large'?'selected':'')+'>Grande</option><option value="enterprise" '+(draft.company_size==='enterprise'?'selected':'')+'>Enterprise</option></select></label></div><div class="contract-actions"><button id="contractBack" class="public-secondary-btn">Voltar</button><button id="contractNext" class="public-primary-btn">Continuar</button></div>';
    }
    if(step===3){
      card.innerHTML='<div class="contract-head"><span>PASSO 3 DE 4</span><h2>Quem será o Admin do Ambiente?</h2><p>O Admin cuida do Cadastro Mestre, usuários e configurações. O acesso é individual e não deve ser compartilhado.</p></div><div class="contract-fields"><label class="span-2">Nome completo *<input id="adminName" value="'+esc(draft.admin_name)+'" autocomplete="name"></label><label>E-mail corporativo *<input id="adminEmail" type="email" value="'+esc(draft.admin_email)+'" autocomplete="email"></label><label>WhatsApp / telefone<input id="adminPhone" value="'+esc(draft.admin_phone)+'" inputmode="tel" autocomplete="tel"></label></div><div class="contract-note"><b>Proteção de licença</b><span>Cada usuário possui uma sessão ativa por vez. Se a mesma conta entrar em outro dispositivo, o acesso anterior é encerrado.</span></div><div class="contract-actions"><button id="contractBack" class="public-secondary-btn">Voltar</button><button id="contractNext" class="public-primary-btn">Continuar</button></div>';
    }
    if(step===4){
      const priceLabel=draft.billing_interval==='annual'?money(plan?.annual_price_cents)+'/ano':money(plan?.monthly_price_cents)+'/mês';
      card.innerHTML='<div class="contract-head"><span>PASSO 4 DE 4</span><h2>Revise antes de criar o Ambiente.</h2><p>Você terá 14 dias para avaliar o fluxo com os limites do plano escolhido.</p></div><div class="contract-review"><div><span>EMPRESA</span><b>'+esc(draft.trade_name||draft.company_name)+'</b><small>'+esc(draft.company_name)+'</small></div><div><span>PLANO</span><b>'+esc(plan?.name||draft.plan_code)+'</b><small>'+priceLabel+'</small></div><div><span>LICENÇAS</span><b>'+plan.management_seats+' gestão · '+plan.field_seats+' campo</b><small>'+new Intl.NumberFormat('pt-BR').format(plan.photo_limit_monthly)+' fotos/mês</small></div><div><span>ADMIN</span><b>'+esc(draft.admin_name)+'</b><small>'+esc(draft.admin_email)+'</small></div></div><label class="contract-consent"><input id="commercialConsent" type="checkbox" '+(draft.commercial_consent?'checked':'')+'><span>Confirmo os dados e aceito os <a href="#termos" target="_blank" rel="noopener">Termos de Uso</a>, a <a href="#privacidade" target="_blank" rel="noopener">Política de Privacidade</a> e a <a href="#assinatura" target="_blank" rel="noopener">Política Comercial</a> do CIA.</span></label><div id="contractError" class="contract-error"></div><div class="contract-actions"><button id="contractBack" class="public-secondary-btn">Voltar</button><button id="contractSubmit" class="public-primary-btn">Criar Ambiente de avaliação</button></div>';
    }
    bindPublicNav();
    document.querySelectorAll('[data-billing]').forEach(b=>b.onclick=()=>{draft.billing_interval=b.dataset.billing;draw()});
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
    draft.legal_acceptance=draft.commercial_consent;
    const errorEl=document.getElementById('contractError');
    if(!draft.commercial_consent){errorEl.textContent='Aceite os Termos, a Política de Privacidade e a Política Comercial para continuar.';return}
    const btn=document.getElementById('contractSubmit');btn.disabled=true;btn.textContent='Criando Ambiente...';errorEl.textContent='';
    const {data,error}=await supabase.functions.invoke('public-contract',{body:draft});
    if(error||data?.error){btn.disabled=false;btn.textContent='Criar Ambiente de avaliação';errorEl.textContent=data?.error||error.message||'Não foi possível concluir.';return}
    const plan=selectedPlan(),card=document.getElementById('contractCard');
    card.innerHTML='<div class="contract-success"><span>✓</span><h2>Seu Ambiente CIA foi criado.</h2><p>'+esc(data.message||'Agora é só concluir o primeiro acesso.')+'</p><div class="success-summary"><div><small>EMPRESA</small><b>'+esc(draft.trade_name||draft.company_name)+'</b></div><div><small>PLANO</small><b>'+esc(plan?.name||'CIA')+'</b></div></div><div class="success-next"><b>'+ (data.invited?'Convite enviado para '+esc(draft.admin_email):'A conta do Admin já existia.') +'</b><span>'+ (data.invited?'Abra o e-mail para definir o acesso e iniciar o onboarding.':'Faça login e selecione o novo Ambiente.') +'</span></div><button data-public-route="login" class="public-primary-btn full">Fazer login</button><button data-public-route="inicio" class="public-secondary-btn full">Voltar ao site</button></div>';
    bindPublicNav();
  }
  draw();
}
function renderPublic(){
  document.body.classList.add('public-mode');
  const route=publicRoute();
  if(route==='login')publicLogin();
  else if(route==='contratar'){const preset=sessionStorage.getItem('cia-contract-plan')||'';sessionStorage.removeItem('cia-contract-plan');contractPage(preset)}
  else if(route==='faq')faqPage();
  else if(route==='suporte')supportPage();
  else if(route==='quem-somos')aboutPage();
  else if(route==='seguranca')securityPage();
  else if(route==='termos')legalArticlePage('termos');
  else if(route==='privacidade')legalArticlePage('privacidade');
  else if(route==='cookies')legalArticlePage('cookies');
  else if(route==='assinatura')legalArticlePage('assinatura');
  else publicLanding();
  setTimeout(renderCookieBanner,0);
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
  const period=new Date();period.setDate(1);const periodKey=period.toISOString().slice(0,10);
  const [{data:ws,error:wsErr},{data:imports,error:impErr},{data:services,error:svcErr},{data:subscription,error:subErr},{data:usage,error:usageErr},{data:masterImports,error:miErr},{data:people,error:pErr},{data:assignments,error:aErr},{data:{user},error:userErr}]=await Promise.all([
    supabase.from('workspaces').select('id,name,settings').eq('id',workspaceId).single(),
    supabase.from('imports').select('id,file_name,status,valid_rows,error_rows,created_at,completed_at').eq('workspace_id',workspaceId).order('created_at',{ascending:false}).limit(5),
    supabase.from('environment_services').select('bko_enabled,field_enabled').eq('workspace_id',workspaceId).single(),
    supabase.from('environment_subscriptions').select('workspace_id,plan_code,status,billing_provider,billing_interval,contracted_price_cents,licensed_management_seats,licensed_field_seats,photo_limit_monthly,extra_management_seats,extra_field_seats,extra_photo_blocks,trial_started_at,trial_ends_at,active_since,suspended_at,cancelled_at,plan:service_plans(code,name,bko_enabled,field_enabled,management_seats,field_seats,photo_limit_monthly,monthly_price_cents,annual_price_cents)').eq('workspace_id',workspaceId).maybeSingle(),
    supabase.from('environment_usage_monthly').select('photos_count,period').eq('workspace_id',workspaceId).eq('period',periodKey).maybeSingle(),
    supabase.from('master_imports').select('id,file_name,status,stores_count,promoters_count,supervisors_count,error_rows,created_at,completed_at').eq('workspace_id',workspaceId).order('created_at',{ascending:false}).limit(5),
    supabase.from('people').select('id,external_code,full_name,person_role,phone,whatsapp,email,auth_user_id,active').eq('workspace_id',workspaceId).eq('active',true),
    supabase.from('store_assignments').select('id,store_id,promoter_id,supervisor_id,active,store:stores(id,code,name),promoter:people!store_assignments_promoter_id_fkey(id,full_name,whatsapp,phone,email),supervisor:people!store_assignments_supervisor_id_fkey(id,full_name,whatsapp,phone,email)').eq('workspace_id',workspaceId).eq('active',true),
    supabase.auth.getUser()
  ]);
  if(wsErr)throw wsErr;if(impErr)throw impErr;if(svcErr)throw svcErr;if(subErr)throw subErr;if(usageErr)throw usageErr;if(miErr)throw miErr;if(pErr)throw pErr;if(aErr)throw aErr;if(userErr)throw userErr;
  state.workspace=ws||state.workspace;state.imports=imports||[];state.services=services||{bko_enabled:true,field_enabled:false};state.subscription=subscription||null;state.usage=usage||{photos_count:0,period:periodKey};state.masterImports=masterImports||[];state.people=people||[];state.assignments=assignments||[];state.user=user;
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
  if(!data?.length){state.rows=[];state.selected=null;state.demo=false;return}
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
function deviceId(){
  let id=localStorage.getItem('cia-device-id');
  if(!id){id=crypto.randomUUID();localStorage.setItem('cia-device-id',id)}
  return id;
}
async function enforceSingleSession({quiet=false}={}){
  const {data,error}=await supabase.functions.invoke('session-gate',{body:{device_id:deviceId()}});
  if(error)throw error;
  if(!data?.ok){
    if(sessionGuardTimer){clearInterval(sessionGuardTimer);sessionGuardTimer=null}
    await supabase.auth.signOut({scope:'local'}).catch(()=>{});
    state.membership=null;state.user=null;state.environments=[];state.subscription=null;
    history.replaceState({},'',location.pathname+'#login');
    await loadPublicPlans();
    publicLogin();
    const msg=document.getElementById('authMsg');
    if(msg)msg.textContent='Este acesso foi encerrado porque esta conta entrou em outro dispositivo. Cada usuário do CIA possui apenas uma sessão ativa.';
    return false;
  }
  if(!quiet&&data.replaced)toast('Novo acesso confirmado. A sessão anterior desta conta foi encerrada.');
  return true;
}
function startSessionHeartbeat(){
  if(sessionGuardTimer)clearInterval(sessionGuardTimer);
  sessionGuardTimer=setInterval(async()=>{
    try{await enforceSingleSession({quiet:true})}catch{}
  },60000);
}
async function start(){
  if(!supabase){renderPublic();return}
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){await loadPublicPlans();renderPublic();return}
  try{
    const allowed=await enforceSingleSession();
    if(!allowed)return;
    startSessionHeartbeat();
    state.membership=await ensureWorkspace();
    await loadWorkspaceContext();
    await loadCloudRows();
    const welcome=new URLSearchParams(location.search).get('welcome')==='1';
    if(welcome&&hasRole('admin')){welcomeOnboarding();return}
    if(canUseField()&&!canViewExecution())location.hash='campo';
    render();
  }catch(err){
    if(String(err?.message||'').toLowerCase().includes('permission denied')){
      await enforceSingleSession({quiet:true}).catch(()=>{});
      return;
    }
    app.innerHTML='<div class="fatal"><b>Não foi possível iniciar o CIA.</b><span>'+esc(err.message)+'</span></div>'
  }
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
  return '<header class="topbar app-header"><div class="brand"><span>C</span><div><b>CIA</b><small>Execução à distância</small></div></div><div class="environment-switch"><small>AMBIENTE</small><select id="environmentSwitch" '+(state.environments.length<2?'disabled':'')+'>'+envOptions+'</select></div><nav class="main-nav">'+nav+'</nav><div class="top-actions"><button id="helpBtn" class="help-icon" title="Como funciona" aria-label="Como funciona">?</button><button data-route="perfil" class="avatar avatar-btn" title="Perfil">'+initials(display)+'</button><button id="globalLogoutBtn" class="logout-btn" title="Encerrar sessão" aria-label="Encerrar sessão"><span>↗</span><b>Sair</b></button></div></header>';
}
function bindGlobalNav(){
  document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{location.hash=b.dataset.route});
  document.getElementById('helpBtn')?.addEventListener('click',openHelp);
  document.getElementById('globalLogoutBtn')?.addEventListener('click',logoutUser);
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
  const k=metrics(),ctx=operationContext(),nets=[...new Set(state.rows.map(v=>v.network).filter(Boolean))];
  const pendingCount=state.rows.filter(v=>v.status==='pending').length;
  const resubmittedCount=state.rows.filter(v=>v.status==='resubmitted').length;
  if(!state.rows.length){
    app.innerHTML='<div class="shell execution-shell">'+appHeader('execucao')+
      '<section class="metrics"><div><span><small>Execuções</small><em>Total no período</em></span><b>0</b></div><div><span><small>A analisar</small><em>Aguardam decisão</em></span><b>0</b></div><div><span><small>Aprovadas</small><em>Execução validada</em></span><b>0</b></div><div><span><small>Com ajuste</small><em>Retorno ao campo</em></span><b>0</b></div><div><span><small>Reprovadas</small><em>Não aceitas</em></span><b>0</b></div><div><span><small>Taxa de aprovação</small><em>Aprovadas ÷ total</em></span><b>0%</b></div></section>'+
      '<section class="filters execution-toolbar"><div class="filter-context"><b>'+esc(state.workspace?.name||'Ambiente')+'</b><span>Nenhuma execução recebida</span></div></section>'+
      '<main class="execution-empty"><div class="empty-mark">01</div><span>EXECUÇÃO</span><h1>Pronto para receber a primeira execução.</h1><p>Este Ambiente ainda não possui fotos. Use o CIA Campo ou importe um CSV com links de imagens para começar a análise.</p><div class="empty-actions">'+(canUseCsv()?'<button id="emptyImportBtn" class="btn primary">Importar CSV</button>':'')+(canSettings()?'<button data-route="configuracoes" class="btn ghost">Configurar Ambiente</button>':'')+'</div></main></div>';
    bindGlobalNav();
    document.getElementById('emptyImportBtn')?.addEventListener('click',openImport);
    return;
  }
  const x=current(),a=list();
  app.innerHTML='<div class="shell execution-shell">'+appHeader('execucao')+
  '<section class="metrics"><div title="Total de execuções recebidas no período"><span><small>Execuções</small><em>Total no período</em></span><b>'+k.all+'</b></div><div title="Execuções que ainda precisam de decisão"><span><small>A analisar</small><em>Aguardam decisão</em></span><b>'+k.pending+'</b></div><div title="Execuções validadas como corretas"><span><small>Aprovadas</small><em>Execução validada</em></span><b>'+k.approved+'</b></div><div title="Execuções devolvidas ao campo para correção"><span><small>Com ajuste</small><em>Retorno ao campo</em></span><b>'+k.adjust+'</b></div><div title="Execuções não aceitas"><span><small>Reprovadas</small><em>Não aceitas</em></span><b>'+k.rejected+'</b></div><div title="Percentual de execuções aprovadas"><span><small>Taxa de aprovação</small><em>Aprovadas ÷ total</em></span><b>'+(k.all?Math.round(k.approved/k.all*100):0)+'%</b></div></section>'+
  '<section class="filters execution-toolbar"><div class="filter-context"><b>'+esc(ctx.client)+' · '+esc(ctx.operation)+'</b><span>'+esc(ctx.period)+'</span></div><input id="search" value="'+esc(state.search)+'" placeholder="Buscar loja, tarefa ou promotor"><select id="networkFilter"><option value="all">Todas as redes</option>'+nets.map(n=>'<option '+(state.network===n?'selected':'')+'>'+esc(n)+'</option>').join('')+'</select><select id="sourceFilter"><option value="all">Todas as origens</option><option value="mobile_app" '+(state.source==='mobile_app'?'selected':'')+'>CIA Campo</option><option value="csv_import" '+(state.source==='csv_import'?'selected':'')+'>Importação CSV</option></select></section>'+
  '<main class="workspace execution-workspace"><aside class="queue pane '+(state.mobile==='queue'?'active':'')+'"><div class="pane-title"><span>1 · FILA</span><b>O que precisa da sua atenção</b><small>Selecione uma execução para abrir a foto.</small></div><div class="queue-guide"><b>Fila de trabalho</b><span><i class="guide-dot pending"></i><strong>Pendentes</strong> ainda não foram analisadas.</span><span><i class="guide-dot resubmitted"></i><strong>Reenviadas</strong> voltaram após um ajuste.</span></div><div class="tabs"><button data-q="pending" class="'+(state.queue==='pending'?'active':'')+'">Pendentes <b>'+pendingCount+'</b></button><button data-q="resubmitted" class="'+(state.queue==='resubmitted'?'active':'')+'">Reenviadas <b>'+resubmittedCount+'</b></button><button data-q="all" class="'+(state.queue==='all'?'active':'')+'">Todas <b>'+state.rows.length+'</b></button></div><div class="queue-list">'+(a.map(qcard).join('')||'<div class="empty">Nenhuma execução neste filtro.</div>')+'</div></aside><section class="viewer pane '+(state.mobile==='viewer'?'active':'')+'">'+viewer(x)+'</section><aside class="analysis pane '+(state.mobile==='analysis'?'active':'')+'">'+analysis(x)+'</aside></main>'+
  '<nav class="mobile-nav"><button data-tab="queue" class="'+(state.mobile==='queue'?'active':'')+'">1 · Fila</button><button data-tab="viewer" class="'+(state.mobile==='viewer'?'active':'')+'">2 · Execução</button><button data-tab="analysis" class="'+(state.mobile==='analysis'?'active':'')+'">3 · Contexto</button></nav></div>';
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
function openLicenseAddons(env,onSaved){
  const plan=env.plan||{};
  const r=modal('<header><div><small>LICENÇAS ADICIONAIS</small><h2>'+esc(env.workspace?.name||env.request?.company_name||'Ambiente')+'</h2><p class="modal-sub">Ajuste somente depois de confirmar comercialmente o adicional com o cliente.</p></div><button data-close>×</button></header><div class="modal-body"><div class="addon-grid"><label>Acessos de gestão extras<input id="extraManagement" type="number" min="0" max="500" value="'+(env.extra_management_seats||0)+'"><small>'+money(plan.extra_management_seat_cents||7900)+' por acesso/mês</small></label><label>Acessos CIA Campo extras<input id="extraField" type="number" min="0" max="5000" value="'+(env.extra_field_seats||0)+'" '+(!plan.field_enabled?'disabled':'')+'><small>'+(plan.field_enabled?money(plan.extra_field_seat_cents||1900)+' por acesso/mês':'Indisponível neste plano')+'</small></label><label>Blocos extras de 10 mil fotos<input id="extraPhotos" type="number" min="0" max="1000" value="'+(env.extra_photo_blocks||0)+'"><small>'+money(plan.extra_10000_photos_cents||14900)+' por bloco/mês</small></label></div><div id="addonTotal" class="addon-total"></div></div><footer><button data-close>Cancelar</button><button id="saveAddons" class="primary">Salvar licenças</button></footer>');
  const mg=r.querySelector('#extraManagement'),fd=r.querySelector('#extraField'),ph=r.querySelector('#extraPhotos'),total=r.querySelector('#addonTotal');
  const sync=()=>{const value=(Number(mg.value)||0)*(plan.extra_management_seat_cents||7900)+(Number(fd.value)||0)*(plan.extra_field_seat_cents||1900)+(Number(ph.value)||0)*(plan.extra_10000_photos_cents||14900);total.innerHTML='<span>Adicional mensal estimado</span><b>'+money(value)+'</b>'};sync();[mg,fd,ph].forEach(i=>i.oninput=sync);
  r.querySelector('#saveAddons').onclick=async()=>{const btn=r.querySelector('#saveAddons');btn.disabled=true;const {data,error}=await supabase.functions.invoke('environment-admin',{body:{action:'set_license_addons',target_workspace_id:env.workspace_id,extra_management_seats:Number(mg.value)||0,extra_field_seats:Number(fd.value)||0,extra_photo_blocks:Number(ph.value)||0}});if(error||data?.error){toast(data?.error||error.message,true);btn.disabled=false;return}r.remove();toast('Licenças adicionais atualizadas');onSaved?.()};
}
function commercialPage(){
  app.innerHTML='<div class="page-shell">'+appHeader('ambientes')+'<main class="page-main commercial-page"><div class="page-heading"><div><span>AMBIENTES</span><h1>Clientes e contratos</h1><p>Acompanhe os Ambientes criados pela landing, o plano contratado e as licenças concedidas.</p></div><button id="refreshCommercial" class="btn ghost">Atualizar</button></div><div id="commercialBody"><div class="loading-card">Carregando Ambientes...</div></div></main></div>';
  bindGlobalNav();
  const draw=async()=>{
    const body=document.getElementById('commercialBody');
    try{await loadCommercial()}catch(err){body.innerHTML='<div class="access-denied"><b>Não foi possível carregar</b><span>'+esc(err.message)+'</span></div>';return}
    const rows=state.commercial;
    const mrr=rows.filter(x=>x.status==='active').reduce((sum,x)=>sum+(x.billing_interval==='annual'?Math.round((x.contracted_price_cents||0)/12):(x.contracted_price_cents||0))+(x.extra_management_seats||0)*(x.plan?.extra_management_seat_cents||0)+(x.extra_field_seats||0)*(x.plan?.extra_field_seat_cents||0)+(x.extra_photo_blocks||0)*(x.plan?.extra_10000_photos_cents||0),0);
    body.innerHTML='<section class="commercial-summary"><article><span>Ambientes</span><b>'+rows.length+'</b></article><article><span>Em avaliação</span><b>'+rows.filter(x=>x.status==='trialing').length+'</b></article><article><span>Ativos</span><b>'+rows.filter(x=>x.status==='active').length+'</b></article><article><span>MRR contratado</span><b class="money-kpi">'+money(mrr)+'</b></article></section><section class="commercial-list">'+(rows.map(x=>'<article class="commercial-row"><div class="commercial-company"><span class="status-chip '+x.status+'">'+statusCommercial(x.status)+'</span><h3>'+esc(x.workspace?.name||x.request?.company_name||'Ambiente')+'</h3><p>'+esc(x.request?.company_name||'')+'</p></div><div><small>PLANO</small><b>'+esc(x.plan?.name||x.plan_code)+'</b><span>'+money(x.contracted_price_cents||0)+' · '+(x.billing_interval==='annual'?'anual':'mensal')+'</span></div><div><small>LICENÇAS</small><b>'+((x.licensed_management_seats||x.plan?.management_seats||0)+(x.extra_management_seats||0))+' gestão · '+((x.licensed_field_seats||x.plan?.field_seats||0)+(x.extra_field_seats||0))+' campo</b><span>'+new Intl.NumberFormat('pt-BR').format((x.photo_limit_monthly||x.plan?.photo_limit_monthly||0)+(x.extra_photo_blocks||0)*10000)+' fotos/mês</span></div><div><small>ADMIN</small><b>'+esc(x.request?.admin_name||'—')+'</b><span>'+esc(x.request?.admin_email||'—')+'</span></div><div class="commercial-actions"><button data-license="'+x.workspace_id+'" class="btn ghost">Licenças</button>'+(x.status!=='active'?'<button data-sub-action="active" data-ws="'+x.workspace_id+'" class="btn primary">Ativar</button>':'')+(x.status!=='suspended'?'<button data-sub-action="suspended" data-ws="'+x.workspace_id+'" class="btn ghost">Suspender</button>':'')+(x.status==='suspended'?'<button data-sub-action="trialing" data-ws="'+x.workspace_id+'" class="btn ghost">Reabrir</button>':'')+'</div></article>').join('')||'<div class="empty">Nenhum Ambiente comercial criado pela landing ainda.</div>')+'</section>';
    body.querySelectorAll('[data-sub-action]').forEach(b=>b.onclick=async()=>{b.disabled=true;const {data,error}=await supabase.functions.invoke('environment-admin',{body:{action:'set_subscription_status',target_workspace_id:b.dataset.ws,status:b.dataset.subAction}});if(error||data?.error){toast(data?.error||error.message,true);b.disabled=false;return}toast('Status comercial atualizado');draw()});
    body.querySelectorAll('[data-license]').forEach(b=>b.onclick=()=>{const env=rows.find(x=>x.workspace_id===b.dataset.license);if(env)openLicenseAddons(env,draw)});
  };
  document.getElementById('refreshCommercial').onclick=draw;draw();
}
function statusCommercial(v){return ({trialing:'Em avaliação',active:'Ativo',suspended:'Suspenso',cancelled:'Cancelado',past_due:'Pagamento pendente',pending_activation:'Aguardando ativação'})[v]||v}
function reports(){
  const analyzed=analyzedRows(),problems=problemRows(),approvedCount=analyzed.filter(x=>x.status==='approved').length;
  const approval=analyzed.length?Math.round(approvedCount/analyzed.length*100):0;
  const regions=aggregateBy('region'),networks=aggregateBy('network'),stores=aggregateBy('store'),tasks=aggregateBy('task'),reasons=reasonBreakdown();
  const topRegion=regions[0],topNetwork=networks[0],topReason=reasons[0],topStore=stores[0];
  const issueRate=analyzed.length?Math.round(problems.length/analyzed.length*100):0;
  const reportCtx=operationContext();
  const priorityText=topRegion
    ? esc(topRegion.label)+' concentra a maior taxa de desvio, com '+topRegion.rate+'% das execuções analisadas exigindo atenção.'
    : 'Analise mais execuções para o CIA apontar onde a operação precisa agir primeiro.';
  app.innerHTML='<div class="page-shell report-shell">'+appHeader('relatorios')+
  '<main class="page-main reports-page editorial-reports">'+
    '<section class="report-masthead"><div class="report-ghost" aria-hidden="true">RESULTADO</div><div class="report-masthead-copy"><span>RELATÓRIOS · '+esc(reportCtx.period).toUpperCase()+'</span><h1>Onde a execução <em>precisa de atenção?</em></h1><p>O CIA transforma cada decisão tomada sobre as fotos em uma leitura gerencial: onde o padrão falha, por que falha e qual frente merece prioridade.</p></div><div class="report-masthead-meta"><small>BASE ANALISADA</small><b>'+analyzed.length+'</b><span>execuções concluídas</span></div></section>'+
    '<section class="report-kpis editorial-kpis">'+
      '<article><span>Aprovação</span><b>'+approval+'%</b><small>'+approvedCount+' execuções validadas</small></article>'+
      '<article><span>Com problema</span><b>'+problems.length+'</b><small>'+issueRate+'% da base analisada</small></article>'+
      '<article><span>Região mais crítica</span><b class="text-kpi">'+esc(topRegion?.label||'Sem dados')+'</b><small>'+(topRegion?topRegion.rate+'% com problema':'—')+'</small></article>'+
      '<article><span>Principal causa</span><b class="text-kpi">'+esc(topReason?.label||'Sem dados')+'</b><small>'+(topReason?.value||0)+' ocorrência'+((topReason?.value||0)===1?'':'s')+'</small></article>'+
    '</section>'+
    '<section class="report-story-grid">'+
      '<article class="editorial-insight">'+
        '<div class="insight-index">01</div><div class="insight-copy"><span>PRIORIDADE DO MOMENTO</span><h2>'+priorityText+'</h2><p>'+(topReason?'A causa mais recorrente é <b>'+esc(topReason.label)+'</b>. Use essa combinação para orientar cobrança, treinamento e acompanhamento de campo.':'Assim que houver desvios classificados, o CIA cruza região e causa para sugerir a prioridade.')+'</p></div>'+
        '<div class="insight-number"><b>'+(topRegion?topRegion.issues:0)+'</b><span>problemas</span></div>'+
      '</article>'+
      '<article class="editorial-rank"><header><span>02 · CAUSAS</span><h3>O que mais tira a execução do padrão</h3></header><ol>'+((reasons.slice(0,5).map((r,i)=>'<li><span>0'+(i+1)+'</span><b>'+esc(r.label)+'</b><strong>'+r.value+'</strong></li>').join(''))||'<li class="no-data">Sem problemas classificados.</li>')+'</ol></article>'+
    '</section>'+
    '<section class="report-analysis-grid">'+
      '<article class="analysis-panel region-panel"><header><div><span>03 · TERRITÓRIO</span><h3>Problema por região</h3><p>Taxa de execuções com ajuste ou reprovação.</p></div><strong>'+esc(topRegion?.label||'—')+'</strong></header><div class="dash-bars">'+barRows(regions)+'</div></article>'+
      '<article class="analysis-panel network-panel"><header><div><span>04 · REDE</span><h3>Onde o padrão oscila mais</h3><p>Leitura proporcional por rede.</p></div><strong>'+esc(topNetwork?.label||'—')+'</strong></header><div class="dash-bars compact">'+barRows(networks,6)+'</div></article>'+
    '</section>'+
    '<section class="report-analysis-grid lower">'+
      '<article class="analysis-panel stores-panel"><header><div><span>05 · LOJAS CRÍTICAS</span><h3>PDVs que merecem ação primeiro</h3><p>Ranking por taxa de problema.</p></div><strong>'+esc(topStore?.label||'—')+'</strong></header><div class="hotspot-table"><div class="table-head"><span>Loja</span><span>Análises</span><span>Problemas</span><span>Taxa</span></div>'+stores.slice(0,8).map(x=>'<div class="table-row"><b>'+esc(x.label)+'</b><span>'+x.total+'</span><span>'+x.issues+'</span><strong class="'+riskTone(x.rate)+'">'+x.rate+'%</strong></div>').join('')+'</div></article>'+
      '<article class="analysis-panel task-panel"><header><div><span>06 · TAREFAS</span><h3>Tipos de execução com mais falhas</h3><p>Ajuda a identificar necessidade de instrução ou padrão melhor definido.</p></div></header><div class="dash-bars compact">'+barRows(tasks,6)+'</div></article>'+
    '</section>'+
    '<section class="report-closing"><div><span>LEITURA GERENCIAL</span><h2>O relatório não termina no gráfico. Ele precisa dizer onde agir.</h2></div><p>Use os rankings para decidir se o próximo movimento é <b>cobrança de execução</b>, <b>treinamento</b>, <b>revisão de material</b> ou <b>acompanhamento de uma loja específica</b>.</p></section>'+
  '</main></div>';
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
  const canAdmin=canMaster(),isOwner=canManageEnvironments(),imports=state.imports||[],masters=state.masterImports||[],users=state.users||[],sub=state.subscription;
  const managementUsed=users.filter(u=>['admin','bko','supervisor'].includes(u.role)).length,fieldUsed=users.filter(u=>u.role==='promoter').length;
  const managementLimit=(sub?.licensed_management_seats??sub?.plan?.management_seats??0)+(sub?.extra_management_seats||0),fieldLimit=(sub?.licensed_field_seats??sub?.plan?.field_seats??0)+(sub?.extra_field_seats||0),photoUsed=state.usage?.photos_count||0,photoLimit=(sub?.photo_limit_monthly??sub?.plan?.photo_limit_monthly??0)+((sub?.extra_photo_blocks||0)*10000);
  const peopleCounts={promoters:state.people.filter(p=>p.person_role==='promoter').length,supervisors:state.people.filter(p=>p.person_role==='supervisor').length,stores:new Set(state.assignments.map(a=>a.store_id)).size};
  const fieldOn=!!state.services?.field_enabled,bkoOn=!!state.services?.bko_enabled;
  const sourceSummary=fieldOn&&bkoOn?'Fotos automáticas do CIA Campo + CSV disponível como alternativa':fieldOn?'Fotos automáticas pelo CIA Campo':'CSV é o canal de entrada das fotos';
  app.innerHTML='<div class="page-shell">'+appHeader('configuracoes')+'<main class="page-main settings-page"><div class="page-heading"><div><span>CONFIGURAÇÕES</span><h1>'+esc(state.workspace?.name||'Ambiente')+'</h1><p>Serviços, cadastros e acessos deste Ambiente. A rotina de análise continua separada destas configurações.</p></div><div class="environment-status"><span class="'+(bkoOn?'on':'off')+'">BKO '+(bkoOn?'ativo':'inativo')+'</span><span class="'+(fieldOn?'on':'off')+'">CIA Campo '+(fieldOn?'ativo':'inativo')+'</span></div></div>'+
  '<section class="settings-layout"><div class="settings-stack">'+
  '<article class="settings-card service-overview"><header><span>SERVIÇOS CONTRATADOS</span><h2>Como este Ambiente recebe e analisa a execução</h2><p>Não existe escolha entre Campo e CSV. A disponibilidade é definida pelos serviços contratados.</p></header><div class="contracted-services"><div class="'+(bkoOn?'active':'inactive')+'"><span>BKO</span><b>'+(bkoOn?'Contratado':'Não contratado')+'</b><small>Análise remota, relatórios e importação CSV.</small></div><div class="'+(fieldOn?'active':'inactive')+'"><span>CIA CAMPO</span><b>'+(fieldOn?'Contratado':'Não contratado')+'</b><small>Check-in, tarefas e fotos feitas no PDV.</small></div></div><div class="flow-summary"><span>FLUXO DE FOTOS</span><b>'+sourceSummary+'</b><p>'+(fieldOn?'Quando a operação usa CIA Campo, as fotos entram automaticamente. O CSV continua disponível para contingência, legado ou complemento.':'Como este Ambiente não possui CIA Campo, a importação por CSV fica disponível no BKO como canal operacional.')+'</p></div>'+(isOwner?'<button id="editServices" class="btn ghost">Editar serviços contratados</button>':'')+'</article>'+
  (sub?'<article class="settings-card license-card"><header><span>PLANO E USO</span><h2>'+esc(sub.plan?.name||sub.plan_code)+'</h2><p>'+((sub.billing_interval==='annual')?'Contrato anual':'Contrato mensal')+' · '+esc(statusCommercial(sub.status))+'</p></header><div class="license-grid"><div><span>Acessos de gestão</span><b>'+managementUsed+' / '+managementLimit+'</b><i><em style="width:'+Math.min(100,managementLimit?managementUsed/managementLimit*100:0)+'%"></em></i></div><div><span>Acessos de campo</span><b>'+fieldUsed+' / '+fieldLimit+'</b><i><em style="width:'+Math.min(100,fieldLimit?fieldUsed/fieldLimit*100:0)+'%"></em></i></div><div><span>Fotos neste mês</span><b>'+new Intl.NumberFormat('pt-BR').format(photoUsed)+' / '+new Intl.NumberFormat('pt-BR').format(photoLimit)+'</b><i><em style="width:'+Math.min(100,photoLimit?photoUsed/photoLimit*100:0)+'%"></em></i></div></div><small class="license-note">Acessos são pessoais e intransferíveis. Uma conta mantém somente uma sessão ativa por vez.</small></article>':'')+
  
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
  document.getElementById('logoutBtn').onclick=logoutUser;
}
function field(){
  const stores=[['Vivo Shopping Ibirapuera','Vivo',4,2],['Fast Shop Morumbi','Fast Shop',5,0],['Claro Center Norte','Claro',3,0]];
  app.innerHTML='<div class="field human-field"><header><div class="field-brand"><span>C</span><div><b>CIA Campo</b><small>Execução</small></div></div><i>'+initials(state.membership?.display_name||'P')+'</i></header><section class="field-hero"><div class="field-hero-word" aria-hidden="true">HOJE</div><small>TERÇA · 20 OUT</small><h1>Bom dia,<br><em>João.</em></h1><p>Sua rota tem 3 lojas e 12 fotos previstas. Faça o check-in, siga as tarefas e registre o que realmente aconteceu no PDV.</p></section><section class="field-stats"><div><span>LOJAS</span><b>3</b></div><div><span>FOTOS</span><b>12</b></div><div><span>CONCLUÍDAS</span><b>2</b></div></section><main><div class="route-title"><div><small>01 · ROTA</small><h2>Onde você vai hoje</h2></div><span>São Paulo</span></div>'+stores.map((s,i)=>'<article class="store '+(i===0?'current':'')+'"><strong>0'+(i+1)+'</strong><div><small>'+s[1]+'</small><h3>'+s[0]+'</h3><p>'+(i?3+i:'0,2')+' km · '+s[3]+'/'+s[2]+' tarefas concluídas</p><div class="bar"><i style="width:'+Math.round(s[3]/s[2]*100)+'%"></i></div></div><button data-store="'+i+'">'+(i===0?'Continuar →':'Abrir')+'</button></article>').join('')+'</main><button id="cameraFab" class="camera-fab"><span>＋</span> Nova foto de execução</button></div>';
  document.querySelectorAll('[data-store],#cameraFab').forEach(b=>b.onclick=openVisit)
}
function openVisit(){let checked=false;const r=modal('<header><div><small>VIVO · SHOPPING IBIRAPUERA</small><h2>Visita em campo</h2></div><button data-close>×</button></header><div class="modal-body"><div class="checkin"><div><b>Check-in</b><span>Registre sua chegada à loja.</span></div><button id="checkin" class="primary">Fazer check-in</button></div><div class="tasks">'+['Fachada da loja','Exposição Echo','Precificação','Material promocional'].map((t,i)=>'<article><strong>'+(i+1)+'</strong><div><b>'+t+'</b><small>'+(i===1?'3 fotos':'1 foto')+' obrigatória'+(i===1?'s':'')+'</small></div><button data-photo>Fotografar</button></article>').join('')+'</div><button id="checkout" class="checkout" disabled>Finalizar visita · Check-out</button></div>');r.querySelector('#checkin').onclick=e=>{checked=true;e.target.disabled=true;e.target.textContent='Check-in realizado';r.querySelector('#checkout').disabled=false;toast('Check-in registrado')};r.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{if(!checked){toast('Faça o check-in primeiro',true);return}const i=document.createElement('input');i.type='file';i.accept='image/*';i.capture='environment';i.onchange=()=>{if(i.files?.[0]){b.textContent='Foto adicionada ✓';b.closest('article').classList.add('done');toast('Foto de execução adicionada')}};i.click()});r.querySelector('#checkout').onclick=()=>{toast('Visita finalizada');r.remove()}}
function accessDenied(title,message){
  app.innerHTML='<div class="page-shell">'+appHeader('')+'<main class="page-main"><div class="access-denied"><b>'+esc(title)+'</b><span>'+esc(message)+'</span><button data-route="perfil" class="btn ghost">Ver meu perfil</button></div></main></div>';bindGlobalNav();
}
function render(){
  document.body.classList.remove('public-mode');
  document.querySelector('.back-to-top')?.remove();
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
  if(!state.membership&&['produto','como-funciona','demonstracao','para-quem','servicos'].includes(publicAnchor))return;
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