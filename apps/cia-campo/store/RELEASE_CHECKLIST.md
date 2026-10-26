# CIA Campo — Release Gate

Uma versão só deve avançar para produção quando todos os itens abaixo estiverem concluídos.

## Código
- [x] CI verde: dependências Expo alinhadas
- [x] Expo Doctor sem erro (20/20)
- [x] TypeScript sem erro
- [x] export Android concluído
- [x] bundle Android release compila nativamente
- [x] pacote Android confirmado: com.usecia.campo
- [x] targetSdk 36 confirmado no build nativo
- [x] package-lock.json versionado e CI migrado para npm ci
- [ ] nenhum segredo no bundle final assinado
- [ ] versionCode de produção confirmado/incrementado

> O AAB gerado pelo CI serve como prova de compilação nativa. Ele não é o artefato final para o Google Play porque o CI não possui a chave privada de upload/assinatura de produção.

## Backend
- [x] projeto Supabase de produção confirmado: CIA Evidências (naaqdwjtastjnckizfqd)
- [x] RLS revisada para memberships, visits, photo_tasks, evidences e store_assignments
- [x] session_guard/subscription_guard confirmados como políticas RESTRICTIVE
- [x] políticas do bucket privado cia-evidencias revisadas
- [x] limite do bucket cia-evidencias confirmado em 20 MB e somente imagens permitidas
- [x] grants de UPDATE corrigidos para visits e evidences, mantendo autorização por RLS
- [x] correção registrada na migration cia_campo_authenticated_update_grants
- [x] Supabase Security Advisor sem vulnerabilidade crítica aplicável
- [ ] proteção contra senhas vazadas habilitada no Supabase Auth
- [ ] session-gate validado em aparelho real
- [ ] plano/serviço field_enabled testado com usuário Promotor real
- [ ] isolamento entre Ambientes testado com usuários reais distintos
- [ ] upload real → fila BKO → Aprovar/Ajustar/Reprovar testado de ponta a ponta

## Testes Android
- [ ] login/logout
- [ ] sessão única
- [ ] check-in online/offline
- [ ] câmera permitida/negada
- [ ] localização permitida/negada
- [ ] foto online/offline
- [ ] retry sem duplicação
- [ ] reinício do app com fila pendente
- [ ] check-out online/offline
- [ ] atualização da agenda
- [ ] rede móvel lenta
- [ ] Android 7 e Android 16

## Play Console
- [ ] conta de desenvolvedor verificada
- [ ] App criado com ID com.usecia.campo
- [ ] App Signing habilitado
- [ ] credencial/chave de upload de produção configurada no EAS
- [ ] AAB de produção assinado enviado
- [ ] ficha da loja revisada
- [x] ícone 512×512 gerado
- [x] feature graphic 1024×500 gerada
- [x] 4 screenshots geradas
- [x] política de privacidade preparada
- [x] documentação de Data Safety preparada
- [x] política de privacidade confirmada publicamente acessível em produção
- [ ] Data Safety preenchido no Console
- [ ] classificação de conteúdo
- [ ] público-alvo
- [ ] acesso ao app fornecido ao time de revisão (credencial de teste)
- [ ] teste interno concluído
- [ ] teste fechado/produção conforme elegibilidade da conta

## Configuração e publicação — 25/10/2026

- Proprietária Google: `wagner.costa@usecia.com`.
- Estratégia autorizada: conta pessoal temporária; converter para organização após obtenção do D-U-N-S e verificação da empresa.
- Nome público: CIA Gestão de Evidências. App: CIA Campo. Package obrigatório: `com.usecia.campo`.
- Conta Google Play Developer concluída e liberada em 26/10/2026 segundo confirmação do proprietário; criação/configuração do registro do app e App Signing ainda devem ser validadas antes do AAB final.
- Login no Expo iniciado com a conta corporativa, mas a verificação Google por SMS permanece pendente.
- `https://app.usecia.com/privacidade.html` e `https://app.usecia.com/suporte.html` publicadas e verificadas no navegador, com contato `wagner.costa@usecia.com`.
- Fontes das páginas preservadas nesta branch; páginas estáticas também publicadas diretamente em `gh-pages`, sem merge em `main`.
- Portal oficial D&B para desenvolvedores Google encaminha o Brasil para a CIAL Dun & Bradstreet. Consulta/solicitação ainda sem envio confirmado e sem protocolo.
- Não criar uma segunda Conta Google nem enviar o AAB de compilação do CI.
- Primeiro release: AAB novo assinado com credenciais de produção, trilha interna e rascunho, conforme `eas.json`.
- Produção depende da validação do binário final, testes Android reais e acesso de revisão.

Conversão futura: https://support.google.com/googleplay/android-developer/answer/16260648
O Google orienta verificar o site, vincular perfil empresarial verificado e aguardar pelo menos 72 horas após a conversão antes de enviar novos apps.
