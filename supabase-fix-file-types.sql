-- Fix file_type values in artworks table
-- Convert MIME types to simplified types for gallery filtering

-- Update image types
UPDATE artworks
SET file_type = 'image'
WHERE file_type LIKE 'image/%' AND file_type != 'image/gif';

-- Update GIF type
UPDATE artworks
SET file_type = 'gif'
WHERE file_type = 'image/gif';

-- Update video types
UPDATE artworks
SET file_type = 'video'
WHERE file_type LIKE 'video/%';

-- Update audio/music types
UPDATE artworks
SET file_type = 'music'
WHERE file_type LIKE 'audio/%';

-- Verify the changes
SELECT file_type, COUNT(*) as count
FROM artworks
GROUP BY file_type
ORDER BY count DESC;
