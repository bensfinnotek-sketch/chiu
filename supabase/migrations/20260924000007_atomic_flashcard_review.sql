-- Atomically record one flashcard review and calculate the next SRS schedule.
-- FOR UPDATE serializes concurrent reviews of the same card and prevents lost updates.
CREATE OR REPLACE FUNCTION public.review_flashcard(
  p_user_id UUID,
  p_card_id UUID,
  p_rating TEXT
)
RETURNS public.user_vocabulary
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_card public.user_vocabulary;
  v_now TIMESTAMPTZ := NOW();
  v_review_count INT;
  v_repetitions INT;
  v_correct_count INT;
  v_incorrect_count INT;
  v_interval_minutes INT;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_rating NOT IN ('correct', 'incorrect') THEN RAISE EXCEPTION 'Invalid rating'; END IF;

  SELECT * INTO v_card FROM public.user_vocabulary
  WHERE id = p_card_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Flashcard not found'; END IF;

  v_review_count := GREATEST(0, COALESCE(v_card.review_count, 0)) + 1;
  v_correct_count := GREATEST(0, COALESCE(v_card.srs_correct_count, 0))
    + CASE WHEN p_rating = 'correct' THEN 1 ELSE 0 END;
  v_incorrect_count := GREATEST(0, COALESCE(v_card.srs_incorrect_count, 0))
    + CASE WHEN p_rating = 'incorrect' THEN 1 ELSE 0 END;

  IF p_rating = 'incorrect' THEN
    v_repetitions := 0;
    v_interval_minutes := CASE
      WHEN v_incorrect_count <= 1 THEN 10
      WHEN v_incorrect_count <= 3 THEN 20
      ELSE 30
    END;
  ELSE
    v_repetitions := GREATEST(0, COALESCE(v_card.srs_repetitions, 0)) + 1;
    v_interval_minutes := CASE LEAST(v_repetitions, 6)
      WHEN 1 THEN 24 * 60
      WHEN 2 THEN 3 * 24 * 60
      WHEN 3 THEN 7 * 24 * 60
      WHEN 4 THEN 14 * 24 * 60
      WHEN 5 THEN 30 * 24 * 60
      ELSE 60 * 24 * 60
    END;
  END IF;

  UPDATE public.user_vocabulary SET
    status = CASE WHEN p_rating = 'incorrect' THEN 'learning' ELSE 'learned' END,
    review_count = v_review_count,
    srs_repetitions = v_repetitions,
    srs_correct_count = v_correct_count,
    srs_incorrect_count = v_incorrect_count,
    last_reviewed_at = v_now,
    next_review_at = v_now + make_interval(mins => v_interval_minutes),
    updated_at = v_now
  WHERE id = p_card_id AND user_id = p_user_id
  RETURNING * INTO v_card;

  RETURN v_card;
END;
$$;

REVOKE ALL ON FUNCTION public.review_flashcard(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_flashcard(UUID, UUID, TEXT) TO authenticated;
