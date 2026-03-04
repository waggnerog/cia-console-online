# ADMIN_VISIBILITY_REPORT — Tela Admin (Master)

**Data:** 2026-03-04  
**Arquivo principal afetado:** `src/main.js`  
**Commits:** `fix(admin): enable admin nav and routing`, `fix(admin): show admin screen as host view`

---

## 1. Causa Raiz (por que não aparecia)

Cinco bugs independentes no `src/main.js`, todos cirúrgicos:

| # | Linha (antes) | Descrição |
|---|---|---|
| B1 | 2864–2865 | **Kill-switch**: `if(page === 'admin') page = 'sist';` — qualquer chamada a `setScreen('admin')` era silenciosamente redirecionada para `sist`. |
| B2 | 2881 | **adminScreen nunca ativado**: `adminScreen.classList.remove('is-active')` executado em 100% dos casos, sem nunca adicionar a classe. |
| B3 | ~2940 | **Sem click-handler**: `navButtons.admin` nunca recebia `.addEventListener('click', ...)`. O botão clicado não fazia nada. |
| B4 | 2896 | **Faltou `admin` no `navMap`**: a bolinha/estado ativo da sidebar nunca era marcado para `admin`. |
| B5 | 2930–2935 | **`ensureLoaded` + `scheduleResize` chamados para 'admin'**: tentaria carregar/redimensionar um iframe `frames['admin']` que não existe (seguro mas desnecessário; o early-return agora evita isso). |

O botão `navAdmin` no HTML (`index.html:71`) já tinha `style="display:none"` como padrão adequado — ele é exibido pela JS via `applyAccessControlUI()` após o login. Isso **estava correto**. O problema nunca foi o CSS: era o roteador.

---

## 2. O que foi alterado

### `src/main.js` — função `setScreen()` (5 mudanças)

**B1 — Removido kill-switch:**
```js
// ANTES (redireciona admin → sist silenciosamente)
// Admin desativado neste build (Operador)
if(page === 'admin') page = 'sist';

// DEPOIS (admin é tratado como rota legítima)
const isAdminScreen = (page === 'admin');
```

**B2 — adminScreen toggle (em vez de always-remove):**
```js
// ANTES
adminScreen.classList.remove('is-active');

// DEPOIS
adminScreen.classList.toggle('is-active', isAdminScreen);
```

**B2b — iframes agora respeitam isAdminScreen:**
```js
// ANTES
fr.classList.toggle('is-active', (!isDataMgr && k === page));

// DEPOIS
fr.classList.toggle('is-active', (!isDataMgr && !isAdminScreen && k === page));
```

**B4 — `admin` adicionado ao navMap:**
```js
const navMap = { ..., admin:'admin' };
```

**B5 — early-return para tela admin (tela host, sem iframe/resize):**
```js
if(isAdminScreen){
  try{ if(window.CIA_ADMIN?.refresh) window.CIA_ADMIN.refresh(); }catch(_e){}
  return;
}
```

**B3 — Click handler registrado:**
```js
if(navButtons.admin) navButtons.admin.addEventListener('click', ()=>setActive('admin'));
```

---

## 3. Como validar (passo a passo)

### Pré-requisito obrigatório (banco de dados)
O usuário master deve ter `is_master = true` na tabela `profiles` do Supabase:

```sql
UPDATE profiles
SET is_master = true, is_platform_admin = true
WHERE email = 'luiswagnercosta@icloud.com';
```

Execute no **Supabase Dashboard → SQL Editor** antes de testar.

### Teste 1 — Usuário master vê e acessa Admin

1. Abra `https://app.usecia.com` (ou `http://localhost:5173` em dev)
2. Logue com `luiswagnercosta@icloud.com`
3. Na sidebar, verifique que o botão **Admin** aparece (abaixo de Produtos)
4. Clique em **Admin**
5. Esperado: tela "Administração (Master)" abre com formulários de Criar Auth User / Criar Org / Criar Workspace / etc.
6. Clique em **Atualizar** — deve tentar chamar Edge Function `cia-admin` (exige HTTPS; em localhost mostrará aviso de "Admin requer HTTPS")

### Teste 2 — Usuário comum NÃO vê Admin

1. Logue com qualquer usuário que **não** tenha `is_master = true` no perfil
2. Sidebar deve **não** mostrar o botão Admin
3. Tente `window.setScreen('admin')` no console — a tela abre (não há bloqueio de front; proteção real deve estar no backend/Edge Function via service_role)

### Teste 3 — Navegação entre telas não quebra

- Clique Admin → tela admin aparece, iframes ficam invisíveis
- Clique Mapa da Operação → tela admin some, iframe Sist aparece
- Clique Gestão de Dados → dataManagerScreen aparece
- Nenhum redirecionamento silencioso deve ocorrer

---

## 4. Modelo de permissões: o que está pronto e o que falta

### ✅ Pronto no front-end

| Funcionalidade | Estado |
|---|---|
| `navAdmin` visível para `master`/`global_admin` | ✅ via `applyAccessControlUI()` |
| Rota `setScreen('admin')` funciona | ✅ após esta correção |
| `adminScreen` ativado/desativado corretamente | ✅ após esta correção |
| Early-return evita `ensureLoaded`/`scheduleResize` para tela admin | ✅ após esta correção |
| `window.CIA_ADMIN.refresh()` chamado ao entrar na tela | ✅ após esta correção |
| Master sem workspace: `loadContext` auto-cria org+workspace | ✅ já existia |
| Master sem org: `loadContext` auto-vincula/cria org | ✅ já existia |
| Após criar workspace via Admin, `add_workspace_member` pode vincular criador | ✅ botão já existe na UI |

### ⚠️ Falta no backend (não é responsabilidade do front-end atual)

| Pendência | Impacto | O que precisa |
|---|---|---|
| Edge Function `cia-admin` deve ter `service_role` configurada | Todas as ações Admin falham sem HTTPS+service_role | Variável de ambiente `SUPABASE_SERVICE_ROLE_KEY` na Edge Function |
| RLS nas tabelas `organizations`, `workspaces`, `workspace_users`, `org_users` | Se RLS bloquear leitura, o bootstrap da tela admin retorna vazio | Policies adequadas para `is_master = true` |
| Após `create_workspace`, membership do criador não é automático pelo front | Criador não terá acesso como `owner` sem intervir manualmente | Admin UI já tem "Adicionar membro a workspace" — usar logo após criar |
| Bootstrap inicial do master: `is_master` não é setado automaticamente | Admin não aparece para o primeiro usuário sem intervenção no DB | SQL do pré-requisito acima (passo manual único, não automatizável com segurança) |

---

## 5. Segurança: o que NÃO foi feito e por quê

- **Não houve email hardcoded**: a visibilidade do Admin depende 100% de `ctx.profile.is_master` vindo do Supabase — correto.
- **`setScreen('admin')` não tem guard de role no front**: intencional; a proteção real é no backend (Edge Function com `service_role`). Um usuário sem role não consegue executar ações, apenas ver a UI vazia/em modo leitura.
- **postMessage não foi alterado**: fora de escopo desta correção.
