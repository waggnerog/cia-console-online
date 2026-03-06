# Relatório de Auditoria e Diagnóstico (CIA Console Online)

## Resumo Executivo (GO/NO-GO)
**Status: NO-GO Parcial.**
A aplicação no seu estado atual (`main`) não possui a funcionalidade de "Importar CSV" nos módulos principais. No entanto, do ponto de vista de segurança arquitetural, a aplicação está segura e aderente ao modelo Supabase-only. A mitigação de pequenos riscos de front-end e a reinclusão da feature de importação são altamente viáveis e exigem pouco esforço.

## Fase 1 — Diagnóstico dos Botões CSV

### Causa Raiz
Os botões de "Importar CSV" **não foram implementados nos novos módulos reescritos**.
Durante a refatoração recente ("refactor/supabase-only-brand-cleanup", commit `e3ed626`), a estrutura de iframes foi atualizada para injetar conteúdo estático gerado por JS puro (arquivos `src/modules/hc.js`, `pdvs.js` e `products.js`).

**Evidência:**
- A busca por `Importar CSV`, `csv` ou `importModal` retorna vazia nos arquivos dentro de `src/modules/`.
- Apenas os botões de controle de modal (`btnNew`, `btnSearch`, `btnCloseModal`, `btnCancel`) existem no HTML stringificado de `src/modules/*.js`. A feature ficou de fora do pull request de refatoração.

### Correção Mínima Recomendada
Adicionar de volta os botões `<button id="btnImportCsv">Importar CSV</button>` e `<input type="file" id="fileImportCsv" accept=".csv" style="display:none">` na div `.filters` de cada tela. Implementar listeners em JS puro que leiam o arquivo via `FileReader`, façam parse rudimentar separado por vírgulas ou ponto e vírgulas, e executem `upsert` na respectiva tabela do Supabase (`people`, `pdvs`, `products`), associando os registros ao `currentWorkspaceId` já declarado nestes arquivos.

---

## Fase 2 — Auditoria de Segurança

### 1. Risco de “Invasão” via Supabase
**Avaliação:** BAIXO RISCO / BLINDADO.
- **RLS (Row Level Security):** O arquivo `src/migrations/001_hc_pdv_products.sql` confirma que RLS está habilitado em todas as tabelas vitais (`people`, `pdvs`, `products`, `assignments`, `pdv_products`).
- **Acesso Cross-Workspace:** Todas as policies verificam ativamente se o usuário pertence ao workspace via `auth.uid()` -> `workspace_users`. Portanto, o isolamento multi-tenant está funcionando na base de dados.
- **Edge Functions:** A invocação em `src/main.js` de `cia-admin` só tem sucesso em operações sensíveis se o usuário logado tiver uma role de administração global validada no backend com a `service_role`.

### 2. Frontend & Cópia de HTML
**Avaliação:** RISCO MODERADO (XSS) / RISCO BAIXO (Cópia HTML).
- **innerHTML / srcdoc:** Identificados múltiplos usos de `.innerHTML = filtered.map(p => ...)` em `hc.js`, `pdvs.js` e `products.js`.
  - *Mitigação Existente:* O código usa uma função `escapeHTML()` para variáveis como `p.name` e `p.role`.
  - *Risco Residual:* É imperativo que **nenhuma variável externa** (especialmente do CSV importado futuramente) deixe de passar pelo `escapeHTML()` antes de ser concatenada no DOM, prevenindo Stored XSS.
- **Cópia do HTML (Source Exposto):**
  - *O que significa:* Em Single Page Applications (SPAs) estáticas (Vite), todo o HTML, JS e CSS é entregue ao navegador. Um usuário mal-intencionado pode ver o código-fonte, rotas e estrutura de tabelas.
  - *Por que não há muito o que fazer:* O protocolo Web exige que o cliente execute o JS. Minificação (já feita via `npm run build`) ofusca, mas não impede engenharia reversa.
  - *A Proteção Real:* Não é esconder o JS, mas garantir que a API (Supabase) jamais retorne ou escreva dados não autorizados (RLS cumpre isso brilhantemente). As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` não são segredos, são endereços públicos de API. Odiá-las no client side é o fluxo padrão.

### Achados e Severidades

| Achado | Severidade | Arquivo(s) Evidência | Recomendações Mínimas |
| :--- | :--- | :--- | :--- |
| **XSS via innerHTML em tabelas** | **HIGH** | `hc.js:213`, `pdvs.js:274`, `products.js:206` | Garantir que o parser de CSV escape dados de input e garantir que renderização futura obedeça rigidamente ao `escapeHTML()`. |
| **Exposure de ANON_KEY** | **INFO** | `.env.local`, `src/main.js:34` | Falso Positivo / Normal por design. Nenhuma ação necessária, RLS está protegendo os dados. |

---

## Checklist Anti-Regressão
- [ ] O botão "Importar CSV" insere dados atrelados *exclusivamente* ao Workspace logado.
- [ ] Componentes de tabelas não quebram ao buscar strings vazias (Filtro já é live update).
- [ ] O código continua rodando via `npm run dev` e `npm run build` após a adição da feature de CSV.
- [ ] O app continua a usar as env vars `VITE_SUPABASE_*` originais. Nenhuma chave secreta foi colocada no client.
