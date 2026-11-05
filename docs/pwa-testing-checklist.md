# PWA e autenticação: checklist manual

Executar este checklist sempre que o service worker, a autenticação ou as chamadas de API forem alterados.

## Preparação

- [ ] Criar um perfil/incognito limpo.
- [ ] Confirmar que a aplicação abre com Wi-Fi ligado.
- [ ] Instalar a PWA pelo browser e abrir pelo ícone standalone.
- [ ] Confirmar no DevTools que o service worker está `activated` e controla a página.
- [ ] Repetir os testes com a aplicação aberta numa aba normal do browser.

## Rede ligada

- [ ] PWA recém-instalada: criar uma conta nova por email.
- [ ] PWA recém-instalada: entrar com uma conta existente por email.
- [ ] PWA recém-instalada: iniciar OAuth Google e concluir o retorno.
- [ ] PWA já usada há dias: criar uma conta nova por email.
- [ ] Fazer logout e confirmar que a sessão é removida.
- [ ] Pedir recuperação de password e confirmar a resposta do backend.
- [ ] Submeter progresso, quiz, exercício e mini-projeto.
- [ ] Editar perfil e confirmar que a alteração persiste após recarregar.
- [ ] Confirmar que erros 4xx/5xx mostram a mensagem do backend, não “estás offline”.
- [ ] Confirmar no console que falhas de auth registam operação, erro e estado de rede.

## Rede desligada

- [ ] Desligar Wi-Fi/dados ou usar DevTools Offline antes de cada pedido.
- [ ] Signup, login, OAuth e recuperação de password mostram a mensagem de offline.
- [ ] Logout e todas as escritas de dados não são servidos por cache.
- [ ] Leituras com cache permitido podem mostrar dados antigos apenas quando aplicável.
- [ ] A navegação mostra a página offline quando não existe resposta em cache.
- [ ] Ligar a rede novamente e confirmar que os pedidos seguintes funcionam sem limpar a instalação.

## Convite de instalação (boas-vindas)

- [ ] Criar uma conta nova: o convite “Leva a WebStart contigo” aparece depois do registo.
- [ ] No Android/Chrome: o botão “Instalar WebStart” abre o diálogo nativo do sistema.
- [ ] Aceitar a instalação: o convite e o banner inferior desaparecem; abrir pelo ícone e confirmar o modo standalone.
- [ ] Recusar o diálogo nativo: o convite não volta a aparecer nesse dispositivo; `/instalar-app` continua disponível.
- [ ] No iPhone/iPad (Safari): o convite mostra as instruções Partilhar → Adicionar ao ecrã principal e não promete instalação.
- [ ] Já com a app instalada: o convite não aparece em modo standalone.
- [ ] Entrar com uma conta antiga: o convite não aparece.
- [ ] Reabrir a aplicação no dia seguinte: o convite não se repete.
- [ ] Recusar em “Continuar no navegador”: a app continua utilizável e o utilizador pode sempre instalar depois.

## Service worker e atualização

- [ ] Fazer deploy de uma nova versão e confirmar que `skipWaiting`/`clientsClaim` ativam a versão nova.
- [ ] Confirmar que `/auth/v1/*` nunca aparece em cache storage.
- [ ] Confirmar que pedidos `POST`, `PUT`, `PATCH` e `DELETE` não aparecem em cache storage.
- [ ] Confirmar que assets estáticos podem ser carregados do cache.
- [ ] Confirmar que nenhuma rota privada é incluída no sitemap ou `llms.txt`.

## Notificações push (Web Push)

- [ ] Abrir `/perfil` → separador “Notificações”: o ecrã aparece **sem** o browser pedir permissão.
- [ ] Premir “Ativar notificações”: o browser pede permissão e, ao aceitar, a notificação de teste chega.
- [ ] Recusar a permissão: o ecrã mostra a recusa e nada fica registado no servidor.
- [ ] No iPhone/iPad (Safari): sem a app instalada, o ecrã explica que é preciso instalar a PWA; com a app instalada, a ativação funciona.
- [ ] Premir “Desativar neste dispositivo”: o pedido do browser passa a “denied” e o dispositivo desaparece da lista.
- [ ] Desligar uma categoria: a preferência é guardada e a notificação de teste da categoria desativada não é enviada.
- [ ] “Notificação de teste” duas vezes seguidas: a segunda dá erro de cooldown (60 s).
- [ ] Premir a notificação: a aplicação abre/foca no caminho interno indicado (nunca num site externo).
- [ ] Fechar e reabrir a aplicação: a subscrição continua ativa (a lista de dispositivos mantém-se).
- [ ] No DevTools → Application → Service Workers: confirmar que a chave pública VAPID usada no frontend é igual à do secret `VAPID_PUBLIC_KEY`.
