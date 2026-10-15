# afiliados_whatsapp

Servidor Node.js (Express + Baileys) para enviar mensagens de texto a grupos do WhatsApp via HTTP.

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

Envia texto para um grupo.

**Body (JSON):**

```json
{
  "groupId": "120363123456789012@g.us",
  "message": "Olá, grupo!"
}
```

`groupId` pode ser o JID completo (`...@g.us`) ou só o ID numérico.

**Respostas:**

- `200` — mensagem enviada
- `400` — body inválido
- `503` — WhatsApp ainda não conectado

Exemplo:

```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d "{\"groupId\":\"120363123456789012@g.us\",\"message\":\"Teste\"}"
```

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

## Scripts

| Comando      | Descrição              |
|--------------|------------------------|
| `npm start`  | Produção               |
| `npm run dev`| Desenvolvimento (watch)|
