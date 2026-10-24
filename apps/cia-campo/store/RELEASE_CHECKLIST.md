# CIA Campo — Release Gate

Uma versão só deve avançar para produção quando todos os itens abaixo estiverem concluídos.

## Código
- [ ] CI verde: dependências Expo alinhadas
- [ ] Expo Doctor sem erro
- [ ] TypeScript sem erro
- [ ] export Android concluído
- [ ] nenhum segredo no bundle
- [ ] pacote Android confirmado: com.usecia.campo
- [ ] versionCode incrementado

## Backend
- [ ] projeto Supabase de produção confirmado
- [ ] RLS revisada para memberships, visits, photo_tasks, evidences e store_assignments
- [ ] políticas do bucket cia-evidencias revisadas
- [ ] session-gate validado em aparelho real
- [ ] plano/serviço field_enabled testado
- [ ] isolamento entre Ambientes testado
- [ ] upload e leitura pelo BKO testados de ponta a ponta
- [ ] Supabase Security Advisor sem vulnerabilidade crítica aplicável

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
- [ ] AAB de produção enviado
- [ ] ficha da loja revisada
- [ ] ícone 512×512
- [ ] feature graphic 1024×500
- [ ] 4+ screenshots
- [ ] política de privacidade pública
- [ ] Data Safety preenchido
- [ ] classificação de conteúdo
- [ ] público-alvo
- [ ] acesso ao app fornecido ao time de revisão (credencial de teste)
- [ ] teste interno concluído
- [ ] teste fechado/produção conforme elegibilidade da conta
