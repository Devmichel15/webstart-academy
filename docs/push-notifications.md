# Notificações Web Push — guia de configuração e operação

Documento de referência da **Etapa 2** (notificações push) da WebStart Academy.
Descreve o que é preciso configurar, como testar e o que está (e não está)
implementado.

---

## 1. Como funciona (visão geral)

```
Browser (perfil → separador "Notificações")
  │  1. Notification.requestPermission()        ← só por clique explícito
  │  2. registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLICA })
  │  3. POST /functions/v1/push-subscribe        ← grava o dispositivo
  ▼
Supabase (Postgres)
  ├─ public.push_subscriptions   (endpoint + chaves = segredo do dispositivo)
  └─ public.push_preferences     (consentimento + categorias da conta)
  ▲
Supabase Edge Functions
  ├─ push-subscribe  → subscribe / unsubscribe / list
  └─ push-send       → envia a notificação de teste (VAPID)
  ▼
Push service (FCM / Mozilla autopush / WNS) → Service Worker → notificação
```

Regras que valem em todo o sistema:

- A **chave privada VAPID** só existe nos secrets da Edge Function. O frontend
  só conhece a chave **pública**.
- A permissão **nunca** é pedida sozinha: só no clique em "Ativar notificações".
- Um destino de notificação tem de ser um **caminho interno** (`/perfil`,
  `/comunidade`). URLs absolutas e `//host` são recusados.
- As subscrições são **segredos**: o cliente não tem acesso à tabela; quem
  lê/escreve é a Edge Function com service role, depois de validar o JWT.

### Convite no onboarding e antes do registo

- No fim do carrossel público (`/onboarding`), o aluno pode escolher ativar as
  notificações ou continuar sem elas. A permissão do browser só é pedida depois
  de clicar em **Ativar notificações**.
- Se ainda não tiver conta, a subscrição fica apenas no Service Worker do
  dispositivo e é marcada localmente como pendente; nenhum endpoint ou chave da
  subscrição é guardado em `localStorage`.
- Depois da autenticação, a aplicação associa a subscrição à conta e ativa a
  preferência push. A marca pendente expira após 24 horas.
- Contas existentes sem permissão recebem o mesmo convite ao entrar na área da
  plataforma. A opção **Talvez mais tarde** adia o convite por sete dias.

### Histórico no sininho

- Os eventos automáticos enviados pelo `push-dispatch` também ficam guardados
  na caixa de notificações da conta quando as notificações push e a categoria
  estão ativas, mesmo que não haja um dispositivo push registado.
- O sininho mostra as 30 notificações mais recentes e o total de não lidas;
  abrir uma notificação marca-a como lida e navega para o respetivo destino.
- As notificações são privadas por conta (RLS) e sincronizam entre dispositivos.
  Eventos push manuais de teste não entram no histórico.
- As conclusões de aulas são detetadas tanto quando o progresso é inserido
  pela primeira vez como quando uma linha existente passa a concluída.

---

## 2. Gerar as chaves VAPID

Precisa de um par de chaves (pública/privada) do serviço de push. Duas opções,
sem serviços pagos:

```bash
# Opção A — com Node (npm)
npx web-push generate-vapid-keys

# Opção B — com Deno (o runtime das Edge Functions)
deno run -A npm:@mmmike/web-push@1.3.0/vapid
```

Guarde os três valores:

| Valor | Onde vai |
| --- | --- |
| chave pública | secret `VAPID_PUBLIC_KEY` **e** `.env` do frontend (`VITE_VAPID_PUBLIC_KEY`) |
| chave privada | secret `VAPID_PRIVATE_KEY` (nunca sai do servidor) |
| `subject` (mailto: ou https:) | secret `VAPID_SUBJECT` |

> A chave pública tem de ser **a mesma** nos dois lados. Se divergir, o
> `pushManager.subscribe()` falha com `InvalidAccessError` e o envio dá 401.

---

## 3. Configurar o projecto Supabase

### 3.1 Secrets

```bash
supabase secrets set VAPID_PUBLIC_KEY=<chave pública> \
                  VAPID_PRIVATE_KEY=<chave privada> \
                  VAPID_SUBJECT=mailto:admin@webstart.academy
```

Opcional (recomendado em produção): restringir os serviços de push aceitos.

```bash
supabase secrets set PUSH_ENDPOINT_ALLOWLIST=fcm.googleapis.com,updates.push.services.mozilla.com
```

### 3.2 Frontend (`.env` local e variáveis do deploy)

```
VITE_VAPID_PUBLIC_KEY=<chave pública>
```

### 3.3 Base de dados

As migrations `022_push_notifications.sql`, `026_in_app_notifications.sql` e
`028_fix_lesson_push_dispatch.sql` criam as subscrições/preferências, o
histórico do sininho e corrigem o trigger de aulas e o URL de fallback do
dispatcher. Em projetos cuja tabela de histórico de migrations não esteja
configurada, não executar `supabase db push`: o comando pode tentar reaplicar
migrations antigas. As migrations 026 e 028 foram aplicadas diretamente no
projeto de produção.

---

## 4. Deploy das Edge Functions

```bash
supabase functions deploy push-subscribe
supabase functions deploy push-send
supabase functions deploy push-dispatch --no-verify-jwt
```

A pasta `supabase/functions/_shared/` **não** é deployed (o CLI ignora o que
começa por `_`): é apenas o módulo comum importado pelas duas funções.
`push-dispatch` autentica os pedidos internos através de `PUSH_DISPATCH_SECRET`;
por isso, a verificação JWT da gateway fica desativada nessa função.

### Biblioteca de envio

`supabase/functions/_shared/sender.ts` escolhe a biblioteca em runtime:

1. **`@mmmike/web-push@1.3.0`** (primária) — ESM, zero dependências, usa a Web
   Crypto nativa do Deno, implementa RFC 8291/8292.
2. **`web-push@3.6.7`** (fallback) — caso a primária não carregue no runtime.

A resposta de `push-send` devolve `library` com o nome da biblioteca usada,
para diagnóstico:

```json
{ "ok": true, "delivered": 1, "total": 1, "library": "@mmmike/web-push" }
```

Nenhuma das duas é instalada no `package.json` do frontend: só as Edge
Functions as usam.

---

## 5. Teste manual

1. `npm run dev` (ou a app em produção, com HTTPS obrigatório para push).
2. Entar numa conta e abrir **Perfil → Notificações**.
3. Premir **Ativar notificações** → aceitar a permissão do browser.
4. Premir **Notificação de teste** → a notificação deve chegar em segundos.

Plataformas:

| Plataforma | Requisito |
| --- | --- |
| Android / Chrome | nada de especial (Chrome 80+, Samsung Internet) |
| iOS / Safari 16.4+ | **app instalada** (Adicionar ao ecrã principal) e aberta a partir do ícone |
| Desktop | Chrome/Edge; no Firefox é preciso ativar `dom.webnotifications.enabled` |

Checklist completo em `docs/pwa-testing-checklist.md`.

### Limites conhecidos

- O envio de teste tem um **cooldown de 60 s** por conta (`429` no segundo
  envio imediato).
- No iOS, se a PWA não estiver instalada, o ecrã explica o que falta e a
  ativação falha — é uma limitação do sistema, não da implementação.
- Um endpoint que responde `404`/`410` é apagado automaticamente (o push
  service já não o conhece).

---

## 6. Segurança

| Ameaça | Mitigação |
| --- | --- |
| Cliente a escrever subscrições alheias | Tabela sem policies; `revoke all` a `anon`/`authenticated`; escrita só via service role depois de validar o JWT |
| Cliente a ler o endpoint de outro utilizador | RPC `list_push_devices` devolve apenas metadados (plataforma, user agent, datas) — nunca `endpoint`/`p256dh`/`auth` |
| SSRF (servidor fazer POST num endpoint escolhido pelo cliente) | `isSafeEndpoint`: só `https`, sem hosts privados/locais, allowlist opcional |
| Notificação levar o utilizador para fora do site | `isInternalPath` no servidor, no frontend e no Service Worker |
| Envio de spam | `push-send` só envia para o próprio utilizador (`targetUserId` diferente → `403`), respeita as preferências e o cooldown |
| Chave privada exposta | Vive só nos secrets; o frontend só recebe a chave pública |
| Preferências adulteradas | `upsert_push_preferences` valida a whitelist de chaves, os tipos e os intervalos |

> Aviso: se existir uma variável `VITE_SUPABASE_SERVICE_ROLE_KEY` no `.env`,
> ela é **incluída no bundle do cliente** (o prefixo `VITE_` publica tudo o que
> precede). A service role key nunca deve ter esse prefixo.

---

## 7. O que ainda não existe (Etapa 3)

- Envio agendado (lembretes de streak, "continua a tua trilha", etc.).
- Broadcast para outros utilizadores (o `push-send` hoje é só para o próprio).
- Notificações disparadas por eventos da aplicação (comentário, like,
  resposta numa trilha).
- Preferências por categoria com horários diferentes do que existe hoje
  (`reminder_hour` / `reminder_days` já estão guardados, mas nada os usa).

O que já está preparado para a Etapa 3: colunas `reminder_hour`/`reminder_days`
nas preferências, `last_test_sent_at` para cooldown, e a categoria `reminders`
já existente nas preferências e no payload.
