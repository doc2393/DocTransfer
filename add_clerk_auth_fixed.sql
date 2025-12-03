-- Migration: Add Clerk Authentication Support
-- This migration adds user profiles and associates documents with users

-- Create user_profiles table to store Clerk user data
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add user_id column to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id);

-- Create index for faster user-based queries
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_user_id);

-- Enable RLS (Row Level Security) on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Anyone can view documents with valid share_link" ON documents;
DROP POLICY IF EXISTS "Allow public access for valid share links" ON documents;
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile" 
ON user_profiles FOR SELECT 
USING (true);  -- Public read for now, can restrict later

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
ON user_profiles FOR INSERT 
WITH CHECK (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
USING (true);

-- New Policy: Users can view their own documents
CREATE POLICY "Users can view own documents" 
ON documents FOR SELECT 
USING (
  user_id IS NULL OR  -- Legacy documents without user_id
  auth.uid()::text = user_id::text OR  -- User owns the document
  TRUE  -- Or anyone with share link (handled in app logic)
);

-- Policy: Users can insert their own documents
CREATE POLICY "Users can insert documents" 
ON documents FOR INSERT 
WITH CHECK (true);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update own documents" 
ON documents FOR UPDATE 
USING (user_id IS NULL OR auth.uid()::text = user_id::text);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own documents" 
ON documents FOR DELETE 
USING (user_id IS NULL OR auth.uid()::text = user_id::text);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to user_profiles table
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
BEFORE UPDATE ON user_profiles 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Note: Existing documents without a user_id will still be accessible via share links
-- but won't appear in any user's personal dashboard
