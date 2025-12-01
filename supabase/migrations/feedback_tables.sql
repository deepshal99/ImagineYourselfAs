-- Create table for tracking user feedback on generations
CREATE TABLE IF NOT EXISTS generation_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  persona_id TEXT NOT NULL,
  image_url TEXT, -- Optional: store the image URL causing the feedback
  feedback_type TEXT CHECK (feedback_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE generation_feedback ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can insert their own feedback" ON generation_feedback;
CREATE POLICY "Users can insert their own feedback"
  ON generation_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all feedback" ON generation_feedback;
CREATE POLICY "Admins can view all feedback"
  ON generation_feedback FOR SELECT
  TO authenticated
  USING (true);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_feedback_persona ON generation_feedback(persona_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON generation_feedback(created_at DESC);
