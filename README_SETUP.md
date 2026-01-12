# CIA Console Integrado (Cloud Edition) — Repo pronto

Este pacote transforma o CIA (HTML offline) em **online**, com:
- Login por **OTP** (código)
- Multi-tenant por **workspace** (clientes)
- **Week ativa** por usuário/workspace
- Upload dos relatórios XLSX para **R2** (modo simples: **1 arquivo oficial por Week+Kind**)
- Sync total (whitelist) de estados via **D1** (localStorage)

## Arquivos principais
- `index.html` — seu CIA patchado (cloud)
- `functions/api/[[path]].ts` — API (Cloudflare Pages Functions) com D1 + R2
- `migrations/0001_init.sql` — schema D1
- `wrangler.toml` — bindings (preencha IDs)

## 1) Criar D1 e aplicar migration
1. Crie um DB D1 chamado `cia_prod` no Cloudflare.
2. Pegue o `database_id` e cole em `wrangler.toml`.
3. Aplique migrations (via wrangler CLI):
   - `wrangler d1 migrations apply cia_prod`

> Migrations D1: https://developers.cloudflare.com/d1/migrations/

## 2) Criar bucket R2
Crie um bucket R2 chamado `cia-uploads` e confirme o binding `BUCKET` no `wrangler.toml`.

## 3) Criar workspaces e memberships (setup inicial)
⚠️ Neste modelo, **não há auto-provisionamento**. Você cria clientes e dá acesso via SQL.

Exemplo (execute no D1):

```sql
-- Workspace (cliente)
INSERT INTO workspaces(id,name,slug,created_at)
VALUES ('819649070bb00de6','Mococa','mococa','2026-01-12T01:14:24.930823');

-- Usuário (será criado automaticamente no primeiro OTP verify).
-- Depois do primeiro login do usuário (e-mail), faça membership:

INSERT INTO memberships(user_id, workspace_id, role, created_at)
VALUES ('<USER_ID_DO_USERS>','<WORKSPACE_ID>','admin','2026-01-12T01:14:24.930830');
```

Dica: depois do usuário logar uma vez, rode:
```sql
SELECT id,email FROM users;
SELECT id,name,slug FROM workspaces;
```

## 4) OTP (envio de e-mail)
Por padrão, este repo **não envia e-mail** (para não forçar provider agora).

### Modo DEV (para testar rápido)
Defina variável de ambiente:
- `OTP_DEV_MODE=1`
- `OTP_SALT=algum_segredo`

Nesse modo, `/api/auth/request-code` retorna `dev_code` na resposta.

### Produção
Integre um provedor (Resend/SendGrid/etc.) no endpoint `/api/auth/request-code`.
Mantém o mesmo DB e o mesmo fluxo.

## 5) Deploy no Cloudflare Pages
- Conecte seu repositório no Cloudflare Pages.
- Build command: **nenhum** (site estático)
- Output: `/`
- Functions: pasta `/functions`

## Observações importantes (anti-erro)
- Upload no R2 é **sobrescrito** por padrão:
  - 1 arquivo oficial por `(workspace + week + kind)` no caminho:
    `{slug}/{kind}/Week-{week}/current.xlsx`
- O restore baixa sempre o “current.xlsx” da week ativa (via metadados no D1).
