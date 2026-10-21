-- Prefixo de grupo no utilizador e data do último disparo no produto.
-- Idempotente: pode ser executado mais de uma vez no SQL Editor do Supabase.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS whatsapp_group_name VARCHAR(100);

ALTER TABLE product
  ADD COLUMN IF NOT EXISTS whatsapp_sent TIMESTAMPTZ;
