# AI Recommendation Archive Usage Count Fix Summary

## Problem
When goals are deleted, the AI recommendation archive's usage count wasn't updating to reflect the change, staying at 1 instead of 0.

## Root Cause
The database trigger `update_archive_stats_trigger` was only configured to fire on INSERT and UPDATE operations, but not on DELETE operations.

## Solution Implemented

### 1. Database Trigger Update
- Modified the trigger to handle DELETE operations in addition to INSERT and UPDATE
- Updated the `update_archive_stats_on_goal_change()` function to properly handle the OLD record when a DELETE occurs
- The trigger now fires on: `AFTER INSERT OR UPDATE OR DELETE ON rehabilitation_goals`

### 2. Frontend Updates
- Updated `ProgressTracking.tsx` to use soft delete (status = 'deleted') instead of hard delete
- Added cache invalidation for AI recommendation archive queries when goals are stopped
- Ensures the UI reflects the updated usage counts immediately

### 3. Additional Improvements
- Created a goal deletion log table for debugging and audit purposes
- Added proper handling for both hard and soft deletes in the trigger function

## Technical Details

### Migration Applied
```sql
-- Drop and recreate trigger to include DELETE
DROP TRIGGER IF EXISTS update_archive_stats_trigger ON rehabilitation_goals;

CREATE TRIGGER update_archive_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON rehabilitation_goals
FOR EACH ROW EXECUTE FUNCTION update_archive_stats_on_goal_change();
```

### Code Changes
1. **ProgressTracking.tsx** (lines 301-313):
   - Changed from hard delete to soft delete
   - Set status to 'deleted' instead of using DELETE query
   
2. **ProgressTracking.tsx** (line 346):
   - Added `queryClient.invalidateQueries({ queryKey: ['aiRecommendationArchive'] })`

## Testing
Created test script (`test-archive-stats-trigger.sql`) to verify:
1. Archive stats update when a goal is created (usage_count increases)
2. Archive stats update when a goal is soft deleted (usage_count decreases)
3. Archive stats update when a goal is hard deleted (usage_count remains accurate)

## Impact
- AI recommendation archive usage counts now accurately reflect the current state of goals
- Works for both soft deletes (status = 'deleted') and hard deletes
- UI updates immediately to show correct counts
- Maintains data integrity and provides accurate analytics for AI recommendations