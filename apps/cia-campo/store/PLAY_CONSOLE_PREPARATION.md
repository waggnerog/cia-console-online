# CIA Campo — preparação da Play Console

Preparação em 27/10/2026, revisada contra `api.ts`, `media.ts`, `device.ts`,
`supabase.ts` e a função de produção `session-gate`.
Este documento contém respostas preparadas; não comprova envio de formulários.

## Identificação

| Campo | Valor |
| --- | --- |
| Proprietária | wagner.costa@usecia.com |
| App / package | CIA Campo / `com.usecia.campo` |
| Marca | CIA Gestão de Evidências |
| Idioma / tipo / categoria | Português (Brasil), pt-BR / Aplicativo / Negócios |
| Download | Gratuito; acesso corporativo provisionado pelo CIA |
| Público pretendido | Profissional adulto, 18 anos ou mais |
| Anúncios / Advertising ID | Não; confirmar no manifesto do AAB oficial |
| Site | https://app.usecia.com |
| Privacidade | https://app.usecia.com/privacidade.html |
| Suporte | https://app.usecia.com/suporte.html |
| Contato / suporte / privacidade | wagner.costa@usecia.com |

Usar os textos de `PLAY_STORE.md` e os assets existentes do CI.
Não alterar o package nem reutilizar o AAB de compilação.

O produto não implementa serviço financeiro, saúde ou função governamental.
Não declarar certificação independente de segurança. A faixa etária pretendida
não substitui a classificação IARC; responder ao questionário efetivamente
exibido no Console. O app permite enviar fotos operacionais visíveis à gestão
do mesmo Ambiente: considerar esse fluxo nas perguntas sobre conteúdo
gerado/compartilhado por usuários, sem descrevê-lo como rede social pública.

## Data Safety

Referência complementar: `DATA_SAFETY.md`. Declarar coleta porque os dados
saem do dispositivo. Não declarar processamento exclusivamente efêmero:
evidências, visitas e registros de segurança persistem no servidor.

| Tipo do Google Play | Dados e finalidade | Coleta |
| --- | --- | --- |
| Informações pessoais: nome, e-mail e IDs de usuário | Conta corporativa, identidade do Promotor e Ambiente; funcionalidade, gerenciamento da conta e segurança | Necessária ao serviço autenticado |
| Fotos | Evidências das visitas; funcionalidade principal | Necessária nas tarefas obrigatórias; declarar obrigatória |
| Localização aproximada e precisa | Coordenadas no check-in/check-out; funcionalidade | Opcional: `currentPosition()` admite permissão negada/localização indisponível |
| Dispositivo ou outros IDs | ID aleatório da instalação, sessão e IP/user-agent; prevenção de fraude, segurança e conformidade | Necessária ao controle de sessão |
| Atividade no app: interações no app | Registros operacionais de check-in, check-out e execução de tarefas; funcionalidade | Necessária à execução de visitas |

Não declarar vídeo, áudio, contatos, galeria, publicidade, localização em
segundo plano ou analytics publicitário. O controle de sessão usa o IP para
segurança e não infere localização. IDs internos não são Advertising ID.

O tráfego com o backend usa HTTPS. Fotos aguardando sincronização ficam no
sandbox privado; a cópia da fila é removida após envio confirmado. Isso não
significa exclusão da evidência no servidor.

O processamento no Supabase exclusivamente por conta do CIA pode se enquadrar
na exceção de prestador de serviço do Google. Confirmar o tratamento contratual
e os destinatários reais ao responder sobre compartilhamento; a ausência de
anúncios não é evidência suficiente. Fotos são visíveis aos usuários autorizados
da organização no mesmo Ambiente.

Há solicitação de exclusão pelo canal de privacidade publicado. Contas são
provisionadas pela organização; o app não oferece criação de conta. Não prometer
exclusão instantânea de dados sujeitos à retenção.

## Acesso à revisão

A conta de revisão ainda precisa ser criada e validada pelo Supabase Auth por
um caminho administrativo autenticado. Não inserir usuários diretamente nas
tabelas internas de Auth nem colocar senha neste repositório.

Provisionar somente um Promotor em Ambiente exclusivo, com dados fictícios:

- `memberships.role = promoter`, `people.person_role = promoter` e vínculo
  `people.auth_user_id` ao usuário Auth;
- `field_enabled` e assinatura de demonstração ativa sem cobrança ou
  expiração durante a revisão;
- loja fictícia atribuída por `store_assignments`, operação e tarefas com
  limites explícitos de fotos;
- visitas atribuídas ao usuário **na data da revisão**, em
  `America/Sao_Paulo`: o app consulta somente a agenda do dia. Uma visita criada
  hoje não garante acesso funcional numa revisão futura;
- visitas independentes suficientes para repetição, sem apagar evidências ou
  reabrir visitas já concluídas durante o uso pelo revisor.

Validar login, chamada JWT de `session-gate`, consultas sob RLS, agenda,
tarefas e isolamento antes de fornecer acesso ao Google. Acesso sem OTP,
aprovação manual a cada login ou bloqueio geográfico.

### Instruções para o Google após validar a conta

Preencher login e senha somente nos campos privados da Play Console.
Texto em inglês para o campo de instruções:

> Sign in using the dedicated reviewer credentials supplied in the private
> fields. This account has the Promotor role in an isolated demonstration
> environment containing fictional data. Open today's scheduled visit, tap
> “Fazer check-in”, open each required photo task and capture the requested
> photo using the camera. After all required photos are accepted, complete
> check-out. Camera access is required to capture photos; location is requested
> only at check-in/check-out and is optional. No customer purchase or public
> registration is required. The app enforces one active session per account;
> signing in on another device can end the previous session.
> Support: wagner.costa@usecia.com.

## Notas da versão — pt-BR

Primeira versão do CIA Campo para execução de visitas, check-in, tarefas,
evidências fotográficas, check-out e sincronização de atividades offline.

## Validação do AAB oficial

Registrar ID do build EAS, commit, SHA-256 do arquivo, versão/versionCode,
certificado SHA-256 de upload, package, targetSdk e permissões extraídas do AAB.
Validar estrutura com bundletool e assinatura com jarsigner; conferir o
certificado contra a upload key da Play Console. Verificar ausência de debug
keystore, placeholder de CI e segredos privados no artefato.

A upload key fica no EAS; a App Signing Key fica sob gestão do Google Play.
Não gerar outra upload key se o package já tiver uma chave oficial associada.

O perfil `production` usa credenciais remotas, distribuição de loja, ambiente
production, incremento remoto de versionCode e configuração pública do Supabase
real. Confirmar owner/projectId na conta Expo autenticada antes do build.
O primeiro envio à Play Console deve ser manual; o perfil de EAS Submit
permanece em teste interno com release em rascunho.

## Teste físico do build distribuído pelo Google Play

1. Instalar pela trilha interna e confirmar versão/versionCode.
2. Validar login, senha inválida, logout e substituição de sessão por outro
   dispositivo quando disponível.
3. Conferir agenda, Ambiente, loja e tarefas; verificar isolamento entre
   usuários/Ambientes.
4. Testar check-in online e localização aproximada/precisa, negada e indisponível,
   sem coleta fora do check-in/check-out.
5. Testar câmera permitida/negada, captura cancelada e mínimo/máximo de fotos.
   Confirmar bloqueio de check-out antes das tarefas obrigatórias.
6. Em modo avião: check-in, várias fotos, encerramento do processo e reinício;
   confirmar recuperação visual e da fila, depois check-out.
7. Recuperar a rede e interromper um upload. Repetir a sincronização e confirmar
   ordem check-in → fotos → check-out, sem evidências duplicadas.
8. Conferir fotos/vínculos no BKO, Aprovar/Ajustar/Reprovar e remoção da cópia
   local da fila após envio confirmado.
9. Repetir fluxos principais com rede lenta, economia de bateria e versões
   Android suportadas conforme o minSdk do AAB oficial. Não assumir Android 7
   como mínimo sem validar esse manifesto.

## Fontes oficiais

- https://docs.expo.dev/eas/json/
- https://docs.expo.dev/eas/environment-variables/usage/
- https://docs.expo.dev/app-signing/app-credentials/
- https://support.google.com/googleplay/android-developer/answer/10787469
- https://support.google.com/googleplay/android-developer/answer/9859455
- https://support.google.com/googleplay/android-developer/answer/9845334
