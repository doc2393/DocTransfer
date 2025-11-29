-- Run this script in your Supabase SQL Editor to update the existing table

-- Add screenshot_protection if it doesn't exist
ALTER TABLE documents ADD COLUMN IF NOT EXISTS screenshot_protection BOOLEAN DEFAULT FALSE;

-- Add email_verification if it doesn't exist
ALTER TABLE documents ADD COLUMN IF NOT EXISTS email_verification BOOLEAN DEFAULT FALSE;

-- Add allowed_email if it doesn't exist
ALTER TABLE documents ADD COLUMN IF NOT EXISTS allowed_email TEXT;
