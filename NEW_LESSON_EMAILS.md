# New Lesson Email Notifications

Sistema automatico de notificacao por e-mail quando uma nova aula e publicada na WebStart Academy.

## Arquitetura

```
Admin cria aula no Firestore
        |
        v
lessons/{lessonId} document created
        |
        v
Cloud Function: onNewLessonPublished
        |
        +--> Verifica notificationSent (evita duplicados)
        |
        +--> Obtem nome do curso (courses/{courseId})
        |
        +--> Busca todos os utilizadores com email
        |
        +--> Envia emails em lotes via Brevo API
        |
        +--> Marca aula com notificationSent: true
```

## Estrutura de arquivos

```
functions/
  index.js                          # Cloud Function (onNewLessonPublished)
  services/
    brevo.js                        # Cliente Brevo API (sendEmail)
    notifications.js                # Logica de envio em lotes
    users.js                        # Consultas de utilizadores (existente)
  templates/
    newLesson.js                    # Template HTML do email
    reactivation.js                 # Template de reativacao (existente)
```

## Fluxo completo

1. **Admin cria aula** — Grava o documento na colecao `lessons/{lessonId}` no Firestore
2. **Trigger dispara** — `onDocumentCreated('lessons/{lessonId}')` executa automaticamente
3. **Verificacao de duplicados** — Se `notificationSent` ja e `true`, a funcao para
4. **Dados da aula** — Titulo, courseId sao lidos do documento criado
5. **Nome do curso** — Resolvido via `courses/{courseId}`
6. **Utilizadores elegiveis** — Todos os utilizadores com campo `email` nao vazio
7. **Envio em lotes** — 50 utilizadores por lote, 1s de pausa entre lotes
8. **Marcacao** — Aula e marcada com `notificationSent: true` e `notificationSentAt`

## Campos adicionados ao documento da aula

Apos o envio bem-sucedido, o documento da aula e atualizado com:

```js
{
  notificationSent: true,
  notificationSentAt: Timestamp,    // serverTimestamp
  notificationStats: {
    sent: Number,                    // emails enviados com sucesso
    errors: Number,                  // falhas no envio
    total: Number,                   // total de utilizadores elegiveis
  }
}
```

## Destinatarios

- Todos os utilizadores na colecao `users` que possuam um campo `email` nao vazio
- Nao ha filtragem por role, status ou nivel de atividade
- O e-mail e enviado para o endereco registrado no perfil do utilizador

## Template do e-mail

O template `newLesson.js` inclui:

- Header com titulo "Nova aula disponivel!"
- Saudacao personalizada com primeiro nome
- Nome da trilha/curso
- Titulo da nova aula
- Mensagem de incentivo
 botao "Assistir Agora" com link direto para a aula
- Rodape da WebStart Academy

Link direto: `{APP_URL}/aula/{lessonId}`

## Seguranca

- **Duplicados**: Campo `notificationSent` impede reenvio para a mesma aula
- **Edicoes**: Edicoes posteriores nao disparam notificacoes (o trigger e `onCreate`, nao `onUpdate`)
- **Falhas individuais**: Erro no envio para um utilizador nao interrompe os restantes
- **Brevo API**: Falhas sao capturadas e logadas, sem interromper a execucao

## Performance

- Envio sequencial em lotes de 50 utilizadores
- Pausa de 1 segundo entre lotes para respeitar limites da API Brevo
- Preparado para crescimento (mudar BATCH_SIZE se necessario)

## Como testar

### Localmente (Firebase Emulator)

```bash
cd functions
npm install
firebase emulators:start --only functions,firestore
```

Criar um documento de teste no Firestore:

```bash
firebase firestore:set lessons/test-lesson-001 '{
  "id": "test-lesson-001",
  "courseId": "html",
  "moduleId": "html-fundamentals",
  "title": "Aula de Teste - Notificacao",
  "slug": "test-lesson-001",
  "order": 99,
  "estimatedTime": 10
}'
```

### Em producao

```bash
firebase deploy --only functions
```

Criar a aula normalmente via `seedFirestore.js` ou painel admin. A Cloud Function dispara automaticamente.

### Verificar logs

```bash
firebase functions:log --only onNewLessonPublished
```

## Como adicionar novas aulas (processo automatico)

1. Grava a aula
2. Faz upload para YouTube (Nao listado)
3. Envia prompt para adicionar a aula a plataforma
4. O sistema cria o documento em `lessons/{lessonId}`
5. A Cloud Function deteta a criacao e envia os emails
6. Nenhuma accao adicional necessaria

## Como adicionar novos templates

1. Criar novo ficheiro em `functions/templates/`
2. Exportar funcao que retorna HTML
3. Importar em `functions/index.js`
4. Criar nova Cloud Function com o trigger adequado
5. Reutilizar `sendNewLessonNotifications()` do `services/notifications.js`

## Variavel de ambiente

| Variavel | Descricao | Default |
|---|---|---|
| `APP_URL` | URL base da plataforma | `https://webstart-academy.web.app` |
| `BREVO_API_KEY` | Chave da API Brevo | — |
| `VITE_API_KEY_BREVO` | Fallback da chave Brevo | — |
