# CIA Console — Security Report
**Data:** 2026-03-04  
**Revisado por:** GitHub Copilot (Senior Security Engineer + Full-Stack Maintainer)  
**Repo:** cia-console-online (GitHub Pages / app.usecia.com)  
**Branch:** main (mudanças aplicadas diretamente)

---

## 1. Inventário do Repositório

| Arquivo | Papel |
|---|---|
| `index.html` | Entry point HTML da aplicação. Shell da UI: sidebar, iframes, overlay de login. |
| `src/main.js` | Módulo JavaScript principal: navegação, uploads, auth gate, CIA_CLOUD adapter (Supabase), admin panel, injeção de módulos B64. |
| `src/lib/supabaseClient.js` | Singleton do cliente Supabase. Lê apenas de env vars `VITE_SUPABASE_*`. |
| `src/modules/hc.js` | Módulo Headcount (People) — CRUD de pessoas via Supabase. Corre em srcdoc iframe. |
| `src/modules/pdvs.js` | Módulo PDVs — CRUD de pontos de venda via Supabase. Corre em srcdoc iframe. |
| `src/modules/products.js` | Módulo Produtos — CRUD de produtos via Supabase. Corre em srcdoc iframe. |
| `src/styles/app.css` | Todos os estilos CSS de componentes (sem código JS). |
| `src/styles/tokens.css` | Tokens de design (cores, fontes CIA). |
| `src/migrations/001_hc_pdv_products.sql` | Migration SQL para tabelas HC/PDVs/Produtos no Supabase. |
| `vite.config.js` | Configuração Vite. Expõe só vars `VITE_*`. |
| `package.json` | Dependências: `@supabase/supabase-js ^2.49.1`, `vite ^5.4.0`. |
| `public/CNAME` | Domínio custom GitHub Pages: `app.usecia.com`. |
| `legacy/index_legacy.html` | Snapshot monolítico legado (referência). NÃO é deployado. |
| `.env.example` | Template de variáveis de ambiente. Sem valores reais. |
| `SUPABASE_BACKEND_SETUP.md` | Guia de provisionamento do backend Supabase. |
| `README.md` | Documentação do projeto (alinhada com a stack atual). |
| `docs/SECURITY_REPORT.md` | **Este documento.** |

---

## 2. Evidências das Buscas de Segurança

### 2.1 Pré-fix — Ocorrências encontradas

| Termo buscado | Arquivo | Linha | Status pré-fix |
|---|---|---|---|
| `ALLOWED_USER` | `src/main.js` | 4183 | **CRÍTICO — credencial hardcoded** |
| `ALLOWED_PASS` | `src/main.js` | 4184 | **CRÍTICO — senha hardcoded** |
| `luiswagnercosta@icloud.com` | `src/main.js` | 4183 | **CRÍTICO — PII hardcoded** |
| `375510` | `src/main.js` | 4184 | **CRÍTICO — senha em plaintext** |
| `auth.signUp(` | `src/main.js` | 5014 | **CRÍTICO — auto-signUp em fallback** |
| `is_master: true` no bootstrap | `src/main.js` | ~4424 | **CRÍTICO — escalada de privilégio** |
| `is_platform_admin: true` no bootstrap | `src/main.js` | ~4425 | **CRÍTICO — escalada de privilégio** |
| `postMessage(..., "*")` (5 instâncias) | `src/main.js` | 147, 2356, 2373, 2813, 4700 | ALTO |
| Listener sem `ev.origin` em host | `src/main.js` | 2360, 4119, 4829 | ALTO |
| Listener sem `ev.origin` em módulos | `hc.js`, `pdvs.js`, `products.js` | 163, 210, 157 | ALTO |
| Frame-buster ausente | `index.html` | N/A | ALTO |
| `frame-ancestors` ausente | `index.html` | N/A | ALTO |
| `service_role` no client | Nenhum arquivo `.js` | N/A | ✅ Não encontrado |

### 2.2 Pós-fix — Busca de confirmação

```
ALLOWED_USER → False (não encontrado) ✅
ALLOWED_PASS → False (não encontrado) ✅
auth.signUp   → False (não encontrado) ✅
service_role  → Apenas em comentários de documentação ✅
icloud.com / emails hardcoded → False ✅
is_master: true no bootstrap  → Removido, fallback usa role: "viewer" ✅
_ciaIsTrustedSource em listeners → True ✅
window.parent check em módulos → True ✅
frame-buster → Presente no index.html ✅
CSP meta frame-ancestors → Presente ✅
```

---

## 3. Vulnerabilidades e Correções por Severidade

### 🔴 CRÍTICO

#### C1 — Credenciais hardcoded no client
- **Arquivo:** `src/main.js`, linhas 4183–4184 (pré-fix)
- **Descrição:** `ALLOWED_USER = "luiswagnercosta@icloud.com"` e `ALLOWED_PASS = "375510"` permitiam login local sem Supabase.
- **Risco:** Qualquer pessoa com acesso ao bundle (build público do GitHub Pages) conseguia logar sem conta.
- **Correção:** Declarações e todos os 2 usos removidos. Auth 100% via Supabase.

#### C2 — Auto-signUp automático como fallback
- **Arquivo:** `src/main.js`, linhas 5014–5044 (pré-fix)
- **Descrição:** Se `signInWithPassword` falhasse, o código chamava `c.auth.signUp()`. Qualquer email/senha resultava em criação de conta.
- **Risco:** Registro público não-controlado.
- **Correção:** Bloco inteiro (94 linhas) removido. Único fluxo restante: `signInWithPassword` → erro claro se falhar.

#### C3 — Auto-bootstrap de profile com `is_master: true`
- **Arquivo:** `src/main.js`, `loadContext()`, linhas ~4424–4438 (pré-fix)
- **Descrição:** Novo usuário sem profile recebia `is_master: true, is_platform_admin: true` automaticamente.
- **Risco:** Qualquer usuário que conseguisse criar conta seria automaticamente promovido a master.
- **Correção:** Bootstrap cria profile sem flags de acesso elevado. Fallback usa `role: "viewer"`. Promoção a master deve ser feita manualmente no Supabase Dashboard.

---

### 🔴 ALTO

#### A1 — Listeners de postMessage sem validação de origem
- **Arquivo:** `src/main.js` (3 listeners), `hc.js`, `pdvs.js`, `products.js` (1 listener cada)
- **Descrição:** Nenhum listener verificava `ev.origin` ou `ev.source`. Qualquer página (incluindo maliciosa) podia enviar mensagens e acionar ações como `clearPageScope`, `sendMessage` ao banco, etc.
- **Correção:**
  - Adicionado helper `_ciaIsTrustedSource(ev)` em `main.js` que valida: `ev.source === window`, ou `ev.source` é um iframe registrado, ou `ev.origin` está na allowlist (`app.usecia.com`, `localhost:5173/4173`).
  - Todos os 3 listeners do host agora chamam `if(!_ciaIsTrustedSource(ev)) return;` como primeira linha.
  - Módulos (`hc.js`, `pdvs.js`, `products.js`) agora verificam `ev.source !== window.parent`.
  - Listener injected em srcdoc (fotos bridge) verifica `ev.source !== window.parent`.

#### A2 — `postMessage(..., "*")` como targetOrigin
- **Arquivo:** `src/main.js`
- **Descrição:** Todas as chamadas `postMessage` usavam `"*"` como targetOrigin.
- **Justificativa para manter `"*"` em 5 casos restantes:** Os iframes são `srcdoc` e têm origin `"null"` — não é possível usar a origin deles como `targetOrigin`. O conteúdo enviado (workspace UUID, metadata de arquivo) não é secret. A validação de `ev.source` nos listeners é o controle correto.
- **Correção aplicada:** `"*"` mantido onde necessário (srcdoc), mas todos os listeners validam `ev.source`.

#### A3 — Clickjacking / Embedding por terceiros
- **Arquivo:** `index.html`
- **Descrição:** App podia ser embarcado em iframe de terceiro (UI jacking).
- **Correção:**
  - `<meta http-equiv="Content-Security-Policy" content="frame-ancestors 'none'" />` adicionado.
  - Frame-buster script no `<head>` (roda antes do body): if `window.top !== window.self`, bloqueia toda a UI e mostra aviso seguro. Proteção contra `document.domain` bypass.
  - **Nota:** Para proteção completa em produção, adicionar `X-Frame-Options: DENY` e `Content-Security-Policy: frame-ancestors 'none'` como header HTTP no CDN/proxy (GitHub Pages não suporta headers customizados — use Cloudflare ou similar na frente).

---

### 🟡 MÉDIO

#### M1 — Telas de cadastro (HC/PDVs/Produtos) não apareciam após login
*Ver Seção 5 — Causa Raiz do Bug.*

#### M2 — Nenhuma UI de cadastro visível
- **Descrição:** O overlay de login não tinha nenhum indicativo de como criar conta.
- **Correção:** Adicionado bloco "Novo usuário?" com botão "Criar conta" **visível** e **desabilitado** + mensagem "Cadastro apenas por convite do administrador." Ao clicar exibe mensagem no `#loginError`.

---

### 🟢 BAIXO

#### B1 — Re-export desnecessário de `SUPABASE_ANON_KEY` e `SUPABASE_URL`
- **Arquivo:** `src/lib/supabaseClient.js`
- **Descrição:** `export { SUPABASE_URL, SUPABASE_ANON_KEY }` expunha os valores como named exports. Nenhum módulo os importava.
- **Nota:** `SUPABASE_ANON_KEY` é uma chave **pública por design** do Supabase (segurança via Row Level Security, não pela chave). Não é secret.
- **Correção:** Export removido. Adicionado comentário documentando que a anon key é pública por design.

#### B2 — Google Fonts via CDN externo
- **Arquivo:** `index.html`, `src/modules/*.js`
- **Descrição:** Fontes carregadas de `fonts.googleapis.com`.
- **Risco:** Baixo (privacidade do usuário; indisponibilidade de CDN degradaria tipografia).
- **Decisão:** Mantido na fase atual para evitar refactor amplo. Recomendação futura: self-host via `/public/fonts`.

---

## 4. Mudanças por Arquivo

### `src/main.js`
- Removido: `ALLOWED_USER = "luiswagnercosta@icloud.com"`
- Removido: `ALLOWED_PASS = "375510"`
- Removido: bloco completo de "Master local auth" (~94 linhas incluindo auto-signUp fallback)
- Removido: `if(__CIA_IS_FILE__)` fallback
- Adicionado: helper `_ciaIsTrustedSource(ev)` com allowlist de origins
- Adicionado: `if(!_ciaIsTrustedSource(ev)) return;` nos 3 listeners do host
- Adicionado: `if(!ev || ev.source !== window.parent) return;` no listener injected (fotos)
- Alterado: `loadContext()` bootstrap — sem `is_master: true` / `is_platform_admin: true`
- Alterado: `loadContext()` fallback — `role: "viewer"`, sem promoção automática
- Adicionado: `afterLogin()` agora faz broadcast de `CIA_ACTIVE_WORKSPACE` para todos os iframes (fix bug cadastro)

### `src/lib/supabaseClient.js`
- Removido: `export { SUPABASE_URL, SUPABASE_ANON_KEY }` (export desnecessário)
- Adicionado: comentário documentando que anon key é pública por design

### `src/modules/hc.js`
- Alterado: listener `message` agora verifica `ev.source !== window.parent`

### `src/modules/pdvs.js`
- Alterado: listener `message` agora verifica `ev.source !== window.parent`

### `src/modules/products.js`
- Alterado: listener `message` agora verifica `ev.source !== window.parent`

### `index.html`
- Adicionado: `<meta http-equiv="Content-Security-Policy" content="frame-ancestors 'none'" />`
- Adicionado: frame-buster script no `<head>` (bloqueia iframe de terceiros)
- Adicionado: seção "Novo usuário?" com botão de cadastro invite-only explicitamente desabilitado

### `docs/SECURITY_REPORT.md`
- Criado: este documento.

---

## 5. Causa Raiz do Bug — Telas de Cadastro (HC/PDVs/Produtos) não apareciam

### Investigação

1. **A rota/estado existe?** ✅ Sim. Botões `navHc`, `navPdvs`, `navProducts` presentes no sidebar e mapeados em `setScreen()`. `applyAccessControlUI()` os exibe sempre (`show("navHc", true)`).

2. **Feature flag esconde?** ❌ Não. Todos os três são `show(..., true)` incondicionalmente.

3. **DOM existe mas invisível?** ❌ Não. CSS `.frame-wrap iframe:not(.is-active) { height: 0 }` oculta apenas visualmente; o DOM carrega normalmente.

4. **Link aponta para o lugar certo?** ✅ `setScreen('hc')` chama `ensureLoaded('hc')` que chama `setFrameDoc('hc')` que chama `initHc(fr)`.

5. **Erro JS impede mount?** ✅ **Este era o problema.**

### Causa Raiz

```
Sequência de execução no carregamento inicial da página (usuário NÃO autenticado):

1. Section 1 IIFE → frames definidos → __ciaSafeBootFrames queued (setTimeout 0)
2. Section 2 IIFE → CIA_CLOUD inicializado → boot() chamado
3. boot(): user NÃO autenticado → CIA_CLOUD.client() chamado (window.CIA_SUPABASE = sb) → showLogin()
4. setTimeout fires → __ciaSafeBootFrames → initHc(fr) / initPdvs(fr) / initProducts(fr)
5. Iframes carregam: const supabase = parent.window.CIA_SUPABASE; → ok
6. init() executa: const { data: { user } } = await supabase.auth.getUser(); → user = null
7. if(!user) return; → módulo encerra SEM dados. Tabela fica em "Carregando..."

Quando usuário loga:
8. boot(): form submit → signInWithPassword → ok → setAuthed() → hideLogin()
9. afterLogin() chamado → loadContext() → workspaceActive definido → setScreen('dash')
10. OS IFRAMES JÁ ESTÃO CARREGADOS (step 4) com init() já completado (e falhado silenciosamente)
11. Nenhum sinal é enviado aos iframes para que re-carreguem dados
12. Usuário clica em "HC" → vê iframe ativo MAS com conteúdo da 1a carga (vazio)
```

### Correção Aplicada

Em `afterLogin()` (após `loadContext()` e `setScreen('dash')`), adicionado broadcast de `CIA_ACTIVE_WORKSPACE` para todos os iframes:

```javascript
// Diff aplicado em src/main.js — função afterLogin():
+ try{
+   const wsId = workspaceActive;
+   if(wsId){
+     document.querySelectorAll("iframe").forEach(function(fr){
+       try{ if(fr.contentWindow) fr.contentWindow.postMessage(
+         { type:"CIA_ACTIVE_WORKSPACE", workspace_id: wsId }, "*"
+       ); }catch(_e){}
+     });
+   }
+ }catch(_e){}
```

Os módulos já têm um listener para `CIA_ACTIVE_WORKSPACE` que chama `loadPeople()` / `loadPdvs()` / `loadProducts()`. Recebendo esse sinal pós-login, eles re-inicializam com o `workspace_id` correto.

---

## 6. Checklist de Validação

### Local
- [ ] `npm install && npm run dev`
- [ ] Login com credenciais válidas → app carrega, tela de Mapa aparece
- [ ] Login com credenciais inválidas → mensagem de erro limpa, sem stack trace
- [ ] Logout → overlay de login reaparece
- [ ] Clicar "Criar conta" → mensagem "apenas por convite" aparece, nenhum account é criado
- [ ] Navegar para HC, PDVs, Produtos → dados carregam (não fica em "Carregando...")
- [ ] Abrir `index.html` dentro de outro HTML com `<iframe src="...">` → UI bloqueada com aviso de segurança
- [ ] Subir upload → progresso visível, sem erro de permissão

### Produção (app.usecia.com)
- [ ] Build: `npm run build` sem erros
- [ ] Deploy: GitHub Pages publica `dist/`
- [ ] Login funcional com credenciais Supabase válidas
- [ ] Verificar DevTools: nenhum `ALLOWED_USER`, `ALLOWED_PASS` no bundle minificado
- [ ] Verificar DevTools: `window.ALLOWED_USER` → `undefined`
- [ ] Verificar frame no incógnito: `x-frame-options` ou CSP meta bloqueia embedding

---

## 7. O que é Público por Design

| Item | Status | Observação |
|---|---|---|
| `VITE_SUPABASE_ANON_KEY` | **Público por design** | Chave anon do Supabase é projetada para ser pública. Segurança via Row Level Security (RLS). |
| `VITE_SUPABASE_URL` | **Público por design** | URL do projeto Supabase. |
| `VITE_SUPABASE_BUCKET` | **Público** | Nome do bucket de storage. |

---

## 8. O que Foi Removido

| Removido | Motivo |
|---|---|
| `ALLOWED_USER = "luiswagnercosta@icloud.com"` | Credencial hardcoded — invasão direta |
| `ALLOWED_PASS = "375510"` | Senha hardcoded — invasão direta |
| `c.auth.signUp(email, password)` auto-fallback | Cadastro público não controlado |
| `is_master: true` no auto-bootstrap de profile | Escalada automática de privilégio |
| `export { SUPABASE_URL, SUPABASE_ANON_KEY }` | Export desnecessário (nenhum import externo) |

---

## 9. Pendências Fora do Código (Infraestrutura)

> Estas ações requerem acesso ao Supabase Dashboard ou ao CDN/DNS do app.usecia.com.

1. **RLS ativo e correto em todas as tabelas:**
   - Verificar: `profiles`, `org_users`, `workspace_users`, `organizations`, `workspaces`, `people`, `pdvs`, `products`, `assignments`, `observations`, `file_uploads`, `weeks`, `messages`.
   - Garantir que políticas RLS impedem usuário de ler/escrever dados de outro workspace.

2. **Desabilitar Auto-Confirm no Supabase Auth (se ainda habilitado):**
   - Supabase Dashboard → Authentication → Providers → Email → desabilitar "Confirm email" apenas se o fluxo de convite funcionar sem ele.
   - **Ou:** Usar a Edge Function `cia-admin` para criar usuários server-side.

3. **Bootstrap manual do primeiro usuário master:**
   - Com o auto-grant de `is_master` removido, o primeiro admin deve ser promovido via Supabase Dashboard:
   ```sql
   UPDATE profiles SET is_master = true WHERE email = 'seu-email@dominio.com';
   ```

4. **Header HTTP X-Frame-Options no CDN:**
   - GitHub Pages não suporta headers customizados.
   - Se houver Cloudflare na frente: adicionar regra de transformação de resposta:
     - `X-Frame-Options: DENY`
     - `Content-Security-Policy: frame-ancestors 'none'`

5. **Tornar o repositório privado (recomendado):**
   - Via GitHub UI: Settings → Change repository visibility → Private
   - Via gh CLI:
   ```bash
   gh repo edit luiswagnercosta/cia-console-online --visibility private
   ```
   - ⚠️ GitHub Pages gratuito requer repo público. Com repo privado: usar GitHub Pages em plano pago (Team/Enterprise) ou migrar para Vercel/Netlify com variáveis de ambiente.

6. **Rotacionar a `VITE_SUPABASE_ANON_KEY` se suspeitar de vazamento:**
   - Supabase Dashboard → Settings → API → Regenerate anon key.
   - Atualizar `.env.local` (dev) e secrets do GitHub Actions (CI/CD).

7. **Storage bucket policies:**
   - Verificar que o bucket `cia-files` tem policy RLS ligada a `workspace_id`.
   - Usuários não devem conseguir listar/baixar arquivos de outros workspaces.

---

## 10. Checklist de Aceite Final

- [x] Busca global: `ALLOWED_USER` → não encontrado  
- [x] Busca global: `ALLOWED_PASS` → não encontrado  
- [x] Busca global: `auth.signUp` → não encontrado  
- [x] Busca global: `is_master: true` no bootstrap → removido  
- [x] Cadastro visível (invite-only explícito + botão desabilitado com mensagem)
- [x] postMessage listeners validam origin (`_ciaIsTrustedSource`) ou `ev.source === window.parent`
- [x] Proteção anti-iframe: frame-buster + CSP meta `frame-ancestors 'none'`
- [x] Telas de cadastro (HC/PDVs/Produtos): corrigidas via broadcast `CIA_ACTIVE_WORKSPACE` em `afterLogin()`
- [x] README alinhado com a stack atual (Supabase only, sem Cloudflare/D1/R2)
- [ ] Headers HTTP no CDN (`X-Frame-Options`, CSP) — **requer ação manual na infra**
- [ ] RLS auditado no Supabase Dashboard — **requer ação manual**
- [ ] Primeiro usuário master promovido via SQL — **requer ação manual**
- [ ] Repositório privado — **requer ação manual (ver Seção 9)**
