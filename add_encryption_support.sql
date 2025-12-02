-- Migration: Add AES-256 Encryption Support to DocTransfer
-- This migration adds encryption metadata fields to the documents table

-- Add encryption metadata columns
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS encryption_key TEXT,
ADD COLUMN IF NOT EXISTS encryption_iv TEXT,
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_file_name TEXT,
ADD COLUMN IF NOT EXISTS original_file_type TEXT;

-- Note: password column will now store bcrypt hashes instead of plain text
-- Existing plain text passwords will be incompatible and need to be reset

-- Add comment to password column
COMMENT ON COLUMN documents.password IS 'Bcrypt hash of password (not plain text)';

-- Update existing records to mark as not encrypted
UPDATE documents 
SET is_encrypted = false 
WHERE is_encrypted IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_documents_encrypted ON documents(is_encrypted);

-- Display migration info
DO $$
BEGIN
    RAISE NOTICE 'Encryption migration completed successfully';
    RAISE NOTICE 'Important: Existing documents are NOT encrypted';
    RAISE NOTICE 'Important: Existing passwords are plain text and need to be re-set';
END $$;
