# Google Play — Data Safety (base para preenchimento)

> Validar no Play Console contra a versão final do binário e os contratos comerciais/privacidade vigentes.

## Dados tratados pelo app

### Informações da conta
- e-mail do usuário;
- nome de exibição;
- identificadores internos de usuário/Ambiente.

Finalidade: autenticação, autorização e funcionamento da conta corporativa.

### Fotos
- evidências capturadas pelo próprio usuário durante a visita.

Finalidade: funcionalidade principal do app / comprovação da execução.

Armazenamento local: temporário, no sandbox privado do aplicativo, enquanto aguarda envio. O arquivo local é removido após sincronização confirmada.

### Localização
- latitude/longitude no momento do check-in;
- latitude/longitude no momento do check-out.

Finalidade: registrar o contexto da visita.

O app não coleta localização continuamente nem em segundo plano.

### Diagnóstico técnico
O código atual não inclui SDK próprio de anúncios, analytics de terceiros ou rastreamento publicitário.

## Trânsito e proteção

- comunicação com Supabase via HTTPS;
- acesso autenticado;
- segregação esperada por Ambiente via RLS;
- chave cliente é publishable/public; nenhuma chave secreta é embarcada;
- fotos ficam em bucket privado e são consumidas pelo CIA por URL assinada.

## Compartilhamento
O CIA Campo não foi desenhado para vender dados ou compartilhar dados com redes de publicidade. Dados operacionais são processados para prestar o serviço contratado e armazenados na infraestrutura de backend do CIA/Supabase conforme a política de privacidade.

## Exclusão
Como o aplicativo não oferece criação pública de conta, o ciclo de conta é administrado pela organização cliente/administrador do CIA. Solicitações de privacidade devem seguir o canal informado na política publicada em https://app.usecia.com/privacidade.html.

## Permissões do Android
- CAMERA
- ACCESS_COARSE_LOCATION
- ACCESS_FINE_LOCATION
- ACCESS_NETWORK_STATE / ACCESS_WIFI_STATE (incluídas pelo módulo de rede)

Não usar:
- RECORD_AUDIO
- ACCESS_BACKGROUND_LOCATION
- FOREGROUND_SERVICE_LOCATION
