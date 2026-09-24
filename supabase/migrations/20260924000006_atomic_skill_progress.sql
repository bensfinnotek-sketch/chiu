-- Atomically apply learning evidence to one HSK skill row.
CREATE OR REPLACE FUNCTION public.increment_user_skill_score(
  p_user_id UUID,
  p_skill TEXT,
  p_level INT,
  p_points_delta INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_skill NOT IN ('vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing') THEN
    RAISE EXCEPTION 'Invalid skill';
  END IF;
  IF p_level < 1 OR p_level > 6 THEN
    RAISE EXCEPTION 'Invalid HSK level';
  END IF;
  INSERT INTO public.user_skill_progress (user_id, skill, level, score, completed_activities, updated_at)
  VALUES (p_user_id, p_skill, p_level, GREATEST(0, LEAST(100, p_points_delta)), 1, NOW())
  ON CONFLICT (user_id, skill, level)
  DO UPDATE SET
    score = GREATEST(0, LEAST(100, public.user_skill_progress.score + EXCLUDED.score)),
    completed_activities = public.user_skill_progress.completed_activities + 1,
    updated_at = NOW();
END;
$$;
REVOKE ALL ON FUNCTION public.increment_user_skill_score(UUID, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_user_skill_score(UUID, TEXT, INT, INT) TO authenticated;
