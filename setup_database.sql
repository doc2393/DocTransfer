-- Create the 'documents' table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    share_link TEXT UNIQUE,
    password TEXT,
    expires_at TIMESTAMPTZ,
    allow_download BOOLEAN DEFAULT TRUE,
    custom_domain TEXT,
    screenshot_protection BOOLEAN DEFAULT FALSE,
    email_verification BOOLEAN DEFAULT FALSE,
    apply_watermark BOOLEAN DEFAULT FALSE,
    request_signature BOOLEAN DEFAULT FALSE,
    allowed_email TEXT
);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- SAFELY Create policies
-- Drop them first to avoid errors

DROP POLICY IF EXISTS "Public Read Access" ON documents;
CREATE POLICY "Public Read Access"
ON documents FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow Anonymous Uploads" ON documents;
CREATE POLICY "Allow Anonymous Uploads"
ON documents FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow Updates" ON documents;
CREATE POLICY "Allow Updates"
ON documents FOR UPDATE
USING (true);

DROP POLICY IF EXISTS "Allow Deletes" ON documents;
CREATE POLICY "Allow Deletes"
ON documents FOR DELETE
USING (true);
