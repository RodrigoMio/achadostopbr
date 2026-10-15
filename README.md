# afiliados_whatsapp

Servidor Node.js (Express + Baileys) para enviar mensagens a grupos do WhatsApp via HTTP — ideal para automações no **Make** (texto ou post de afiliado com imagem + link).

## Requisitos

- Node.js 20+
- Conta WhatsApp para pareamento (QR Code)

## Configuração local

```bash
npm ci
cp .env.example .env   # Windows: copy .env.example .env
npm start
```

Variáveis (`.env`):

| Variável    | Descrição                          | Padrão     |
|-------------|------------------------------------|------------|
| `PORT`      | Porta do servidor HTTP             | `3000`     |
| `AUTH_PATH` | Pasta da sessão Baileys            | `auth_info`|

Na primeira execução, escaneie o **QR Code** exibido no terminal. A sessão fica em `auth_info/` (não commite essa pasta).

## API

### `GET /health`

Verifica se o HTTP está no ar.

### `POST /send-message`

Envia mensagem para um grupo. Dois modos:

`groupId` pode ser o JID completo (`...@g.us`) ou só o ID numérico.

**Respostas:**

- `200` — mensagem enviada (`mode`: `text` ou `affiliate`)
- `400` — body inválido
- `503` — WhatsApp ainda não conectado

#### Modo 1 — só texto

```json
{
  "groupId": "120363123456789012@g.us",
  "message": "Olá, grupo!"
}
```

#### Modo 2 — afiliado (imagem + texto + link)

Uma mensagem no WhatsApp: **imagem** com **legenda** (`texto` + link clicável).

```json
{
  "groupId": "120363123456789012@g.us",
  "message": "Oferta imperdível!",
  "link": "https://exemplo.com/produto?tag=afiliado",
  "imageUrl": "https://exemplo.com/imagem-produto.jpg"
}
```

Regras:

- `groupId` e `message` são sempre obrigatórios.
- Se enviar `link` ou `imageUrl`, **os dois** são obrigatórios (URLs `http`/`https`).
- `imageUrl` deve ser uma URL pública acessível pelo servidor (Baileys baixa a imagem).

Exemplos:

```bash
# Texto
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d "{\"groupId\":\"120363123456789012@g.us\",\"message\":\"Teste\"}"

# Afiliado
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d "{\"groupId\":\"120363123456789012@g.us\",\"message\":\"Confira!\",\"link\":\"https://exemplo.com/p\",\"imageUrl\":\"https://exemplo.com/img.jpg\"}"
```

### Integração com Make

1. Publique a API em um host com URL pública (Railway, Render, etc.) — `localhost` não funciona no Make sem túnel.
2. No cenário, adicione **HTTP → Make a request**.
3. Configure:
   - **URL:** `https://<seu-dominio>/send-message`
   - **Method:** `POST`
   - **Headers:** `Content-Type: application/json`
   - **Body type:** JSON (raw), por exemplo:

```json
{
  "groupId": "{{id_do_grupo}}",
  "message": "{{texto_promocional}}",
  "link": "{{link_afiliado}}",
  "imageUrl": "{{url_imagem_produto}}"
}
```

4. Mapeie os campos a partir dos módulos anteriores (planilha, e-commerce, RSS, etc.).
5. **Erros:** `503` = WhatsApp desconectado (use retry no Make); `400` = revise o JSON.

Use o **Modo 2** para posts com imagem, texto e link de afiliado.

## Segurança

- **Nunca** commite `.env` ou `auth_info/` (contêm credenciais).
- Em produção, proteja `/send-message` (API key, firewall, VPN, etc.).

## Deploy (Baileys)

Este projeto **não** roda bem em Vercel/serverless: é preciso um **processo contínuo** e **disco persistente** para `auth_info`.

Plataformas compatíveis: **Railway**, **Render**, **Fly.io** ou **VPS**.

### Passos gerais

1. Conecte o repositório GitHub ao provedor.
2. **Build:** `npm ci`
3. **Start:** `npm start`
4. **Variáveis de ambiente:** `AUTH_PATH=auth_info` (e `PORT` se o host não definir automaticamente).
5. **Volume persistente:** monte um disco no caminho `auth_info` (ou no valor de `AUTH_PATH`).
6. Abra os **logs** do serviço e escaneie o **QR Code** na primeira subida (sessão nova no servidor; não envie `auth_info` do seu PC para o Git).
7. Teste: `POST https://<seu-dominio>/send-message`.

### Railway

1. New Project → Deploy from GitHub.
2. Settings → Variables: `AUTH_PATH=auth_info`.
3. Settings → Volumes: monte em `/app/auth_info` (ou raiz do projeto + `auth_info`).
4. Deploy e pareie pelo QR nos logs.

### Render

1. New → Web Service → conecte o repo.
2. Build Command: `npm ci`
3. Start Command: `npm start`
4. Environment: `AUTH_PATH=auth_info`
5. Disk (plano com persistent disk): mount path `auth_info`.
6. Logs → QR Code na primeira execução.

### Fly.io

1. `fly launch` (ou dashboard + Dockerfile se preferir).
2. Crie volume: `fly volumes create auth_data --size 1`
3. Monte em `auth_info` no `fly.toml` e defina `AUTH_PATH=auth_info`.
4. `fly logs` para o QR.

### VPS (Ubuntu)

```bash
git clone <seu-repo>
cd afiliados_whatsapp
npm ci
cp .env.example .env
# systemd ou pm2: npm start, reinício automático
```

Mantenha `auth_info` no disco local do servidor.

## Publicar no GitHub

O repositório local já está inicializado na branch `main`. Após criar o repo vazio no GitHub (sem README, se for o primeiro push):

```powershell
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

Ou use o script (substitua a URL):

```powershell
.\scripts\github-push.ps1 -RemoteUrl "https://github.com/SEU_USUARIO/SEU_REPO.git"
```

## Scripts

| Comando      | Descrição              |
|--------------|------------------------|
| `npm start`  | Produção               |
| `npm run dev`| Desenvolvimento (watch)|
