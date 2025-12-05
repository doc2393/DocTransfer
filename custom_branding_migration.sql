-- Create branding_settings table
CREATE TABLE IF NOT EXISTS public.branding_settings (
    user_id text PRIMARY KEY, -- Linked to Clerk User ID
    subdomain text UNIQUE,
    site_url text,
    logo_url text,
    brand_color text DEFAULT '#4f46e5', -- Default indigo-600
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.branding_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to view their own settings
CREATE POLICY "Users can view their own branding settings"
    ON public.branding_settings
    FOR SELECT
    USING (auth.uid()::text = user_id);

-- Allow users to insert their own settings
CREATE POLICY "Users can insert their own branding settings"
    ON public.branding_settings
    FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Allow users to update their own settings
CREATE POLICY "Users can update their own branding settings"
    ON public.branding_settings
    FOR UPDATE
    USING (auth.uid()::text = user_id);

-- Allow public access to read branding settings (needed for ViewDocument page)
-- We might want to restrict this to only fetch by user_id if we can, 
-- but for the viewer page, we need to fetch by the document owner's ID.
-- Since branding info is generally public (logo, color), allowing public read is acceptable.
CREATE POLICY "Public can view branding settings"
    ON public.branding_settings
    FOR SELECT
    USING (true);

-- Create storage bucket for branding assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for branding bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'branding' );

CREATE POLICY "Authenticated users can upload branding assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'branding'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own branding assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'branding'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
