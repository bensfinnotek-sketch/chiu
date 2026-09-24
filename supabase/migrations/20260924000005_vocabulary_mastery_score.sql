-- Persist a normalized vocabulary mastery score per learner/word.
ALTER TABLE public.user_vocabulary_progress
  ADD COLUMN IF NOT EXISTS mastery_score NUMERIC(5,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_vocab_progress_mastery
  ON public.user_vocabulary_progress(user_id, mastery_score);
