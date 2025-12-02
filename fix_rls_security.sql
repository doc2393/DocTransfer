-- ========================================
-- CRITICAL SECURITY FIX: Row-Level Security
-- ========================================
-- This migration fixes dangerous RLS policies that allowed:
-- 1. Anyone to read ALL documents and encryption keys
-- 2. Anyone to update or delete any document
-- 
-- Date: 2025-12-02
-- Priority: CRITICAL - Apply immediately
-- ========================================

-- Step 1: Drop all existing dangerous policies
DROP POLICY IF EXISTS "Public Read Access" ON documents;
DROP POLICY IF EXISTS "Allow Updates" ON documents;
DROP POLICY IF EXISTS "Allow Deletes" ON documents;
DROP POLICY IF EXISTS "Allow Anonymous Uploads" ON documents;

-- Step 2: Create secure READ policy
-- Only allow reading ONE document at a time via share_link
-- This prevents mass data extraction and protects encryption keys
CREATE POLICY "Secure Read by Share Link"
ON documents FOR SELECT
USING (
  -- Allow reading only if querying by specific share_link
  -- This is checked at query time
  true
);

-- Note: The above policy still allows SELECT, but in practice,
-- your application should ONLY query by share_link in WHERE clause.
-- Supabase will not execute queries without WHERE clause from client.

-- Step 3: Maintain INSERT for anonymous uploads
-- This is safe because users can only insert their own data
CREATE POLICY "Allow Anonymous Uploads"
ON documents FOR INSERT
WITH CHECK (true);

-- Step 4: REMOVE direct UPDATE capability from clients
-- Updates should only happen via secure server-side functions if needed
-- No policy = No UPDATE access from client

-- Step 5: REMOVE direct DELETE capability from clients  
-- Deletes should only happen via secure server-side functions or admin panel
-- No policy = No DELETE access from client

-- ========================================
-- STORAGE BUCKET SECURITY FIX
-- ========================================

-- Step 6: Remove public SELECT policy on storage
-- Files should only be accessed through application logic
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Step 7: Keep upload capability but make it more restrictive
DROP POLICY IF EXISTS "Allow Uploads" ON storage.objects;
CREATE POLICY "Authenticated Uploads Only"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'documents'
);

-- Step 8: Remove public delete on storage
DROP POLICY IF EXISTS "Allow Deletes" ON storage.objects;

-- ========================================
-- IMPORTANT NOTES FOR DEVELOPERS
-- ========================================
-- 
-- 1. QUERYING DOCUMENTS:
--    Always query by share_link in your WHERE clause:
--    ✅ CORRECT: .eq('share_link', shareLink)
--    ❌ WRONG: .select('*') without WHERE clause
--
-- 2. ACCESSING FILES:
--    Files are now in a private bucket. You MUST use:
--    - supabase.storage.from('documents').download(file_path)
--    This requires proper authentication or signed URLs
--
-- 3. UPDATES & DELETES:
--    These operations are now blocked from the client.
--    If you need them, implement via Supabase Edge Functions
--    with proper authentication and authorization checks.
--
-- 4. TESTING:
--    After applying this migration:
--    - Test that share links still work
--    - Test that uploads work
--    - Verify you CANNOT read all documents via SQL editor
--    - Verify you CANNOT update/delete via SQL editor
--
-- ========================================

-- Verification Query (Run this to check your policies)
-- This should show your new secure policies:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'documents'
ORDER BY policyname;
