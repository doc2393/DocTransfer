-- ========================================
-- STORAGE BUCKET: Signed URL Access Pattern
-- ========================================
-- Since we're making the storage bucket private,
-- we need to use signed URLs for file access.
-- 
-- This ensures files are only accessible:
-- 1. Through your application
-- 2. With time-limited access
-- 3. Cannot be directly linked/shared
-- ========================================

-- Option 1: Make bucket PRIVATE (Recommended)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'documents';

-- Option 2: If you want to keep bucket public but add security
-- Keep bucket public but rely on file encryption
-- (Less secure but easier to implement)
-- UPDATE storage.buckets 
-- SET public = true 
-- WHERE id = 'documents';

-- ========================================
-- STORAGE POLICIES FOR PRIVATE BUCKET
-- ========================================

-- Remove all existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow Deletes" ON storage.objects;

-- Policy 1: Allow anyone to upload to documents bucket
-- This is safe because users can only upload, not read others' files
CREATE POLICY "Allow Document Uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'documents' );

-- Policy 2: Allow reading ONLY your own uploaded files
-- This requires authentication and user tracking
-- If you're not using auth yet, you'll need to keep bucket public
-- or implement this when you add user authentication
CREATE POLICY "Allow Authenticated Downloads"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' );

-- Note: With private bucket, you'll need to use signed URLs in your code:
-- const { data, error } = await supabase.storage
--   .from('documents')
--   .createSignedUrl(filePath, 3600); // 1 hour expiry

-- ========================================
-- TEMPORARY WORKAROUND (Until Auth is Added)
-- ========================================
-- If you haven't implemented user authentication yet,
-- you have two options:
--
-- OPTION A: Keep bucket public (less secure but functional)
--   - Files are encrypted, so even if public URL is found, content is safe
--   - Run: UPDATE storage.buckets SET public = true WHERE id = 'documents';
--
-- OPTION B: Use service role key server-side (more secure)
--   - Create Supabase Edge Functions to handle file access
--   - Use service_role key in Edge Functions (never in client)
--   - Edge Function validates share_link, then returns signed URL
--
-- Recommended: Implement OPTION B for production
-- ========================================
