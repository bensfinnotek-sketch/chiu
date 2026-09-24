-- Track flashcards created automatically from AI conversations separately from manual saves.
ALTER TABLE public.user_vocabulary
  ADD COLUMN IF NOT EXISTS auto_saved BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_user_vocab_auto_saved_created
  ON public.user_vocabulary(user_id, auto_saved, created_at DESC);
