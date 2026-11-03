# Categorias das fotos — Campo e BKO

O promotor escolhe uma categoria antes de abrir a câmera. A tarefa pode sugerir uma escolha, mas a confirmação é sempre do usuário. Categorias ambíguas não são inferidas. Etapa é uma dimensão separada: Registro, Antes, Durante, Depois ou Resultado. Uma observação opcional tem limite de 300 caracteres.

## Configuração da operação

Em **Configurações → Configurar categorias**, o Admin/proprietário escolhe frentes, ativa ou desativa categorias, cria categorias personalizadas e define sugestões por tarefa. Perfis iniciais: trade/vendas, auditoria de lojas, serviços/manutenção e logística. As seis frentes podem ser combinadas livremente, inclusive somente treinamento. O padrão inicial habilita trade, vendas e treinamento.

Ponto extra é um agrupador e também pode ser registrado sem subtipo. Filtrar Ponto extra inclui ponta de gôndola, ilha, display/expositor, check-out, mesa, vitrine e cross merchandising. Ponto natural fica separado. Vendas, abordagem e treinamento são atividades distintas de exposição.

## Dados e compatibilidade

- Catálogo e regras compartilhados em `apps/cia-campo/src/domain/photoClassification.js`, consumidos pelo Android e pelo web/BKO.
- Configuração em `workspaces.settings.photo_classification`: `version`, `enabledGroups`, `hiddenIds`, `custom`, `taskDefaults`. Preserva as demais configurações do ambiente.
- Foto em `evidences.metadata.classification`: `version`, `categoryId`, `label`, `path`, `group`, `groupLabel`, `parentId`, `stage`, `note`.
- IDs são permanentes. Rótulos e hierarquia são fotografados no momento do registro: alterações futuras no catálogo não reescrevem evidências antigas. Desativar é arquivar, preservando consulta e filtros históricos.
- A classificação é gravada junto à foto na fila offline existente. Itens antigos sem essa propriedade continuam sincronizando; imagens só são removidas localmente após confirmação de envio.
- Fotos antigas ou sem classificação válida aparecem como **Sem categoria**. Não há classificação retroativa inventada.
- Nenhuma migração de schema, nova conta/projeto, alteração de RLS ou chave privilegiada é necessária. As permissões existentes continuam aplicadas: configuração por owner/admin, leitura de fotos e escrita do promotor conforme o ambiente, serviço, vínculo e visita.
- Texto de categoria/observação não serve para autorização. É escapado na apresentação; exportações neutralizam fórmulas de planilha.

## BKO e importação

Frente, categoria e etapa combinam-se com os filtros de busca, rede, origem e status. Alterar a classificação consultada reaplica a condição no servidor **antes** do limite de 500 fotos; portanto categorias com fotos antigas também podem ser encontradas. O BKO informa a quantidade total do recorte e quantas foram carregadas. Indicadores e CSV usam as fotos carregadas, não prometem totalização de todo o histórico quando o recorte ultrapassa 500. Relatórios preservam os filtros e apresentam aprovação por categoria.

O CSV de entrada admite colunas opcionais Categoria, Etapa e Observação. Categoria aceita ID estável ou nome único disponível; etapa aceita ID ou rótulo em português. Categorias desconhecidas/ambíguas ou etapas inválidas bloqueiam a importação antes de gravar. Sem categoria mapeada, o fluxo antigo é preservado.

## Validação

- `npm test`: regras de domínio, histórico, perfis, ambiguidade, CSV, consulta PostgREST, seleção web, configurações, erro de gravação, escape de conteúdo, exportação e integração da fila/indicadores/relatórios.
- `npm run build`: BKO de produção; fixture de demonstração ausente do resultado.
- Em `apps/cia-campo`: `npm run typecheck`, testes existentes de segurança e `npx expo export --platform android`.
- CI também valida alinhamento Expo, Expo Doctor, prebuild, Gradle e permissões Android.

### Aceitação em Android real (pendente)

1. Abrir uma visita com check-in, confirmar sugestão, trocar categoria, selecionar Antes/Depois e fotografar.
2. Cancelar categoria/câmera e confirmar que nenhuma evidência é enviada.
3. Em modo avião, fotografar com categoria personalizada, encerrar/reabrir o app e restabelecer conexão. Conferir uma única foto no BKO com categoria, etapa e observação preservadas.
4. Desativar a categoria enquanto uma foto está offline; sincronizar e conferir que o histórico mantém o rótulo original.
5. Atualizar agenda após mudança de configuração e conferir novo catálogo, seleção por busca e uso com leitor de tela/teclado ampliado.
6. Verificar perfis Admin, BKO, Supervisor e Promotor em ambientes distintos.

Esta alteração é preparada sobre a branch do Android, em revisão separada. Não equivale a atualizar automaticamente o aplicativo 1.0.0 (4) já instalado nem a publicar o BKO em produção. Merge, build assinado e promoção do teste interno continuam etapas distintas.
