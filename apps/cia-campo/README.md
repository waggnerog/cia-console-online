# CIA Campo — Android

Aplicativo nativo do promotor para o CIA. O app é uma camada mobile dedicada sobre o mesmo contrato Supabase usado pelo CIA web.

## Escopo V1

- autenticação individual por e-mail e senha;
- sessão única via Edge Function `session-gate`;
- agenda do dia por Ambiente e usuário;
- check-in com localização em primeiro plano;
- tarefas fotográficas com mínimo/máximo por tarefa;
- captura direta pela câmera;
- fila offline persistente para fotos, check-in e check-out;
- sincronização idempotente quando a conexão retorna;
- check-out somente após concluir tarefas obrigatórias;
- cache local da agenda para operação com conectividade instável;
- evidências publicadas no mesmo bucket e tabelas consumidos pelo BKO web.

## Backend esperado

O app usa as estruturas existentes do CIA:

- `memberships`
- `workspaces`
- `environment_services`
- `visits`
- `operations`
- `stores`
- `photo_tasks`
- `evidences`
- `store_assignments`
- Storage bucket `cia-evidencias`
- Edge Function `session-gate`

A autorização deve continuar sendo garantida por RLS no Supabase. O app nunca usa `service_role` nem chave secreta.

## Configuração local

1. Copie `.env.example` para `.env.local`.
2. Preencha a URL e a **publishable key** do Supabase.
3. Instale dependências de forma reprodutível com `npm ci --no-audit --no-fund`.
4. Rode:
   - `npm run typecheck`
   - `npx expo install --check`
   - `npx expo-doctor`
   - `npm start`

## Android / Google Play

Identificador Android: `com.usecia.campo`.

O projeto usa Expo SDK 58 e gera Android com target API 36, atendendo o requisito vigente para novos apps no Google Play.

Produção:

```bash
eas build --platform android --profile production
eas submit --platform android --profile production
```

A publicação final exige acesso do proprietário à conta Google Play Console e, para o primeiro envio, configuração das credenciais de assinatura/Google Play no EAS.

## Estratégia offline

Toda foto é copiada para o diretório privado persistente do app antes de entrar na fila. A fila contém um identificador estável usado no caminho do Storage. Se a rede cair entre upload e confirmação, a próxima sincronização verifica o `storage_path` antes de repetir a operação.

A ordem da fila é preservada: check-in → evidências → check-out. Se um item falhar, itens posteriores não avançam, evitando concluir uma visita antes das fotos.

## Permissões

O app solicita apenas:

- câmera: no momento de registrar uma evidência;
- localização aproximada/precisa em primeiro plano: no check-in e check-out;
- estado da rede: para sincronização.

Não há áudio, localização em segundo plano nem leitura da galeria.

## QA obrigatório antes de produção

### Autenticação e acesso
- credencial válida;
- senha inválida;
- usuário sem perfil Promotor;
- Ambiente sem CIA Campo habilitado;
- sessão aberta em outro aparelho.

### Agenda
- nenhuma visita;
- uma visita;
- múltiplas visitas;
- visita cancelada;
- tarefas sem foto obrigatória;
- tarefas com mínimo e máximo de fotos.

### Conectividade
- check-in online;
- check-in sem internet;
- reiniciar o app após check-in offline;
- tirar múltiplas fotos sem internet;
- matar o app durante fila pendente;
- recuperar sinal e sincronizar;
- perda de rede durante upload;
- evitar duplicação após retry;
- check-out offline e posterior sincronização.

### Permissões
- câmera permitida/negada;
- localização permitida/negada;
- localização indisponível;
- câmera interrompida/cancelada.

### Dispositivos
- Android 7 (mínimo da SDK);
- Android 13;
- Android 14;
- Android 15;
- Android 16;
- tela pequena;
- tela grande;
- modo de economia de bateria;
- rede móvel lenta.

### Integração CIA
- foto enviada aparece na fila BKO;
- tarefa, loja e operação corretas;
- Promotor/Supervisor vinculados;
- aprovação/ajuste/reprovação continuam funcionando;
- limites de assinatura e RLS não permitem acesso cruzado entre Ambientes.
