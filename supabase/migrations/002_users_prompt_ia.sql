-- Prompt personalizado do afiliado para geração de texto (Gemini).
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS prompt_ia TEXT;
