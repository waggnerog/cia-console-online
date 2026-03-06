# CIA — Console Integrado de Análise

Plataforma web para consolidação de dados operacionais de PDV: sistemática, fotos, efetividade, tracking de pesquisa e data crítica.

---

## Quick Start

### Pré-requisitos

- Node.js 18+
- Um projeto Supabase configurado (ver [SUPABASE_BACKEND_SETUP.md](SUPABASE_BACKEND_SETUP.md))

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> **Nota:** use apenas a **anon/public key**. A service_role key nunca deve ser exposta no cliente.

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173).

### 4. Build de produção

```bash
npm run build
```

Saída em `dist/`. Faça deploy via GitHub Pages, Vercel, Netlify ou qualquer host estático.

### 5. Deploy automático (GitHub Actions → gh-pages)

O workflow `.github/workflows/deploy.yml` faz build e deploy automaticamente a cada push em `main`.

**Secrets necessários** (configurar em `Settings → Secrets and variables → Actions` do repositório):

| Secret | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL do seu projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anon/public do Supabase |

Após configurar os secrets, qualquer push em `main` dispara o workflow e publica em `app.usecia.com`.

---

## Estrutura do Projeto

```
cia-console-online/
├── index.html                  # Entry point (lean HTML, sem inline scripts/CSS)
├── src/
│   ├── main.js                 # JavaScript completo da aplicação (IIFE principal + Auth Gate)
│   ├── lib/
│   │   └── supabaseClient.js   # Cliente Supabase único (env vars Vite)
│   └── styles/
│       ├── tokens.css          # Design tokens CIA (CIA Green, IBM Plex Sans)
│       └── app.css             # Todos os estilos de componentes
├── public/
│   └── CNAME                   # GitHub Pages custom domain
├── legacy/
│   └── index_legacy.html       # Snapshot do monólito original (referência)
├── .env.example                # Template de variáveis de ambiente
├── vite.config.js
├── package.json
└── SUPABASE_BACKEND_SETUP.md   # Guia completo de provisionamento do backend
```

---

## O que foi Removido nesta Versão

| Removido | Motivo |
|---|---|
| Cloudflare Workers / D1 / R2 / Wrangler | Backend unificado 100% Supabase |
| `file://` protocol / offline-first logic | App exclusivamente online (auth obrigatória) |
| "Master local auth" / sync whitelist offline | Removido junto com offline-first |
| `window.CIA_SUPABASE_URL` hardcoded em HTML | Substituído por `VITE_SUPABASE_*` em `.env.local` |
| CDN `<script src="…/supabase-js@2">` | Substituído por NPM `@supabase/supabase-js` |
| `/api/auth/logout` fallback | Apenas `supabase.auth.signOut()` |
| Teal/Plum como cores de acento UI | CIA Green `#1A7A3A` é o único acento |
| Inter / Manrope / Sora / Plus Jakarta Sans | IBM Plex Sans + IBM Plex Mono (CIA branding) |

---

## QA Checklist

Após configurar o `.env.local` e rodar `npm run dev`, verifique:

- [ ] Login com e-mail/senha válidos funciona
- [ ] Login com credenciais inválidas exibe erro (sem crash)
- [ ] Logout funciona e retorna ao overlay de login
- [ ] Navegação entre telas (Sist / Fotos / Efet / Pesq / DataCrit / HC / PDVs / Produtos / Planejamento) exibe iframes corretamente
- [ ] Telas **Efetividade**, **Data Crítica** e **Fotos** carregam dados **direto do Supabase** (sem upload de arquivo)
- [ ] Tela **Planejamento** visível para todos os usuários autenticados; permite criar planos e itens via modal
- [ ] Botão **Importar CSV** aparece nas telas HC, PDVs e Produtos e abre modal de import
- [ ] **Gestão de Dados** → Cloud Sync: `Atualizar Weeks` lista weeks do Supabase
- [ ] **Seção "Arquivos" da sidebar** está oculta por padrão (uploads disponíveis via Gestão de Dados para admins)
- [ ] Admin screen aparece apenas para `master` / `global_admin`
- [ ] Sem erros de console relacionados a `file://`, `wrangler`, `D1`, `/api/`, `service_role`

---

## CIA_DB_ONLY — Modo DB-only (default: `true`)

A constante `CIA_DB_ONLY = true` em `src/main.js` garante que:

- A seção **Arquivos** (uploads legacy) é sempre oculta da sidebar.
- Os módulos **Efetividade**, **Data Crítica**, **Fotos** e **Planejamento** são alimentados **exclusivamente** pelo Supabase.
- O path legacy `decodeB64/srcdoc` é contornado para esses módulos.

Para reabilitar uploads temporariamente (somente em dev), mude para `CIA_DB_ONLY = false` em `src/main.js`.

### Tabelas/Views obrigatórias no Supabase

| Tabela / View | Módulo | Fallback |
|---|---|---|
| `effectiveness_records` | Efetividade | — |
| `data_critica_records` | Data Crítica | — |
| `photos_records` | Fotos | — |
| `visit_plans` | Planejamento | — |
| `visit_plan_items` | Planejamento (itens) | — |
| `pdvs` | Planejamento (dropdown) | — |
| `people` | Planejamento (dropdown) | — |
| `workspace_users` | Auth (todos os módulos) | — |

Se uma tabela não existir, o módulo exibirá `Contrato do banco ausente: <nome_da_tabela>` sem quebrar o app.

> Consulte [SUPABASE_BACKEND_SETUP.md](SUPABASE_BACKEND_SETUP.md) para o SQL completo de criação.

---

## Backend

Ver [SUPABASE_BACKEND_SETUP.md](SUPABASE_BACKEND_SETUP.md) para:
- Schema completo das tabelas
- Políticas RLS
- Edge Function `cia-admin`
- Bootstrap do usuário master

---

## Licença

© 2026 CIA — Console Integrado de Análise. Programa de computador de propriedade de 63.315.445/0001-80. Todos os direitos reservados.
