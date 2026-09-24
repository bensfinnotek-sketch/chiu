-- Serialize lesson completion and the aggregate lessons_completed counter.
-- This prevents concurrent completion requests from losing increments.
CREATE OR REPLACE FUNCTION public.complete_lesson(
  p_user_id UUID,
  p_lesson_id TEXT,
  p_score INTEGER,
  p_level_number INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.user_lesson_progress%ROWTYPE;
  v_is_first BOOLEAN;
  v_now TIMESTAMPTZ := NOW();
  v_progress JSONB;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT *
    INTO v_existing
    FROM public.user_lesson_progress
   WHERE user_id = p_user_id
     AND lesson_id = p_lesson_id
   FOR UPDATE;

  v_is_first := NOT FOUND OR v_existing.status IS DISTINCT FROM 'completed';

  INSERT INTO public.user_lesson_progress (
    user_id,
    lesson_id,
    level_number,
    status,
    progress_percent,
    score,
    attempts,
    started_at,
    completed_at,
    last_accessed_at
  )
  VALUES (
    p_user_id,
    p_lesson_id,
    p_level_number,
    'completed',
    100,
    GREATEST(COALESCE(v_existing.score, 0), p_score),
    COALESCE(v_existing.attempts, 0) + 1,
    COALESCE(v_existing.started_at, v_now),
    COALESCE(v_existing.completed_at, v_now),
    v_now
  )
  ON CONFLICT (user_id, lesson_id) DO UPDATE
  SET level_number = EXCLUDED.level_number,
      status = EXCLUDED.status,
      progress_percent = EXCLUDED.progress_percent,
      score = EXCLUDED.score,
      attempts = EXCLUDED.attempts,
      started_at = EXCLUDED.started_at,
      completed_at = EXCLUDED.completed_at,
      last_accessed_at = EXCLUDED.last_accessed_at
  RETURNING to_jsonb(user_lesson_progress.*) INTO v_progress;

  IF v_is_first THEN
    INSERT INTO public.learning_progress (
      user_id,
      lessons_completed,
      updated_at
    )
    VALUES (p_user_id, 1, v_now)
    ON CONFLICT (user_id) DO UPDATE
      SET lessons_completed = COALESCE(public.learning_progress.lessons_completed, 0) + 1,
          updated_at = EXCLUDED.updated_at;
  END IF;

  RETURN jsonb_build_object(
    'progress', v_progress,
    'is_first_completion', v_is_first
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_lesson(UUID, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_lesson(UUID, TEXT, INTEGER, INTEGER) TO authenticated;
