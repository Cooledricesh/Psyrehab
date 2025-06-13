-- Add AI recommendation tracking fields to assessments table
-- This enables tracking of AI processing status and linking to recommendation results

-- 1. Add AI recommendation status and tracking fields
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS ai_recommendation_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (ai_recommendation_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS ai_recommendation_id UUID REFERENCES ai_goal_recommendations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ai_processing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_processing_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_error_message TEXT;

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assessments_ai_status ON assessments(ai_recommendation_status);
CREATE INDEX IF NOT EXISTS idx_assessments_ai_recommendation ON assessments(ai_recommendation_id);
CREATE INDEX IF NOT EXISTS idx_assessments_ai_processing_date ON assessments(ai_processing_started_at);

-- 3. Add comments for documentation
COMMENT ON COLUMN assessments.ai_recommendation_status IS 'Status of AI recommendation processing: pending, processing, completed, failed';
COMMENT ON COLUMN assessments.ai_recommendation_id IS 'Foreign key to generated AI recommendation if completed successfully';
COMMENT ON COLUMN assessments.ai_processing_started_at IS 'Timestamp when AI processing was initiated';
COMMENT ON COLUMN assessments.ai_processing_completed_at IS 'Timestamp when AI processing was completed (success or failure)';
COMMENT ON COLUMN assessments.ai_error_message IS 'Error message if AI processing failed';

-- 4. Update the updated_at timestamp when AI fields change
CREATE OR REPLACE FUNCTION update_assessment_ai_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update ai_processing_completed_at when status changes to completed or failed
    IF NEW.ai_recommendation_status IN ('completed', 'failed') AND 
       OLD.ai_recommendation_status NOT IN ('completed', 'failed') THEN
        NEW.ai_processing_completed_at = NOW();
    END IF;
    
    -- Update updated_at timestamp
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Create trigger for AI status updates
CREATE TRIGGER update_assessments_ai_status_trigger
    BEFORE UPDATE OF ai_recommendation_status, ai_recommendation_id, ai_error_message ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_assessment_ai_status(); 