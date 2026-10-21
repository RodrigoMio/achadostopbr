-- product.title passa a aceitar NULL (sem placeholder default).
-- Idempotente: pode ser executado mais de uma vez no SQL Editor do Supabase.

UPDATE product
SET title = NULL
WHERE title = 'Aguardando IA';

ALTER TABLE product
  ALTER COLUMN title DROP NOT NULL;

ALTER TABLE product
  ALTER COLUMN title DROP DEFAULT;

ALTER TABLE product
  ALTER COLUMN title SET DEFAULT NULL;
