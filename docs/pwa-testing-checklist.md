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

## Service worker e atualização

- [ ] Fazer deploy de uma nova versão e confirmar que `skipWaiting`/`clientsClaim` ativam a versão nova.
- [ ] Confirmar que `/auth/v1/*` nunca aparece em cache storage.
- [ ] Confirmar que pedidos `POST`, `PUT`, `PATCH` e `DELETE` não aparecem em cache storage.
- [ ] Confirmar que assets estáticos podem ser carregados do cache.
- [ ] Confirmar que nenhuma rota privada é incluída no sitemap ou `llms.txt`.
