-- Prefixo usado para localizar grupos WhatsApp no disparo a partir de /products.
-- Idempotente: pode ser executado mais de uma vez no SQL Editor do Supabase.

ALTER TABLE product
  ADD COLUMN IF NOT EXISTS whatsapp_group_name VARCHAR(100);
