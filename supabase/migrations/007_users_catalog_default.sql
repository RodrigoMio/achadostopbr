-- Catálogo padrão exibido em /. Coluna: default_catalog. Rode o arquivo inteiro no SQL Editor.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'default_catalog'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN default_catalog BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'users_default_catalog_uidx'
  ) THEN
    EXECUTE $idx$
      CREATE UNIQUE INDEX users_default_catalog_uidx
        ON public.users (default_catalog)
        WHERE default_catalog = TRUE
    $idx$;
  END IF;
END $$;
