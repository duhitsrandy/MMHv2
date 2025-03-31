-- Enable Row Level Security for all tables
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "todos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "locations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "searches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pois" ENABLE ROW LEVEL SECURITY;

-- Create audit log table
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "table_name" text NOT NULL,
    "record_id" uuid NOT NULL,
    "user_id" text NOT NULL,
    "action" text NOT NULL,
    "old_data" jsonb,
    "new_data" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Enable RLS for audit logs
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles: Users can only read and update their own profile
CREATE POLICY "profiles_select_own" ON "profiles"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_update_own" ON "profiles"
    FOR UPDATE USING (auth.uid() = user_id);

-- Todos: Users can only CRUD their own todos
CREATE POLICY "todos_select_own" ON "todos"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "todos_insert_own" ON "todos"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "todos_update_own" ON "todos"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "todos_delete_own" ON "todos"
    FOR DELETE USING (auth.uid() = user_id);

-- Locations: Users can only CRUD their own locations
CREATE POLICY "locations_select_own" ON "locations"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "locations_insert_own" ON "locations"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "locations_update_own" ON "locations"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "locations_delete_own" ON "locations"
    FOR DELETE USING (auth.uid() = user_id);

-- Searches: Users can only CRUD their own searches
CREATE POLICY "searches_select_own" ON "searches"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "searches_insert_own" ON "searches"
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "searches_update_own" ON "searches"
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "searches_delete_own" ON "searches"
    FOR DELETE USING (auth.uid() = user_id);

-- POIs: Users can only read POIs related to their searches
CREATE POLICY "pois_select_own" ON "pois"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM searches
            WHERE searches.id = pois.search_id
            AND searches.user_id = auth.uid()
        )
    );

CREATE POLICY "pois_insert_own" ON "pois"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM searches
            WHERE searches.id = search_id
            AND searches.user_id = auth.uid()
        )
    );

CREATE POLICY "pois_update_own" ON "pois"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM searches
            WHERE searches.id = pois.search_id
            AND searches.user_id = auth.uid()
        )
    );

CREATE POLICY "pois_delete_own" ON "pois"
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM searches
            WHERE searches.id = pois.search_id
            AND searches.user_id = auth.uid()
        )
    );

-- Audit logs: Only admins can read audit logs
CREATE POLICY "audit_logs_select_admin" ON "audit_logs"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.membership = 'pro'
        )
    );

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (table_name, record_id, user_id, action, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, COALESCE(auth.uid(), 'system'), TG_OP, row_to_json(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (table_name, record_id, user_id, action, old_data, new_data)
        VALUES (TG_TABLE_NAME, NEW.id, COALESCE(auth.uid(), 'system'), TG_OP, row_to_json(OLD), row_to_json(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (table_name, record_id, user_id, action, old_data)
        VALUES (TG_TABLE_NAME, OLD.id, COALESCE(auth.uid(), 'system'), TG_OP, row_to_json(OLD));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for all tables
CREATE TRIGGER audit_profiles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_todos_trigger
    AFTER INSERT OR UPDATE OR DELETE ON todos
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_locations_trigger
    AFTER INSERT OR UPDATE OR DELETE ON locations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_searches_trigger
    AFTER INSERT OR UPDATE OR DELETE ON searches
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_pois_trigger
    AFTER INSERT OR UPDATE OR DELETE ON pois
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function(); 