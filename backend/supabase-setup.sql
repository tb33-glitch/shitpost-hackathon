-- =====================================================
-- Supabase Setup for shitpost.pro Templates
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Create storage bucket for template images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'templates',
  'templates',
  true,  -- Public read access
  10485760,  -- 10MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- 2. Storage policies for the templates bucket

-- Allow anyone to read template images (public)
CREATE POLICY "Public read access for templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'templates');

-- Allow service role to upload (backend only)
CREATE POLICY "Service role can upload templates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'templates');

-- Allow service role to delete (for moderation)
CREATE POLICY "Service role can delete templates"
ON storage.objects FOR DELETE
USING (bucket_id = 'templates');

-- 3. Create/update community_templates table
CREATE TABLE IF NOT EXISTS community_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_cid TEXT,
  storage_path TEXT,  -- Path in Supabase Storage
  category TEXT DEFAULT 'templates',
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'approved',
  submitted_by TEXT,
  display_name TEXT,
  source_url TEXT,
  source_type TEXT DEFAULT 'upload',  -- 'scraper', 'upload', 'curated', 'migration'
  is_curated BOOLEAN DEFAULT false,
  xp INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add new columns if table already exists
ALTER TABLE community_templates
ADD COLUMN IF NOT EXISTS storage_path TEXT,
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'upload',
ADD COLUMN IF NOT EXISTS is_curated BOOLEAN DEFAULT false;

-- 4. Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_community_templates_status ON community_templates(status);
CREATE INDEX IF NOT EXISTS idx_community_templates_category ON community_templates(category);
CREATE INDEX IF NOT EXISTS idx_community_templates_created_at ON community_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_templates_is_curated ON community_templates(is_curated);
CREATE INDEX IF NOT EXISTS idx_community_templates_submitted_by ON community_templates(submitted_by);

-- 5. Enable Row Level Security (optional but recommended)
ALTER TABLE community_templates ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read approved templates
CREATE POLICY "Anyone can read approved templates"
ON community_templates FOR SELECT
USING (status = 'approved');

-- Allow service role full access (backend)
CREATE POLICY "Service role has full access"
ON community_templates FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_community_templates_updated_at ON community_templates;
CREATE TRIGGER update_community_templates_updated_at
  BEFORE UPDATE ON community_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Verification queries (run these to check setup)
-- =====================================================

-- Check bucket exists:
-- SELECT * FROM storage.buckets WHERE id = 'templates';

-- Check table structure:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'community_templates';

-- Check indexes:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'community_templates';
