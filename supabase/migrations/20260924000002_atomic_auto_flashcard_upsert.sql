-- Atomic auto-flashcard creation with per-user quota serialization.
-- The caller must be authenticated as the same user being mutated.
CREATE OR REPLACE FUNCTION public.upsert_auto_flashcard(
  p_user_id UUID,
  p_hanzi TEXT,
  p_pinyin TEXT,
  p_meaning TEXT,
  p_example_sentence TEXT DEFAULT NULL,
  p_topic TEXT DEFAULT 'general',
  p_hsk_level INT DEFAULT 1,
  p_daily_limit INT DEFAULT NULL
)
RETURNS public.user_vocabulary
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing public.user_vocabulary;
  v_created_today INT;
  v_now TIMESTAMPTZ := NOW();
  v_start_of_day TIMESTAMPTZ := date_trunc('day', v_now);
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF NULLIF(trim(p_hanzi), '') IS NULL THEN
    RAISE EXCEPTION 'hanzi is required';
  END IF;

  -- Serialize auto-save decisions per user so concurrent AI requests cannot
  -- both observe the same remaining quota and exceed it.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::TEXT, 0));

  SELECT * INTO v_existing
  FROM public.user_vocabulary
  WHERE user_id = p_user_id
    AND hanzi = trim(p_hanzi)
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.user_vocabulary
    SET
      pinyin = COALESCE(NULLIF(trim(p_pinyin), ''), pinyin),
      meaning = COALESCE(NULLIF(trim(p_meaning), ''), meaning),
      example_sentence = COALESCE(NULLIF(trim(p_example_sentence), ''), example_sentence),
      topic = COALESCE(NULLIF(trim(p_topic), ''), topic),
      updated_at = v_now
    WHERE id = v_existing.id
    RETURNING * INTO v_existing;

    RETURN v_existing;
  END IF;

  IF p_daily_limit IS NOT NULL THEN
    SELECT COUNT(*)::INT INTO v_created_today
    FROM public.user_vocabulary
    WHERE user_id = p_user_id
      AND auto_saved = TRUE
      AND created_at >= v_start_of_day;

    IF v_created_today >= p_daily_limit THEN
      RETURN NULL;
    END IF;
  END IF;

  INSERT INTO public.user_vocabulary (
    user_id, hanzi, pinyin, meaning, example_sentence, topic,
    hsk_level, auto_saved, status, review_count, created_at, updated_at
  )
  VALUES (
    p_user_id,
    trim(p_hanzi),
    COALESCE(trim(p_pinyin), ''),
    COALESCE(trim(p_meaning), ''),
    COALESCE(trim(p_example_sentence), ''),
    COALESCE(NULLIF(trim(p_topic), ''), 'general'),
    LEAST(6, GREATEST(1, COALESCE(p_hsk_level, 1))),
    TRUE,
    'new',
    0,
    v_now,
    v_now
  )
  RETURNING * INTO v_existing;

  RETURN v_existing;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_auto_flashcard(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_auto_flashcard(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, INT, INT) TO authenticated;
