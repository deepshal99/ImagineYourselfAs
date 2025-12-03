-- ============================================================================
-- HELPER FUNCTIONS FOR CREDITS
-- Run this AFTER the simple_working_rls.sql migration
-- ============================================================================

-- Function: consume_credit (Required by the app)
CREATE OR REPLACE FUNCTION public.consume_credit()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits INTEGER;
  user_is_unlimited BOOLEAN;
  target_user_id UUID;
BEGIN
  target_user_id := auth.uid();
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock row and get current status
  SELECT credits, is_unlimited 
  INTO current_credits, user_is_unlimited
  FROM user_credits
  WHERE user_id = target_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Unlimited users don't consume credits
  IF user_is_unlimited THEN
    RETURN TRUE;
  END IF;

  -- Check and deduct atomically
  IF current_credits > 0 THEN
    UPDATE user_credits
    SET credits = credits - 1,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

-- Function: claim_daily_credit (If you have daily credit feature)
CREATE OR REPLACE FUNCTION public.claim_daily_credit()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  target_user_id := auth.uid();
  
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- For now, just return FALSE (daily credit feature not active)
  -- You can implement this later with a last_claim_date column
  RETURN FALSE;
END;
$$;

