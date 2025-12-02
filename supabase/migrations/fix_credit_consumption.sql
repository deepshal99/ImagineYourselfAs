-- ============================================================================
-- FIX: ROBUST CREDIT CONSUMPTION
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Function to safely consume a credit
-- Returns TRUE if credit was deducted, FALSE if insufficient funds
CREATE OR REPLACE FUNCTION consume_credit()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
  user_is_unlimited BOOLEAN;
  target_user_id UUID;
BEGIN
  -- Get current user ID from auth context
  target_user_id := auth.uid();
  
  IF target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get current status
  SELECT credits, is_unlimited 
  INTO current_credits, user_is_unlimited
  FROM user_credits
  WHERE user_id = target_user_id;
  
  -- If record doesn't exist, create it with 0 credits
  IF NOT FOUND THEN
    INSERT INTO user_credits (user_id, credits, is_unlimited)
    VALUES (target_user_id, 0, false);
    RETURN FALSE;
  END IF;

  -- Check if unlimited
  IF user_is_unlimited THEN
    RETURN TRUE;
  END IF;

  -- Check and deduct credits
  IF current_credits > 0 THEN
    UPDATE user_credits
    SET credits = credits - 1,
        updated_at = NOW()
    WHERE user_id = target_user_id
      AND credits > 0; -- Atomic check to prevent race conditions
      
    -- Check if update actually happened (row count > 0)
    IF FOUND THEN
      RETURN TRUE;
    ELSE
      RETURN FALSE;
    END IF;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$;

