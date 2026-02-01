-- Migration: Add video support to community_templates
-- Run this in Supabase SQL Editor

-- Add media_type column to distinguish images from videos
ALTER TABLE community_templates
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';

-- Add duration column for videos (in seconds)
ALTER TABLE community_templates
ADD COLUMN IF NOT EXISTS duration NUMERIC;

-- Add thumbnail_url for video previews
ALTER TABLE community_templates
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Create index for filtering by media type
CREATE INDEX IF NOT EXISTS idx_templates_media_type ON community_templates(media_type);

-- Update existing templates to have media_type = 'image'
UPDATE community_templates SET media_type = 'image' WHERE media_type IS NULL;
