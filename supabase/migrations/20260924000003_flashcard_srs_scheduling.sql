-- Persist spaced-repetition scheduling metadata for personal flashcards.
ALTER TABLE public.user_vocabulary
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_user_vocab_next_review
  ON public.user_vocabulary(user_id, next_review_at);

-- Existing cards without a schedule remain immediately reviewable as new/learning cards.
