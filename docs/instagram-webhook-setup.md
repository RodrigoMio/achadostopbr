# Instagram Comment-to-DM — configuração (Meta + Render)

Publicar no feed funciona pelo **localhost**; o Direct automático só funciona quando a **Meta envia webhooks para o servidor em produção** (`https://www.achadostopbr.com.br`).

## 1. Variáveis no Render (obrigatório)

No serviço que responde por `www.achadostopbr.com.br`, defina:

| Variável | Exemplo / nota |
|----------|----------------|
| `META_ACCESS_TOKEN` | Token da **Página** AchadosTopbr (não user token curto) |
| `META_APP_SECRET` | App Dashboard → Configurações → Básico → Chave secreta |
| `META_WEBHOOK_VERIFY_TOKEN` | String inventada por você (mesma do passo 2) |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | `17841471361183043` |
| `FACEBOOK_PAGE_ID` | `1377709582095054` |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Mesmo projeto do admin |
| `PUBLIC_APP_URL` | `https://www.achadostopbr.com.br` |

Depois: **Save** → **Redeploy**.

No `.env` local (só para publicar): copie as mesmas chaves Meta/Supabase; webhook **não** roda no localhost.

## 2. Meta for Developers — Webhooks

App: **Achados Top Br API**.

1. **Webhooks** (ou Instagram → Webhooks).
2. **URL de callback** (use uma):
   - `https://www.achadostopbr.com.br/webhook`
   - `https://www.achadostopbr.com.br/api/webhook`
3. **Verify token**: igual a `META_WEBHOOK_VERIFY_TOKEN` no Render.
4. **Verificar e salvar** (check verde).
5. Assinar o campo **`comments`** para a conta Instagram `@achadostopbr.ofertas` / ID `17841471361183043`.

### Token para Direct

`META_ACCESS_TOKEN` no Render = `access_token` da Página via:

```http
GET /v21.0/me/accounts?fields=id,name,access_token,instagram_business_account
```

Permissões: `instagram_manage_messages`, `instagram_manage_comments`, `instagram_content_publish`.

## 3. Supabase

Execute `supabase/migrations/008_instagram.sql` se ainda não rodou.

Após publicar um produto:

```sql
SELECT id_product, ig_media_id, published_at FROM instagram_post ORDER BY published_at DESC LIMIT 5;
```

## 4. Teste do comment-to-DM

1. Publicar post (localhost ou produção).
2. Com **conta Instagram pessoal** (não a comercial), comentar `QUERO` no post.
3. Logs no Render: `POST /webhook` 200 e linhas `[Instagram] webhook`.
4. Supabase:

```sql
SELECT ig_comment_id, comment_text, dm_status, dm_error, created_at
FROM instagram_comment_dm ORDER BY created_at DESC LIMIT 10;
```

5. No painel autenticado: `GET /api/instagram/webhook-status`

## 5. Diagnóstico rápido

| Sintoma | Causa provável |
|---------|----------------|
| Nenhum `POST /webhook` nos logs | Webhook não configurado na Meta ou URL errada |
| POST 403 | `META_APP_SECRET` errado no Render |
| GET verificação falha | `META_WEBHOOK_VERIFY_TOKEN` diferente entre Meta e Render |
| `unknown_media` nos logs | Post não gravado em `instagram_post` |
| `own_comment` | Comentário pela conta `@achadostopbr.ofertas` |
| `dm_status = failed` | Token/permissão; ver `dm_error` |

Modo **Desenvolvimento** da app: teste com contas com papel na app ou publique a app (Live).
