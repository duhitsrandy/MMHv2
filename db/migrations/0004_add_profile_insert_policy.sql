-- Add RLS policy to ensure users can only insert their own profile
CREATE POLICY "profiles_insert_own" ON "profiles"
    FOR INSERT WITH CHECK ((select auth.uid()::text) = user_id); 