# CIA Campo — Segurança de dependências

## Gate automático

O CI executa `npm audit --omit=dev --json` e bloqueia qualquer vulnerabilidade alta ou crítica, exceto as exceções temporárias documentadas abaixo.

## Exceções temporárias — ferramenta de build

Revisão obrigatória até **15/11/2026**.

### GHSA-86w9-cpqp-85rv — node-forge

- severidade: alta;
- origem no projeto: cadeia de ferramentas do `@expo/cli`;
- não é uma biblioteca chamada pelo código de negócio do CIA Campo;
- no momento da revisão não existe versão corrigida publicada pelo advisory;
- `npm audit fix --force` propõe downgrade incompatível do Expo e não deve ser usado;
- manter Expo SDK estável e atualizar assim que o upstream disponibilizar correção compatível.

### GHSA-mrhx-c7xc-m3w5 — zod

- severidade: alta;
- origem no projeto: cadeia do `@expo/cli`;
- existe Zod corrigido, porém forçar uma versão principal diferente por override pode quebrar o CLI;
- manter sob acompanhamento junto à atualização suportada do Expo.

## Regra

A exceção é limitada aos IDs acima, somente enquanto forem alcançados pela cadeia da ferramenta Expo no build. O script `scripts/security-gate.mjs` falha automaticamente se:

- surgir qualquer outro advisory alto/crítico;
- uma vulnerabilidade não puder ser explicada pelos IDs aprovados;
- a data de revisão for ultrapassada.

Essas exceções não significam que o risco foi eliminado. Elas registram uma decisão temporária de cadeia de build enquanto não existe remediação upstream compatível.
