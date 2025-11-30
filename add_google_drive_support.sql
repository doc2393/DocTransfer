-- Add Google Drive support columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS storage_type VARCHAR(20) DEFAULT 'supabase',
ADD COLUMN IF NOT EXISTS google_drive_file_id TEXT,
ADD COLUMN IF NOT EXISTS google_drive_link TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_storage_type ON documents(storage_type);
CREATE INDEX IF NOT EXISTS idx_documents_google_drive_file_id ON documents(google_drive_file_id);
