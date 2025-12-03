-- Create table to track individual document views
CREATE TABLE IF NOT EXISTS document_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  viewer_id TEXT, -- Anonymous ID stored in local storage to track unique viewers
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0, -- Time spent viewing (can be updated on page leave)
  user_agent TEXT,
  ip_address TEXT
);

-- Index for faster aggregation
CREATE INDEX IF NOT EXISTS idx_document_views_document_id ON document_views(document_id);
CREATE INDEX IF NOT EXISTS idx_document_views_viewer_id ON document_views(viewer_id);

-- Enable RLS
ALTER TABLE document_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert a view (public access for viewing documents)
CREATE POLICY "Anyone can insert views" 
ON document_views FOR INSERT 
WITH CHECK (true);

-- Policy: Users can view stats for their own documents
CREATE POLICY "Users can view stats for own documents" 
ON document_views FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM documents 
    WHERE documents.id = document_views.document_id 
    AND (documents.user_id = auth.uid() OR documents.user_id IS NULL)
  )
);

-- Create a view to aggregate statistics
CREATE OR REPLACE VIEW document_stats AS
SELECT 
  d.id AS document_id,
  d.user_id,
  COUNT(dv.id) AS total_views,
  COUNT(DISTINCT dv.viewer_id) AS unique_viewers,
  COALESCE(AVG(dv.duration_seconds), 0) AS avg_view_time_seconds
FROM documents d
LEFT JOIN document_views dv ON d.id = dv.document_id
GROUP BY d.id, d.user_id;

-- Grant access to the view
GRANT SELECT ON document_stats TO authenticated;
GRANT SELECT ON document_stats TO anon;
