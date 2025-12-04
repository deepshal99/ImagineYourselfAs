-- ============================================================================
-- SIMPLIFIED CREDIT LOGIC
-- ============================================================================

-- 1. consume_credit: Atomic, simple, secure.
-- Returns TRUE if successful, FALSE if insufficient credits.
CREATE OR REPLACE FUNCTION consume_credit()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  current_credits INTEGER;
  user_is_unlimited BOOLEAN;
BEGIN
  -- Get the user ID from the current session (invoking user)
  target_user_id := auth.uid();
  
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Lock the row for update to prevent race conditions
  SELECT credits, is_unlimited 
  INTO current_credits, user_is_unlimited
  FROM user_credits
  WHERE user_id = target_user_id
  FOR UPDATE;

  -- Handle case where user has no record yet
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, credits, is_unlimited)
    VALUES (target_user_id, 0, false);
    RETURN FALSE;
  END IF;

  -- Unlimited users always succeed without deduction
  IF user_is_unlimited THEN
    RETURN TRUE;
  END IF;

  -- Check and deduct
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

-- 2. admin_refund_credit: For system use only (Service Role)
-- Adds 1 credit back to a specific user.
CREATE OR REPLACE FUNCTION admin_refund_credit(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_credits
  SET credits = credits + 1,
      updated_at = NOW()
  WHERE user_id = target_user_id;
END;
$$;
