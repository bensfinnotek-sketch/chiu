-- Persist SRS repetition state and answer history for intelligent review ordering.
ALTER TABLE public.user_vocabulary
  ADD COLUMN IF NOT EXISTS srs_repetitions INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS srs_correct_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS srs_incorrect_count INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_vocab_srs_repetitions
  ON public.user_vocabulary(user_id, srs_repetitions);
