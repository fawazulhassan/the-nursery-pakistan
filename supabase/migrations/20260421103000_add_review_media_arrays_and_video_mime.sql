ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS media_urls text[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS media_types text[] NOT NULL DEFAULT '{}';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime'
]::text[]
WHERE id = 'review-images';
