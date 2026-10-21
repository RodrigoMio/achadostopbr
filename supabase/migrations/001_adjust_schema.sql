-- Ajustes de schema, índices e RLS para o painel de afiliados.
-- Idempotente: pode ser executado mais de uma vez no SQL Editor do Supabase.

-- ---------------------------------------------------------------------------
-- Produtos: tipos e coluna de atualização
-- ---------------------------------------------------------------------------
ALTER TABLE product
  ALTER COLUMN title SET DEFAULT 'Aguardando IA';

ALTER TABLE product
  ALTER COLUMN affiliated_link TYPE TEXT,
  ALTER COLUMN product_link TYPE TEXT,
  ALTER COLUMN image_link TYPE TEXT,
  ALTER COLUMN ia_description TYPE TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'product'
      AND column_name = 'updates_at'
  ) THEN
    ALTER TABLE product RENAME COLUMN updates_at TO updated_at;
  END IF;
END $$;

ALTER TABLE product
  ALTER COLUMN updated_at SET DEFAULT NOW();

CREATE OR REPLACE FUNCTION set_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_set_updated_at ON product;
CREATE TRIGGER product_set_updated_at
BEFORE UPDATE ON product
FOR EACH ROW
EXECUTE FUNCTION set_product_updated_at();

-- ---------------------------------------------------------------------------
-- Utilizadores: grupo WhatsApp e auditoria
-- ---------------------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS whatsapp_group_invite_url TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_group_jid VARCHAR(100),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- whatsapp_jid deve ser único (formato: 5511999999999@s.whatsapp.net)
CREATE UNIQUE INDEX IF NOT EXISTS users_whatsapp_jid_uidx ON users (whatsapp_jid);

-- ---------------------------------------------------------------------------
-- Índices de consulta
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS product_user_updated_idx
  ON product (id_users, updated_at DESC);

CREATE INDEX IF NOT EXISTS product_user_status_idx
  ON product (id_users, id_status);

CREATE INDEX IF NOT EXISTS product_showcase_idx
  ON product (id_users, id_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS users_status_idx ON users (id_status);
CREATE INDEX IF NOT EXISTS users_slug_status_idx ON users (slug, id_status);

-- ---------------------------------------------------------------------------
-- View pública da vitrine (colunas seguras do perfil)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public_profile AS
SELECT
  id_users,
  name,
  slug,
  days_limit_show_product,
  whatsapp_group_invite_url
FROM users
WHERE id_status = 1;

-- ---------------------------------------------------------------------------
-- RLS: o Next.js usa service_role (bypass). Anon não escreve nada.
-- ---------------------------------------------------------------------------
ALTER TABLE status ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform ENABLE ROW LEVEL SECURITY;
ALTER TABLE category ENABLE ROW LEVEL SECURITY;
ALTER TABLE product ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS status_select_public ON status;
CREATE POLICY status_select_public ON status
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS platform_select_public ON platform;
CREATE POLICY platform_select_public ON platform
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS category_select_public ON category;
CREATE POLICY category_select_public ON category
  FOR SELECT TO anon, authenticated
  USING (true);

-- Utilizadores: anon NÃO lê a tabela (protege whatsapp_jid).
-- Perfil público só via view public_profile.

DROP POLICY IF EXISTS product_public_showcase ON product;
CREATE POLICY product_public_showcase ON product
  FOR SELECT TO anon, authenticated
  USING (
    id_status = 6
    AND EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id_users = product.id_users
        AND u.id_status = 1
        AND product.updated_at >= NOW() - (u.days_limit_show_product * INTERVAL '1 day')
    )
  );

GRANT SELECT ON public_profile TO anon, authenticated;
GRANT SELECT ON public_profile TO service_role;
