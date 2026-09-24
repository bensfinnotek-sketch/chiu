-- ==============================================================================
-- HanziAI - Per-user personalized lesson storage
-- Stores AI-generated lesson content separately for each authenticated learner.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_personalized_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hsk_level INT NOT NULL CHECK (hsk_level BETWEEN 1 AND 6),
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_vocabulary JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_personalized_lessons_user
  ON public.user_personalized_lessons(user_id, created_at DESC);

ALTER TABLE public.user_personalized_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own personalized lessons"
  ON public.user_personalized_lessons;
CREATE POLICY "Users can view own personalized lessons"
  ON public.user_personalized_lessons FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own personalized lessons"
  ON public.user_personalized_lessons;
CREATE POLICY "Users can insert own personalized lessons"
  ON public.user_personalized_lessons FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own personalized lessons"
  ON public.user_personalized_lessons;
CREATE POLICY "Users can update own personalized lessons"
  ON public.user_personalized_lessons FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own personalized lessons"
  ON public.user_personalized_lessons;
CREATE POLICY "Users can delete own personalized lessons"
  ON public.user_personalized_lessons FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP TRIGGER IF EXISTS set_user_personalized_lessons_updated_at
  ON public.user_personalized_lessons;
CREATE TRIGGER set_user_personalized_lessons_updated_at
  BEFORE UPDATE ON public.user_personalized_lessons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
