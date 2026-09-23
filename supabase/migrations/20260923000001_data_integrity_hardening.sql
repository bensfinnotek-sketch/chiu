-- ==============================================================================
-- HanziAI - Supabase Data Integrity & Curriculum Progress Hardening
-- Adds missing curriculum progress tables, backfills core user rows,
-- and makes RLS policies explicit and owner-scoped.
-- ==============================================================================

-- 1. Backfill core per-user rows for accounts that existed before the
--    profile/progress/subscription trigger was installed.
INSERT INTO public.profiles (id, email, display_name, avatar_url)
SELECT
  u.id,
  COALESCE(u.email, ''),
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email, ''), '@', 1)),
  u.raw_user_meta_data->>'avatar_url'
FROM auth.users AS u
WHERE COALESCE(u.email, '') <> ''
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.learning_progress (user_id)
SELECT u.id
FROM auth.users AS u
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.subscriptions (user_id, plan, status)
SELECT u.id, 'free', 'active'
FROM auth.users AS u
ON CONFLICT (user_id) DO NOTHING;

-- 2. Curriculum vocabulary progress.
CREATE TABLE IF NOT EXISTS public.user_vocabulary_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_id TEXT NOT NULL REFERENCES public.vocabulary(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'learning', 'known', 'mastered')),
  exposure_count INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  mastered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, vocabulary_id)
);

-- 3. Curriculum grammar progress.
CREATE TABLE IF NOT EXISTS public.user_grammar_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grammar_point_id TEXT NOT NULL REFERENCES public.grammar_points(id) ON DELETE CASCADE,
  exposure_count INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  mastery_score INT NOT NULL DEFAULT 0 CHECK (mastery_score BETWEEN 0 AND 100),
  last_practiced_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, grammar_point_id)
);

-- 4. Curriculum skill progress.
CREATE TABLE IF NOT EXISTS public.user_skill_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL
    CHECK (skill IN ('vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing')),
  level INT NOT NULL CHECK (level BETWEEN 1 AND 6),
  score INT NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  completed_activities INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, skill, level)
);

-- 5. Indexes for owner-scoped reads.
CREATE INDEX IF NOT EXISTS idx_user_vocab_progress_user
  ON public.user_vocabulary_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_grammar_progress_user
  ON public.user_grammar_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_user
  ON public.user_skill_progress(user_id);

-- 6. updated_at trigger for curriculum progress.
DROP TRIGGER IF EXISTS set_user_vocabulary_progress_updated_at
  ON public.user_vocabulary_progress;
CREATE TRIGGER set_user_vocabulary_progress_updated_at
  BEFORE UPDATE ON public.user_vocabulary_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. Enable RLS.
ALTER TABLE public.user_vocabulary_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_grammar_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skill_progress ENABLE ROW LEVEL SECURITY;

-- 8. Owner-only RLS for curriculum progress.
DROP POLICY IF EXISTS "Users can view own vocabulary progress"
  ON public.user_vocabulary_progress;
CREATE POLICY "Users can view own vocabulary progress"
  ON public.user_vocabulary_progress FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own vocabulary progress"
  ON public.user_vocabulary_progress;
CREATE POLICY "Users can insert own vocabulary progress"
  ON public.user_vocabulary_progress FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own vocabulary progress"
  ON public.user_vocabulary_progress;
CREATE POLICY "Users can update own vocabulary progress"
  ON public.user_vocabulary_progress FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own vocabulary progress"
  ON public.user_vocabulary_progress;
CREATE POLICY "Users can delete own vocabulary progress"
  ON public.user_vocabulary_progress FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own grammar progress"
  ON public.user_grammar_progress;
CREATE POLICY "Users can view own grammar progress"
  ON public.user_grammar_progress FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own grammar progress"
  ON public.user_grammar_progress;
CREATE POLICY "Users can insert own grammar progress"
  ON public.user_grammar_progress FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own grammar progress"
  ON public.user_grammar_progress;
CREATE POLICY "Users can update own grammar progress"
  ON public.user_grammar_progress FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own grammar progress"
  ON public.user_grammar_progress;
CREATE POLICY "Users can delete own grammar progress"
  ON public.user_grammar_progress FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own skill progress"
  ON public.user_skill_progress;
CREATE POLICY "Users can view own skill progress"
  ON public.user_skill_progress FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own skill progress"
  ON public.user_skill_progress;
CREATE POLICY "Users can insert own skill progress"
  ON public.user_skill_progress FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own skill progress"
  ON public.user_skill_progress;
CREATE POLICY "Users can update own skill progress"
  ON public.user_skill_progress FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own skill progress"
  ON public.user_skill_progress;
CREATE POLICY "Users can delete own skill progress"
  ON public.user_skill_progress FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- 9. Harden existing owner-scoped tables with explicit authenticated policies.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view own sessions" ON public.conversation_sessions;
CREATE POLICY "Users can view own sessions"
  ON public.conversation_sessions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.conversation_sessions;
CREATE POLICY "Users can insert own sessions"
  ON public.conversation_sessions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON public.conversation_sessions;
CREATE POLICY "Users can update own sessions"
  ON public.conversation_sessions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.conversation_sessions;
CREATE POLICY "Users can delete own sessions"
  ON public.conversation_sessions FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own messages" ON public.conversation_messages;
CREATE POLICY "Users can view own messages"
  ON public.conversation_messages FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own messages" ON public.conversation_messages;
CREATE POLICY "Users can insert own messages"
  ON public.conversation_messages FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own messages" ON public.conversation_messages;
CREATE POLICY "Users can delete own messages"
  ON public.conversation_messages FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own progress" ON public.learning_progress;
CREATE POLICY "Users can view own progress"
  ON public.learning_progress FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON public.learning_progress;
CREATE POLICY "Users can insert own progress"
  ON public.learning_progress FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.learning_progress;
CREATE POLICY "Users can update own progress"
  ON public.learning_progress FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own vocabulary" ON public.user_vocabulary;
CREATE POLICY "Users can view own vocabulary"
  ON public.user_vocabulary FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own vocabulary" ON public.user_vocabulary;
CREATE POLICY "Users can insert own vocabulary"
  ON public.user_vocabulary FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own vocabulary" ON public.user_vocabulary;
CREATE POLICY "Users can update own vocabulary"
  ON public.user_vocabulary FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own vocabulary" ON public.user_vocabulary;
CREATE POLICY "Users can delete own vocabulary"
  ON public.user_vocabulary FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
