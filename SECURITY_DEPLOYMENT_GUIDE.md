# Security Deployment Guide

## 🚨 CRITICAL: Apply These Fixes Before Production

This guide will help you secure your DocTransfer database and fix the critical RLS vulnerabilities.

---

## Step 1: Apply Database Security Migration

### Option A: Using Supabase Dashboard (Recommended for Beginners)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `fix_rls_security.sql`
6. Click **Run** or press `Ctrl+Enter`
7. Verify success: You should see "Success. No rows returned"

### Option B: Using Supabase CLI

```bash
# Make sure you have Supabase CLI installed
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
npx supabase db push
```

---

## Step 2: Configure Storage Bucket Security

You have two options depending on whether you have user authentication:

### Option A: Keep Bucket Public (Simpler, Good for Now)

Since your files are encrypted, keeping the bucket public is acceptably secure for now.

**In Supabase Dashboard:**
1. Go to **Storage** → **Buckets**
2. Click on the `documents` bucket
3. Ensure "Public bucket" is **ON**
4. Your current application code will work as-is

**No code changes needed** - your application will continue working.

### Option B: Make Bucket Private (More Secure, Requires Auth)

This is the recommended approach for production, but requires user authentication.

**Steps:**
1. Run the `secure_storage_access.sql` migration
2. Update your application code to use signed URLs
3. Implement user authentication (Clerk or Supabase Auth)

**Code changes needed:**
```typescript
// Update ViewDocument.tsx - handleDownload function
// Replace direct download with signed URL

const { data: signedUrlData, error: urlError } = await supabase.storage
  .from('documents')
  .createSignedUrl(document.file_path, 3600); // 1 hour expiry

if (urlError) throw urlError;

// Then fetch and decrypt
const response = await fetch(signedUrlData.signedUrl);
const blob = await response.blob();
// ... rest of decryption code
```

---

## Step 3: Verify Security is Fixed

### Test 1: Verify RLS Policies

Run this query in Supabase SQL Editor:

```sql
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'documents';
```

**Expected Results:**
- ✅ "Secure Read by Share Link" for SELECT
- ✅ "Allow Anonymous Uploads" for INSERT  
- ❌ NO policies for UPDATE
- ❌ NO policies for DELETE

### Test 2: Try to Read All Documents (Should Fail)

In Supabase SQL Editor, try this query:

```sql
-- This should return ZERO rows (or only rows you're authorized to see)
SELECT * FROM documents;
```

If you see ALL documents, **the fix didn't work**. Contact support.

### Test 3: Try to Update a Document (Should Fail)

```sql
-- This should FAIL with permission error
UPDATE documents 
SET name = 'hacked' 
WHERE id = 'any-document-id';
```

Expected error: `"new row violates row-level security policy"`

### Test 4: Verify Application Still Works

1. Upload a new document via your application
2. Generate a share link
3. Open the share link in an incognito window
4. Verify you can view and download the file
5. ✅ If all works, security is fixed!

---

## Step 4: Understanding What Changed

### ❌ BEFORE (Insecure)

```sql
-- Anyone could do this:
SELECT * FROM documents;  -- See ALL documents
SELECT encryption_key FROM documents;  -- Steal ALL encryption keys
UPDATE documents SET password = NULL;  -- Remove all passwords
DELETE FROM documents WHERE TRUE;  -- Delete everything
```

### ✅ AFTER (Secure)

```sql
-- Now only this works:
SELECT * FROM documents WHERE share_link = 'specific-link';  -- Only one doc
INSERT INTO documents VALUES (...);  -- Upload allowed

-- These now FAIL:
SELECT * FROM documents;  -- ❌ Permission denied
UPDATE documents SET ...;  -- ❌ No policy exists  
DELETE FROM documents;     -- ❌ No policy exists
```

---

## Step 5: How Your Application Accesses Data

Your application code (`ViewDocument.tsx`, `DataRoom.tsx`) already queries correctly:

```typescript
// ✅ CORRECT - This still works
const { data } = await supabase
  .from('documents')
  .select('*')
  .eq('share_link', shareLink)  // ← Querying by share_link
  .single();
```

This is secure because:
1. It only requests ONE specific document
2. Uses the share_link (which is public anyway)
3. RLS policy allows reading individual documents

```typescript
// ❌ WRONG - This would fail now
const { data } = await supabase
  .from('documents')
  .select('*');  // ← No WHERE clause = tries to read all
```

---

## Step 6: Future Security Improvements

After applying this fix, consider these next steps:

### High Priority
1. **Implement Password Hashing** (See `fix_password_security.sql` - next migration)
2. **Add Real Email Verification** (Supabase Edge Function + Email service)
3. **Add User Authentication** (Clerk or Supabase Auth)

### Medium Priority  
4. **Rate Limiting** (Supabase rate limiting or Cloudflare)
5. **Input Validation** (Sanitize file names, validate emails)
6. **Security Headers** (CSP, HSTS, etc.)

### Low Priority
7. **CAPTCHA** (Prevent bot uploads)
8. **Audit Logging** (Track who accessed what)

---

## Troubleshooting

### "My share links stopped working!"

**Check 1:** Are you querying by share_link?
```typescript
// Make sure you have .eq('share_link', shareLink)
```

**Check 2:** Is the bucket still accessible?
- If you made it private, you need signed URLs
- Or keep it public since files are encrypted

### "I can't upload files anymore"

The INSERT policy should still work. Check:
1. Is the policy named "Allow Anonymous Uploads" present?
2. Run: `SELECT * FROM pg_policies WHERE tablename = 'documents' AND cmd = 'INSERT';`
3. If missing, re-run the migration

### "I need to update/delete documents"

Updates and deletes are now blocked for security. Options:

**Option A:** Create a Supabase Edge Function with service_role key
```typescript
// edge-function/delete-document.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')  // Has full access
)

// Add your authorization logic here
await supabase.from('documents').delete().eq('id', docId)
```

**Option B:** Use Supabase Dashboard (manual admin access)

---

## Emergency Rollback

If something goes wrong and you need to rollback:

```sql
-- WARNING: This restores the INSECURE state
-- Only use if absolutely necessary

DROP POLICY IF EXISTS "Secure Read by Share Link" ON documents;

CREATE POLICY "Public Read Access"
ON documents FOR SELECT
USING (true);

CREATE POLICY "Allow Updates"
ON documents FOR UPDATE
USING (true);

CREATE POLICY "Allow Deletes"
ON documents FOR DELETE  
USING (true);
```

Then contact support to properly fix the issue.

---

## Success Checklist

- [ ] Ran `fix_rls_security.sql` in Supabase Dashboard
- [ ] Verified policies using Test 1
- [ ] Confirmed mass read fails (Test 2)
- [ ] Confirmed updates fail (Test 3)  
- [ ] Tested share links still work (Test 4)
- [ ] Decided on storage bucket strategy (public or private)
- [ ] Application uploads work
- [ ] Application downloads work
- [ ] Documented changes for team

---

## Questions?

Common questions:

**Q: Will this break my existing share links?**  
A: No! Existing links will continue to work as long as you query by share_link.

**Q: Can I still upload files anonymously?**  
A: Yes! The INSERT policy allows anonymous uploads.

**Q: What about encryption keys? Are they safe now?**  
A: Much safer! They're only readable when querying a specific document by share_link, not in bulk.

**Q: Do I need user authentication for this to work?**  
A: No, but it's recommended for the next phase of security improvements.

---

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review the security audit report
3. Test each step individually
4. Check Supabase logs for error messages

Remember: **DO NOT DEPLOY** to production until all tests pass! ✅
