-- Complete safe fix for ALL RLS policies with performance optimization
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. SAFE FIX FOR POIS TABLE
-- ============================================================================

-- Drop ALL existing policies for pois table
DROP POLICY IF EXISTS "Allow authenticated users to select" ON public.pois;
DROP POLICY IF EXISTS "Users can select pois from their own searches" ON public.pois;
DROP POLICY IF EXISTS "Users can insert pois into their own searches" ON public.pois;
DROP POLICY IF EXISTS "Users can update pois from their own searches" ON public.pois;
DROP POLICY IF EXISTS "Users can delete pois from their own searches" ON public.pois;

-- Create optimized and secure policies for pois
CREATE POLICY "Users can select pois from their own searches"
ON public.pois
FOR SELECT
TO authenticated
USING (
  search_id IN (
    SELECT id FROM public.searches 
    WHERE user_id = (SELECT auth.uid())::text
  )
);

CREATE POLICY "Users can insert pois into their own searches"
ON public.pois
FOR INSERT
TO authenticated
WITH CHECK (
  search_id IN (
    SELECT id FROM public.searches 
    WHERE user_id = (SELECT auth.uid())::text
  )
);

CREATE POLICY "Users can update pois from their own searches"
ON public.pois
FOR UPDATE
TO authenticated
USING (
  search_id IN (
    SELECT id FROM public.searches 
    WHERE user_id = (SELECT auth.uid())::text
  )
)
WITH CHECK (
  search_id IN (
    SELECT id FROM public.searches 
    WHERE user_id = (SELECT auth.uid())::text
  )
);

CREATE POLICY "Users can delete pois from their own searches"
ON public.pois
FOR DELETE
TO authenticated
USING (
  search_id IN (
    SELECT id FROM public.searches 
    WHERE user_id = (SELECT auth.uid())::text
  )
);

-- ============================================================================
-- 2. SAFE FIX FOR LOCATIONS TABLE
-- ============================================================================

-- Drop ALL existing policies for locations table
DROP POLICY IF EXISTS "delete_policy" ON public.locations;
DROP POLICY IF EXISTS "insert_policy" ON public.locations;
DROP POLICY IF EXISTS "select_policy" ON public.locations;
DROP POLICY IF EXISTS "update_policy" ON public.locations;
DROP POLICY IF EXISTS "Users can select their own locations" ON public.locations;
DROP POLICY IF EXISTS "Users can insert their own locations" ON public.locations;
DROP POLICY IF EXISTS "Users can update their own locations" ON public.locations;
DROP POLICY IF EXISTS "Users can delete their own locations" ON public.locations;

-- Create properly secured and optimized policies for locations
CREATE POLICY "Users can select their own locations"
ON public.locations
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can insert their own locations"
ON public.locations
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can update their own locations"
ON public.locations
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid())::text)
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can delete their own locations"
ON public.locations
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

-- ============================================================================
-- 3. OPTIMIZE EXISTING SEARCHES TABLE POLICIES
-- ============================================================================

-- Fix the searches delete policy that uses non-optimized auth.uid()
DROP POLICY IF EXISTS "Users can delete their own searches." ON public.searches;
DROP POLICY IF EXISTS "Users can delete their own searches" ON public.searches;

CREATE POLICY "Users can delete their own searches"
ON public.searches
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

-- Ensure all other searches policies use optimized auth.uid()
DROP POLICY IF EXISTS "Users can select their own searches." ON public.searches;
DROP POLICY IF EXISTS "Users can select their own searches" ON public.searches;

CREATE POLICY "Users can select their own searches"
ON public.searches
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can update their own searches." ON public.searches;
DROP POLICY IF EXISTS "Users can update their own searches" ON public.searches;

CREATE POLICY "Users can update their own searches"
ON public.searches
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid())::text)
WITH CHECK (user_id = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can insert searches." ON public.searches;
DROP POLICY IF EXISTS "Users can insert searches" ON public.searches;

CREATE POLICY "Users can insert searches"
ON public.searches
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid())::text);

-- ============================================================================
-- 4. SECURE SEARCH_ORIGINS TABLE
-- ============================================================================

-- Drop ANY existing policies for search_origins table
DROP POLICY IF EXISTS "Users can select search_origins from their own searches" ON public.search_origins;
DROP POLICY IF EXISTS "Users can insert search_origins into their own searches" ON public.search_origins;
DROP POLICY IF EXISTS "Users can update search_origins from their own searches" ON public.search_origins;
DROP POLICY IF EXISTS "Users can delete search_origins from their own searches" ON public.search_origins;

-- Create secure policies for search_origins (linked through searches table)
CREATE POLICY "Users can select search_origins from their own searches"
ON public.search_origins
FOR SELECT
TO authenticated
USING (
  search_id IN (
    SELECT id FROM public.searches 
    WHERE user_id = (SELECT auth.uid())::text
  )
);

CREATE POLICY "Users can insert search_origins into their own searches"
ON public.search_origins
FOR INSERT
TO authenticated
WITH CHECK (
  search_id IN (
    SELECT id FROM public.searches 
    WHERE user_id = (SELECT auth.uid())::text
  )
);

CREATE POLICY "Users can update search_origins from their own searches"
ON public.search_origins
FOR UPDATE
TO authenticated
USING (
  search_id IN (
    SELECT id FROM public.searches 
    WHERE user_id = (SELECT auth.uid())::text
  )
)
WITH CHECK (
  search_id IN (
    SELECT id FROM public.searches 
    WHERE user_id = (SELECT auth.uid())::text
  )
);

CREATE POLICY "Users can delete search_origins from their own searches"
ON public.search_origins
FOR DELETE
TO authenticated
USING (
  search_id IN (
    SELECT id FROM public.searches 
    WHERE user_id = (SELECT auth.uid())::text
  )
);

-- ============================================================================
-- 5. SECURE PROFILES TABLE
-- ============================================================================

-- Drop ANY existing policies for profiles table
DROP POLICY IF EXISTS "Users can select their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Create secure policies for profiles
CREATE POLICY "Users can select their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid())::text)
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

-- ============================================================================
-- 6. SECURE TODOS TABLE
-- ============================================================================

-- Drop ANY existing policies for todos table
DROP POLICY IF EXISTS "Users can select their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can insert their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can update their own todos" ON public.todos;
DROP POLICY IF EXISTS "Users can delete their own todos" ON public.todos;

-- Create secure policies for todos
CREATE POLICY "Users can select their own todos"
ON public.todos
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can insert their own todos"
ON public.todos
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can update their own todos"
ON public.todos
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid())::text)
WITH CHECK (user_id = (SELECT auth.uid())::text);

CREATE POLICY "Users can delete their own todos"
ON public.todos
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid())::text);

-- ============================================================================
-- 7. ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================================================

ALTER TABLE public.pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_origins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY; 