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
VITE_SUPABASE_BUCKET=cia-files
```

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
- [ ] Navegação entre telas (Sist / Fotos / Efet / Pesq / DataCrit) exibe iframes corretamente
- [ ] "Gestão de Dados" → Cloud Sync: `Atualizar Weeks` lista weeks do Supabase
- [ ] "Gestão de Dados" → Cloud Sync: `Carregar Week` baixa e injeta arquivos
- [ ] Upload de arquivo Sistemática funciona (carrega no Supabase Storage)
- [ ] Admin screen aparece apenas para `master` / `global_admin`
- [ ] Sem erros de console relacionados a `file://`, `wrangler`, `D1`, `/api/`

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
