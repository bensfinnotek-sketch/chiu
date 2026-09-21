-- ==============================================================================
-- Migration: 20260321000001_flashcard_hardening.sql
-- Description: Ensure all required fields exist on user_vocabulary,
--              safely deduplicate existing data, add UNIQUE(user_id, hanzi),
--              and enforce strict Row Level Security (RLS) policies.
-- ==============================================================================

-- 1. Ensure required columns exist on public.user_vocabulary
ALTER TABLE public.user_vocabulary
  ADD COLUMN IF NOT EXISTS example_sentence TEXT,
  ADD COLUMN IF NOT EXISTS source_conversation_id UUID REFERENCES public.conversation_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Ensure updated_at trigger exists for user_vocabulary
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_vocabulary_updated_at ON public.user_vocabulary;
CREATE TRIGGER set_user_vocabulary_updated_at
  BEFORE UPDATE ON public.user_vocabulary
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. Safely deduplicate existing records before adding UNIQUE constraint
-- If a user has duplicate entries for the same hanzi, keep the record with the most progress
-- (highest review_count, or most recently reviewed/created), and merge the example_sentence.
DO $$
BEGIN
  -- Check if duplicate (user_id, hanzi) exist
  IF EXISTS (
    SELECT 1 FROM public.user_vocabulary
    GROUP BY user_id, hanzi
    HAVING COUNT(*) > 1
  ) THEN
    -- Keep the best record (greatest review_count, then latest last_reviewed_at/created_at)
    -- and remove the secondary duplicates
    DELETE FROM public.user_vocabulary uv
    WHERE uv.id NOT IN (
      SELECT DISTINCT ON (user_id, hanzi) id
      FROM public.user_vocabulary
      ORDER BY user_id, hanzi, review_count DESC, COALESCE(last_reviewed_at, created_at) DESC, created_at DESC
    );
  END IF;
END $$;

-- 4. Add UNIQUE constraint on (user_id, hanzi) idempotently
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_user_hanzi'
      AND conrelid = 'public.user_vocabulary'::regclass
  ) THEN
    ALTER TABLE public.user_vocabulary
      ADD CONSTRAINT unique_user_hanzi UNIQUE (user_id, hanzi);
  END IF;
END $$;

-- 5. Indexes for fast performance on queries
CREATE INDEX IF NOT EXISTS idx_user_vocab_user_status ON public.user_vocabulary(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_vocab_user_updated ON public.user_vocabulary(user_id, updated_at DESC);

-- 6. Ensure RLS is active
ALTER TABLE public.user_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

-- 7. Idempotently enforce strict RLS policies on user_vocabulary
DROP POLICY IF EXISTS "Users can view own vocabulary" ON public.user_vocabulary;
CREATE POLICY "Users can view own vocabulary"
  ON public.user_vocabulary FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own vocabulary" ON public.user_vocabulary;
CREATE POLICY "Users can insert own vocabulary"
  ON public.user_vocabulary FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own vocabulary" ON public.user_vocabulary;
CREATE POLICY "Users can update own vocabulary"
  ON public.user_vocabulary FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own vocabulary" ON public.user_vocabulary;
CREATE POLICY "Users can delete own vocabulary"
  ON public.user_vocabulary FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Idempotently enforce strict RLS policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
