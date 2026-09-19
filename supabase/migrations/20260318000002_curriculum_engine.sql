-- ==============================================================================
-- HanziAI - Curriculum Engine Schema (Prompt 5)
-- Tables for Curriculums, Levels, Units, Lessons, Sections, Vocabulary,
-- Grammar, Quizzes, and User Progress Tracking
-- ==============================================================================

-- 1. Curriculums
CREATE TABLE IF NOT EXISTS public.curriculums (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'vi',
  target_language TEXT NOT NULL DEFAULT 'zh-CN',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HSK Levels
CREATE TABLE IF NOT EXISTS public.hsk_levels (
  id TEXT PRIMARY KEY,
  level INT NOT NULL CHECK (level BETWEEN 1 AND 6),
  title TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  description_vi TEXT NOT NULL,
  objectives JSONB DEFAULT '[]'::jsonb,
  estimated_hours INT NOT NULL,
  total_lessons INT NOT NULL,
  total_units INT NOT NULL,
  total_vocabulary INT NOT NULL,
  total_grammar_points INT NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Units
CREATE TABLE IF NOT EXISTS public.curriculum_units (
  id TEXT PRIMARY KEY,
  curriculum_id TEXT REFERENCES public.curriculums(id) ON DELETE CASCADE,
  level_id TEXT REFERENCES public.hsk_levels(id) ON DELETE CASCADE,
  level_number INT NOT NULL,
  order_index INT NOT NULL,
  title TEXT NOT NULL,
  title_zh TEXT NOT NULL,
  description TEXT,
  objectives JSONB DEFAULT '[]'::jsonb,
  estimated_minutes INT DEFAULT 45,
  lesson_count INT DEFAULT 0,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Lessons
CREATE TABLE IF NOT EXISTS public.curriculum_lessons (
  id TEXT PRIMARY KEY,
  unit_id TEXT REFERENCES public.curriculum_units(id) ON DELETE CASCADE,
  level_id TEXT REFERENCES public.hsk_levels(id) ON DELETE CASCADE,
  level_number INT NOT NULL,
  order_index INT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_zh TEXT NOT NULL,
  description TEXT,
  objectives JSONB DEFAULT '[]'::jsonb,
  estimated_minutes INT DEFAULT 15,
  difficulty TEXT DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  is_published BOOLEAN DEFAULT TRUE,
  is_required BOOLEAN DEFAULT TRUE,
  prerequisite_lesson_id TEXT,
  completion_rule TEXT DEFAULT 'all_required_and_quiz',
  passing_score INT DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Vocabulary
CREATE TABLE IF NOT EXISTS public.vocabulary (
  id TEXT PRIMARY KEY,
  hanzi TEXT NOT NULL,
  traditional TEXT,
  pinyin TEXT NOT NULL,
  meaning_vi TEXT NOT NULL,
  meaning_en TEXT,
  part_of_speech TEXT,
  hsk_level INT NOT NULL CHECK (hsk_level BETWEEN 1 AND 6),
  frequency INT,
  example_sentence TEXT,
  example_pinyin TEXT,
  example_translation TEXT,
  audio_url TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Grammar Points
CREATE TABLE IF NOT EXISTS public.grammar_points (
  id TEXT PRIMARY KEY,
  level INT NOT NULL CHECK (level BETWEEN 1 AND 6),
  title TEXT NOT NULL,
  pattern TEXT NOT NULL,
  explanation_vi TEXT NOT NULL,
  explanation_en TEXT,
  examples JSONB DEFAULT '[]'::jsonb,
  common_mistakes JSONB DEFAULT '[]'::jsonb,
  difficulty TEXT DEFAULT 'beginner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. User Lesson Progress
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES public.curriculum_lessons(id) ON DELETE CASCADE,
  level_number INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('locked', 'available', 'in_progress', 'completed')),
  progress_percent INT DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  current_section_id TEXT,
  score INT,
  attempts INT DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

-- 8. Quiz Attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES public.curriculum_lessons(id) ON DELETE CASCADE,
  score INT NOT NULL,
  total_points INT NOT NULL,
  earned_points INT NOT NULL,
  correct_answers INT NOT NULL,
  total_questions INT NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Security
ALTER TABLE public.curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hsk_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Read policies for public educational curriculum
CREATE POLICY "Public read curriculums" ON public.curriculums FOR SELECT USING (true);
CREATE POLICY "Public read hsk_levels" ON public.hsk_levels FOR SELECT USING (true);
CREATE POLICY "Public read curriculum_units" ON public.curriculum_units FOR SELECT USING (true);
CREATE POLICY "Public read curriculum_lessons" ON public.curriculum_lessons FOR SELECT USING (true);
CREATE POLICY "Public read vocabulary" ON public.vocabulary FOR SELECT USING (true);
CREATE POLICY "Public read grammar_points" ON public.grammar_points FOR SELECT USING (true);

-- User-scoped policies for progress & attempts
CREATE POLICY "Users can manage own lesson progress" ON public.user_lesson_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own quiz attempts" ON public.quiz_attempts
  FOR ALL USING (auth.uid() = user_id);
