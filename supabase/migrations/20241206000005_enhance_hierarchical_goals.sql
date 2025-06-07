-- Enhance rehabilitation_goals table for hierarchical goal management
-- Add new columns and constraints for 3-tier goal system

-- 1. Add new columns to support hierarchical goals
ALTER TABLE rehabilitation_goals 
ADD COLUMN IF NOT EXISTS level goal_level_enum DEFAULT 'weekly',
ADD COLUMN IF NOT EXISTS parent_goal_id UUID REFERENCES rehabilitation_goals(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS month_number INTEGER,
ADD COLUMN IF NOT EXISTS week_number INTEGER,
ADD COLUMN IF NOT EXISTS duration_months INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS completion_date DATE,
ADD COLUMN IF NOT EXISTS category goal_category_enum DEFAULT 'other',
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS overall_vision TEXT,
ADD COLUMN IF NOT EXISTS key_milestones TEXT[],
ADD COLUMN IF NOT EXISTS expected_outcomes TEXT[],
ADD COLUMN IF NOT EXISTS risk_factors TEXT[],
ADD COLUMN IF NOT EXISTS support_required TEXT[],
ADD COLUMN IF NOT EXISTS specific_objectives TEXT[],
ADD COLUMN IF NOT EXISTS weekly_breakdown TEXT[],
ADD COLUMN IF NOT EXISTS measurement_criteria TEXT[],
ADD COLUMN IF NOT EXISTS required_resources TEXT[],
ADD COLUMN IF NOT EXISTS frequency_per_week INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS completion_criteria TEXT[],
ADD COLUMN IF NOT EXISTS check_in_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS check_in_frequency TEXT DEFAULT 'weekly';

-- 2. Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE goal_level_enum AS ENUM ('long_term', 'monthly', 'weekly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE goal_category_enum AS ENUM (
        'physical_therapy',
        'cognitive_training', 
        'social_skills',
        'emotional_regulation',
        'daily_living',
        'communication',
        'vocational',
        'educational', 
        'behavioral',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE goal_status_enum AS ENUM (
        'pending',
        'active', 
        'in_progress',
        'completed',
        'on_hold',
        'cancelled',
        'deferred'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Update existing status column to use the new enum
ALTER TABLE rehabilitation_goals 
ALTER COLUMN status TYPE goal_status_enum USING status::goal_status_enum;

-- 4. Create daily_tasks table for weekly goal breakdown
CREATE TABLE IF NOT EXISTS daily_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_goal_id UUID NOT NULL REFERENCES rehabilitation_goals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    estimated_duration INTEGER DEFAULT 30, -- minutes
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
    completion_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create goal_history table for tracking changes
CREATE TABLE IF NOT EXISTS goal_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES rehabilitation_goals(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('created', 'updated', 'status_changed', 'progress_updated', 'deleted')),
    previous_value JSONB,
    new_value JSONB,
    changed_by UUID NOT NULL REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT,
    notes TEXT
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rehabilitation_goals_level ON rehabilitation_goals(level);
CREATE INDEX IF NOT EXISTS idx_rehabilitation_goals_parent ON rehabilitation_goals(parent_goal_id);
CREATE INDEX IF NOT EXISTS idx_rehabilitation_goals_category ON rehabilitation_goals(category);
CREATE INDEX IF NOT EXISTS idx_rehabilitation_goals_status ON rehabilitation_goals(status);
CREATE INDEX IF NOT EXISTS idx_rehabilitation_goals_patient_level ON rehabilitation_goals(patient_id, level);
CREATE INDEX IF NOT EXISTS idx_rehabilitation_goals_dates ON rehabilitation_goals(start_date, target_date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_weekly_goal ON daily_tasks(weekly_goal_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_day ON daily_tasks(day_of_week);
CREATE INDEX IF NOT EXISTS idx_goal_history_goal ON goal_history(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_history_action ON goal_history(action_type);

-- 7. Add constraints for hierarchical integrity
ALTER TABLE rehabilitation_goals 
ADD CONSTRAINT check_month_number CHECK (
    (level = 'monthly' AND month_number >= 1 AND month_number <= 12) OR 
    (level != 'monthly' AND month_number IS NULL)
);

ALTER TABLE rehabilitation_goals 
ADD CONSTRAINT check_week_number CHECK (
    (level = 'weekly' AND week_number >= 1 AND week_number <= 4) OR 
    (level != 'weekly' AND week_number IS NULL)
);

ALTER TABLE rehabilitation_goals 
ADD CONSTRAINT check_parent_hierarchy CHECK (
    (level = 'long_term' AND parent_goal_id IS NULL) OR
    (level = 'monthly' AND parent_goal_id IS NOT NULL) OR
    (level = 'weekly' AND parent_goal_id IS NOT NULL)
);

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create triggers for updated_at
CREATE TRIGGER update_rehabilitation_goals_updated_at 
    BEFORE UPDATE ON rehabilitation_goals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_tasks_updated_at 
    BEFORE UPDATE ON daily_tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Create function to automatically create goal history entries
CREATE OR REPLACE FUNCTION log_goal_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO goal_history (goal_id, action_type, new_value, changed_by)
        VALUES (NEW.id, 'created', to_jsonb(NEW), NEW.created_by);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log status changes
        IF OLD.status != NEW.status THEN
            INSERT INTO goal_history (goal_id, action_type, previous_value, new_value, changed_by)
            VALUES (NEW.id, 'status_changed', 
                    jsonb_build_object('status', OLD.status), 
                    jsonb_build_object('status', NEW.status), 
                    NEW.updated_by);
        END IF;
        
        -- Log progress updates
        IF OLD.progress != NEW.progress THEN
            INSERT INTO goal_history (goal_id, action_type, previous_value, new_value, changed_by)
            VALUES (NEW.id, 'progress_updated',
                    jsonb_build_object('progress', OLD.progress),
                    jsonb_build_object('progress', NEW.progress),
                    NEW.updated_by);
        END IF;
        
        -- Log general updates (if other fields changed)
        IF (OLD.title != NEW.title OR OLD.description != NEW.description OR 
            OLD.target_date != NEW.target_date OR OLD.priority != NEW.priority) THEN
            INSERT INTO goal_history (goal_id, action_type, previous_value, new_value, changed_by)
            VALUES (NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW), NEW.updated_by);
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO goal_history (goal_id, action_type, previous_value, changed_by)
        VALUES (OLD.id, 'deleted', to_jsonb(OLD), OLD.updated_by);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 11. Create trigger for goal history logging
CREATE TRIGGER log_rehabilitation_goals_changes
    AFTER INSERT OR UPDATE OR DELETE ON rehabilitation_goals
    FOR EACH ROW EXECUTE FUNCTION log_goal_changes();

-- 12. Create view for hierarchical goal structure
CREATE OR REPLACE VIEW goal_hierarchy_view AS
WITH RECURSIVE goal_tree AS (
    -- Base case: Long-term goals (root level)
    SELECT 
        id,
        patient_id,
        title,
        description,
        level,
        parent_goal_id,
        category,
        priority,
        status,
        progress,
        start_date,
        target_date,
        completion_date,
        0 as depth,
        ARRAY[id] as path,
        title as full_path
    FROM rehabilitation_goals 
    WHERE level = 'long_term'
    
    UNION ALL
    
    -- Recursive case: Monthly and weekly goals
    SELECT 
        g.id,
        g.patient_id,
        g.title,
        g.description,
        g.level,
        g.parent_goal_id,
        g.category,
        g.priority,
        g.status,
        g.progress,
        g.start_date,
        g.target_date,
        g.completion_date,
        gt.depth + 1,
        gt.path || g.id,
        gt.full_path || ' > ' || g.title
    FROM rehabilitation_goals g
    INNER JOIN goal_tree gt ON g.parent_goal_id = gt.id
)
SELECT * FROM goal_tree
ORDER BY path;

-- 13. Create function to calculate goal progress
CREATE OR REPLACE FUNCTION calculate_goal_progress(goal_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    goal_level TEXT;
    total_children INTEGER;
    completed_children INTEGER;
    progress_sum NUMERIC;
    calculated_progress NUMERIC;
BEGIN
    -- Get goal level
    SELECT level INTO goal_level FROM rehabilitation_goals WHERE id = goal_id;
    
    IF goal_level = 'weekly' THEN
        -- For weekly goals, use the direct progress value
        SELECT progress INTO calculated_progress FROM rehabilitation_goals WHERE id = goal_id;
        RETURN COALESCE(calculated_progress, 0);
    ELSE
        -- For monthly and long-term goals, calculate based on children
        SELECT COUNT(*), 
               SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END),
               SUM(progress)
        INTO total_children, completed_children, progress_sum
        FROM rehabilitation_goals 
        WHERE parent_goal_id = goal_id;
        
        IF total_children = 0 THEN
            -- No children, use direct progress
            SELECT progress INTO calculated_progress FROM rehabilitation_goals WHERE id = goal_id;
            RETURN COALESCE(calculated_progress, 0);
        ELSE
            -- Calculate based on children progress
            RETURN COALESCE(progress_sum / total_children, 0);
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 14. Create function to update parent goal progress
CREATE OR REPLACE FUNCTION update_parent_progress()
RETURNS TRIGGER AS $$
DECLARE
    parent_id UUID;
    new_progress NUMERIC;
BEGIN
    -- Get parent goal ID
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        parent_id := NEW.parent_goal_id;
    ELSE
        parent_id := OLD.parent_goal_id;
    END IF;
    
    -- Update parent progress if exists
    IF parent_id IS NOT NULL THEN
        new_progress := calculate_goal_progress(parent_id);
        UPDATE rehabilitation_goals 
        SET progress = new_progress, updated_at = NOW()
        WHERE id = parent_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 15. Create trigger to automatically update parent progress
CREATE TRIGGER update_parent_goal_progress
    AFTER INSERT OR UPDATE OF progress, status OR DELETE ON rehabilitation_goals
    FOR EACH ROW EXECUTE FUNCTION update_parent_progress();

-- 16. Update RLS policies for new tables
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_history ENABLE ROW LEVEL SECURITY;

-- RLS policy for daily_tasks
CREATE POLICY "Users can view daily tasks for goals they can access" ON daily_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rehabilitation_goals rg
            WHERE rg.id = daily_tasks.weekly_goal_id
            AND (
                rg.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM patients p 
                    WHERE p.id = rg.patient_id 
                    AND p.social_worker_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can manage daily tasks for goals they can access" ON daily_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM rehabilitation_goals rg
            WHERE rg.id = daily_tasks.weekly_goal_id
            AND (
                rg.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM patients p 
                    WHERE p.id = rg.patient_id 
                    AND p.social_worker_id = auth.uid()
                )
            )
        )
    );

-- RLS policy for goal_history
CREATE POLICY "Users can view goal history for goals they can access" ON goal_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rehabilitation_goals rg
            WHERE rg.id = goal_history.goal_id
            AND (
                rg.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM patients p 
                    WHERE p.id = rg.patient_id 
                    AND p.social_worker_id = auth.uid()
                )
            )
        )
    );

-- 17. Add sample data for testing (optional)
-- This would be removed in production
/*
INSERT INTO rehabilitation_goals (
    patient_id, title, description, level, category, priority, 
    target_date, duration_months, overall_vision, created_by
) VALUES (
    -- Replace with actual patient_id and user_id
    'patient-uuid-here',
    '일상생활 독립성 향상',
    '6개월 내 기본적인 일상생활을 독립적으로 수행할 수 있도록 한다',
    'long_term',
    'daily_living',
    'high',
    CURRENT_DATE + INTERVAL '6 months',
    6,
    '환자가 완전히 독립적인 생활을 할 수 있도록 돕는다',
    'user-uuid-here'
);
*/ 