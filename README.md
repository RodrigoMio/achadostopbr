# Afiliados WhatsApp

Painel Next.js para gestão de produtos de afiliados, autenticação por QR Code (Baileys) e vitrine pública por `slug`.

A publicação automática em grupos do WhatsApp fica para uma fase seguinte. Nesta versão o Gemini gera título, descrição e preço; o afiliado decide o que aparece na vitrine.

## Requisitos

- Node.js 20+
- Conta WhatsApp para pareamento (QR Code)
- Projeto Supabase com as tabelas `status`, `users`, `platform`, `category` e `product`
- Chave de API do Google Gemini

## 1. Ajustar o banco (obrigatório)

No SQL Editor do Supabase, execute:

`supabase/migrations/001_adjust_schema.sql`  
`supabase/migrations/002_users_prompt_ia.sql`  
`supabase/migrations/003_product_title_nullable.sql`  
`supabase/migrations/004_product_whatsapp_group_name.sql`  
`supabase/migrations/005_user_group_and_product_sent.sql`  
`supabase/migrations/006_whatsapp_groups.sql`  
`supabase/migrations/007_users_catalog_default.sql`

O script `001`:

- Corrige tipos de URL (`TEXT`) e o nome `updates_at` → `updated_at`
- Adiciona `whatsapp_group_invite_url` e `whatsapp_group_jid` em `users`
- Cria índices e RLS
- Garante `whatsapp_jid` único

Cadastre o afiliado **antes** do primeiro login. O JID deve ficar no formato:

`5511999999999@s.whatsapp.net`

Com `id_status = 1` (Ativo) e um `slug` único (ex.: `rodrigo`). A vitrine fica em `/rodrigo`. Marque **um** afiliado com `default_catalog = true` para a home `/` redirecionar para essa vitrine.

Os CTAs de grupos na vitrine levam a `/{slug}/groups`. A coluna `whatsapp_group_invite_url` não é utilizada pelo app.

Não use slugs reservados: `admin`, `products`, `api`.

## 2. Configuração local

```bash
npm ci
copy .env.example .env
```

Variáveis:

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta HTTP (padrão `3000`) |
| `AUTH_PATH` | Pasta da sessão Baileys (`auth_info`) |
| `SESSION_SECRET` | Segredo do cookie do painel (string longa) |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (somente servidor) |
| `GEMINI_API_KEY` | Chave do Gemini |
| `GEMINI_MODEL` | ID do modelo (padrão `gemini-3.6-flash`). `auto` → alias `gemini-flash-latest` |
| `GEMINI_MODEL_FALLBACKS` | Opcional: modelos alternados se o principal falhar (503/404) |

```bash
npm run dev
```

Abra `http://localhost:3000/admin`, escaneie o QR Code com o WhatsApp do número cadastrado e o painel abre.

## Rotas

| Rota | Função |
|------|--------|
| `/` | Redirect para a vitrine com `default_catalog` |
| `/admin` | QR (sem sessão) e painel (com sessão) |
| `/products` | Gestão de produtos |
| `/[slug]` | Vitrine pública |
| `/[slug]/groups` | Landing de grupos WhatsApp |
| `GET /api/health` | Saúde do processo e estado do WhatsApp |

## Fluxo de produtos

1. Em **Produtos**, configure **Prompt para IA** (gravado em `users.prompt_ia`).
2. **Novo produto** grava com status `4` (Gerar IA), **sem** chamar o Gemini.
3. **Gerar IA** (só com status 4) envia o **prompt do utilizador** (`users.prompt_ia`) ao Gemini (modo JSON), anexa automaticamente o **`product_link`** do produto, e espera JSON com `Titulo` e `Descricao`. `Titulo` grava em `product.title` (se ainda for `NULL`/vazio; caso contrário mantém o título já definido). `Descricao` grava em `product.ia_description`; status passa para `5` (A Divulgar). Resposta inválida → erro 500.
4. **Mostrar na vitrine** → status `6` (Divulgado). Só estes aparecem em `/[slug]`.
5. A vitrine filtra pela janela `users.days_limit_show_product` usando `product.updated_at`.

Sem prompt salvo, **Gerar IA** é bloqueado. Preço `R$ 0,00` não é exibido na vitrine.

### Exemplo de prompt (JSON)

Configure em **Prompt para IA**. Não é necessário colar o URL do produto no prompt — o sistema injeta `product_link` ao gerar.

```
Sua tarefa é gerar um json com textos para envio no grupo do WhatsApp contendo 2 chaves:
Chave "Titulo": Nome do produto extraído do link do produto
Chave "Descricao": Uma frase curta, criativa e bem-humorada sobre o produto, criando um desejo de compra
Regras estritas:
- Retorne EXCLUSIVAMENTE um objeto JSON com as chaves Titulo e Descricao, sem blocos de código.
```

## Gemini: modelo e “versão da API”

A chave (`GEMINI_API_KEY`) **não** traz número de versão. O SDK chama sempre o endpoint **`v1beta`**; o que você escolhe é o **ID do modelo** na URL `.../v1beta/models/{model}:generateContent`. Isso é obrigatório — não existe geração sem `model`.

Documentação: [Models API (list)](https://ai.google.dev/api/models), [modelos Gemini](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash).

Para ver quais modelos **a sua chave** aceita para `generateContent`:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=SUA_GEMINI_API_KEY"
```

Alguns IDs aparecem na lista mas **não geram mais** (ex.: `gemini-2.5-flash` → 404 “no longer”). Prefira modelos atuais como `gemini-3.6-flash` ou `gemini-3.5-flash-lite`. O app tenta `GEMINI_MODEL` e depois `GEMINI_MODEL_FALLBACKS` se houver 503/404.

## Troubleshooting (SSL no Windows)

Se `/products` ou o Supabase falharem com `unable to verify the first certificate` ou `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, o antivírus ou proxy local pode estar interceptando HTTPS. Em **desenvolvimento**, adicione ao `.env`:

```
TLS_INSECURE_DEV=true
```

Reinicie `npm run dev`. **Não use em produção** — no VPS o certificado costuma funcionar normalmente.

## Segurança

- Nunca commite `.env` ou `auth_info/`.
- A `SUPABASE_SERVICE_ROLE_KEY` não vai para o browser. Todas as queries passam pelo servidor.
- RLS impede escrita anônima e esconde `users.whatsapp_jid` do papel `anon`.

## Deploy

**Não publique na Vercel** (nem Netlify, Cloudflare Workers ou outro serverless).

### Etapa atual: só a vitrine no Render

O admin e o WhatsApp ficam no **localhost** (`npm run dev`). O Render serve `/`, `/{slug}` e `/{slug}/groups` lendo o Supabase.

1. `PUBLIC_ONLY=true` no Render. **Não** defina isso no `.env` local.
2. Variáveis: `HOSTNAME=0.0.0.0`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET` (string longa). Sem disco, sem `AUTH_PATH`, sem `TLS_INSECURE_DEV`. Gemini opcional na vitrine.
3. **Nunca** escaneie QR no domínio público (admin/QR só em `http://localhost:3000/admin`).
4. No Supabase: `default_catalog = true` em um afiliado ativo para `/` redirecionar.
5. PC ligado só para gerar IA, publicar produto ou enviar nos grupos.

O `server.js` não inicia o Baileys quando `PUBLIC_ONLY=true`.

### Render (vitrine — passo a passo)

1. Conta em [render.com](https://render.com) (login com GitHub).
2. **New → Blueprint** e aponte para este repo (`render.yaml`) **ou** **New → Web Service** → repo → **Docker**.
3. Plano **Starter** (evite free que hiberna após inatividade).
4. Health check: `/api/health`.
5. Environment (se não usar Blueprint): `PUBLIC_ONLY=true`, `NODE_ENV=production`, `HOSTNAME=0.0.0.0`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`.
6. Deploy. Teste `/`, `/{slug}` e `/{slug}/groups`. Health: `"publicOnly": true`.

### WhatsApp 24h no host (fase seguinte)

Processo Node 20 contínuo, **uma instância**, volume em `AUTH_PATH`, **sem** `PUBLIC_ONLY`. Health check: `GET /api/health`. Ver `docker-compose.yml`, `fly.toml` ou Railway com volume.

### Railway (alternativa)

Mesmas variáveis da vitrine, `Dockerfile`, 1 réplica, **sem volume**. Serverless off.

### Fly.io

```bash
fly launch --no-deploy
fly volumes create auth_info --size 1 --region gru
fly secrets set SESSION_SECRET=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... GEMINI_API_KEY=...
fly deploy
```

O `fly.toml` deixa a máquina sempre ligada (`auto_stop_machines = "off"`) e monta o volume em `/data` (`AUTH_PATH=/data/auth_info`). Troque `app` e `primary_region` se precisar.

### VPS (Hetzner, DigitalOcean, Contabo)

Com Docker no servidor:

```bash
cp .env.example .env
# edite .env
docker compose up -d --build
```

O `docker-compose.yml` sobe **uma** réplica, escuta em `0.0.0.0` e persiste `auth_info` num volume nomeado.

Sem Docker: Node 20, `npm ci && npm run build && npm start`, pasta persistente em `AUTH_PATH`, e `systemd` (ou equivalente) para o processo não morrer no logout.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento (watch + Baileys) |
| `npm run build` | Build de produção do Next.js |
| `npm start` | Produção (`node server.js`, exige build) |
