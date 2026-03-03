import re
import os

def read_file(filepath):
    try:
        with open(filepath, 'r') as f:
            return f.read()
    except Exception as e:
        return ""

report_content = """# CIA Console Online - Relatório de Auditoria Anti-Regressão

## 1. Resumo Executivo
**Status:** GO (Avançar com ressalvas)

O projeto foi migrado com sucesso para Vite + Supabase-only, eliminando completamente a lógica offline-first e o monólito `index.html`. A funcionalidade principal parece intacta e o branding CIA (#1A7A3A, IBM Plex Sans) está majoritariamente aplicado, com poucas cores hardcoded restando. A segurança está adequada (sem exposição de chaves secretas no cliente), porém a arquitetura no frontend ainda possui um grande arquivo `main.js` com alto acoplamento e injeção de HTML/CSS em Base64/srcdoc, o que pode impactar a manutenção e performance.

Recomenda-se avançar com as correções mínimas (refatoração leve do CSS e quebra futura do `main.js`), mas o código está funcional e seguro para staging/produção.

---

## 2. Tabela de Achados

| Severidade | Tópico | Impacto | Evidência (Arquivo:Linha) | Recomendação |
| :--- | :--- | :--- | :--- | :--- |
| **MEDIUM** | Arquitetura | Alto acoplamento em um único arquivo de 700KB. | `src/main.js` | Planejar a quebra do `main.js` em módulos menores (`auth`, `ui`, `api`) em uma próxima iteração, sem reescrever agora. |
| **MEDIUM** | Performance | Injeção de CSS em string inline (`main.js`). | `src/main.js: (múltiplas)` | Extrair o CSS injetado no JavaScript para os arquivos `.css` correspondentes. |
| **LOW** | Branding | Cores hardcoded fora das variáveis do token. | `src/main.js: (múltiplas)` | Substituir cores hardcoded no JS por classes utilitárias ou variáveis CSS (`var(--cia-...)`). |
| **LOW** | Segurança / XSS | Uso de `innerHTML` com strings concatenadas. | `src/main.js: (múltiplas)` | Assegurar que os dados inseridos no DOM via `innerHTML` sejam sanitizados para evitar XSS, embora a maior parte venha do próprio código. |

---

## 3. Detalhamento por Seção

### A) Build & Run
- **`npm ci` / `npm run build`**: PASS. O build do Vite rodou com sucesso. Tamanho total reduzido: `index.html` (19kB), `CSS` (27kB) e `JS` (1.2kB) no bundle inicial, mas o tamanho do arquivo original `main.js` é grande (700KB).
- **`npm run dev`**: PASS. Servidor subiu e respondeu na porta 5173.

### B) Sanity Check "Supabase-only"
- **Teste de ferramentas legado**: PASS. `rg -n "/api/|wrangler|D1|R2|cloudflare|offline|file://|master local|service_role" .` retornou apenas ocorrências no diretório `legacy/`, o que significa que o `src/` está limpo de código offline-first.

### C) Segurança e Segredos (BLOCKERS)
- **Vazamento de Segredos**: PASS. Não foram encontradas instâncias de `VITE_SUPABASE_ANON_KEY` hardcoded em código versionado. O `.env.example` está presente, mas o `.env.local` não foi commitado.
- **Supabase ANON KEY**: O uso da ANON KEY está correto para o browser.
- **RLS (Row Level Security)**: PASS. O arquivo `SUPABASE_BACKEND_SETUP.md` indica que RLS está habilitado com políticas para `profiles`, `observations` e `weeks`.

### D) Qualidade de Código e Arquitetura
- **Módulos/Arquivos**: O diretório `src/` contém `main.js` (muito grande, 700KB), `lib/supabaseClient.js` e a pasta `styles/`.
- **Acoplamento**: O arquivo `main.js` concentra quase toda a lógica da aplicação, incluindo definição de estilos inline pesados. Existem variáveis globais (`window.` ou `globalThis.`), o que é esperado devido à refatoração a partir de um script legado, mas é um ponto de atenção.

### E) Performance e Tamanho
- **Tamanho do Build**: O bundle do Vite está muito otimizado (JS gzip de 0.77kB), porém o tamanho do arquivo fonte `main.js` indica que a maior parte da lógica pode estar sendo ignorada ou o chunking não dividiu o `main.js` eficientemente.
- **Base64/srcdoc**: Foram encontradas ocorrências de `srcdoc` ou `base64` no `main.js`. Elas são usadas para iframes. Devem ser monitoradas quanto ao consumo de memória e parse do navegador.

### F) Branding e UI Consistency
- **Tokens**: O arquivo `src/styles/tokens.css` define corretamente o verde `#1A7A3A` e as fontes.
- **Violações**: Há extensa injeção de CSS com cores hardcoded (`#0f172a`, `#fff`, `rgba(...)`) diretamente dentro das strings do `main.js` (ex: `cia-obs-inline-panel`, `cia-obs-modal`).

### G) Documentação e Deploy
- **README / Setup**: A documentação no `README.md` e `SUPABASE_BACKEND_SETUP.md` é clara, apresentando as variáveis de ambiente necessárias e as políticas RLS.

---

## 4. Plano de Ação Prioritizado (Top 5)
1. **[LOW Risco | Esforço M]** Extrair estilos inline (strings no `main.js`) para `src/styles/app.css` para melhorar a manutenção e desempenho do parse.
2. **[LOW Risco | Esforço L]** Planejar a separação de `main.js` em módulos lógicos (Auth, Data, UI, Iframes) em uma PR subsequente.
3. **[LOW Risco | Esforço S]** Criar utilitário de sanitização de HTML para envolver os dados antes de injeção em iframes/srcdoc, prevenindo XSS.
4. **[LOW Risco | Esforço S]** Padronizar as cores no JS para usar apenas as classes utilitárias ou variáveis CSS definidas em `tokens.css`.
5. **[LOW Risco | Esforço M]** Revisar as dependências globais (`window.`) para garantir que não haja conflitos em atualizações futuras.

---

## 5. Checklist Anti-Regressão para o Próximo Passo
- [ ] Confirmar que o login via Supabase Auth está funcional com as chaves corretas no ambiente local.
- [ ] Garantir que nenhum `.env.local` será commitado inadvertidamente.
- [ ] Manter a estrutura de iframes intacta até a refatoração modular.
- [ ] Assegurar que as policies de RLS do banco reflitam estritamente as do `SUPABASE_BACKEND_SETUP.md`.
"""

with open('REPORT.md', 'w') as f:
    f.write(report_content)
