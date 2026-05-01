-- Check current file_type values in artworks table
-- This will help identify if music files are properly categorized

-- 1. Show all unique file_type values and their counts
SELECT
    file_type,
    COUNT(*) as count,
    STRING_AGG(DISTINCT SUBSTRING(file_url FROM '.([^.]+)$'), ', ') as file_extensions
FROM artworks
GROUP BY file_type
ORDER BY count DESC;

-- 2. Show artworks with audio file extensions but wrong file_type
SELECT
    id,
    title,
    file_type,
    file_url,
    SUBSTRING(file_url FROM '.([^.]+)$') as extension
FROM artworks
WHERE
    (file_url ILIKE '%.mp3' OR
     file_url ILIKE '%.wav' OR
     file_url ILIKE '%.ogg' OR
     file_url ILIKE '%.aac' OR
     file_url ILIKE '%.m4a')
    AND file_type != 'music'
ORDER BY created_at DESC;

-- 3. Show all music type artworks
SELECT
    id,
    title,
    file_type,
    file_url,
    created_at
FROM artworks
WHERE file_type = 'music' OR file_type LIKE 'audio%'
ORDER BY created_at DESC;

-- 4. Fix any misclassified audio files
UPDATE artworks
SET file_type = 'music'
WHERE
    (file_url ILIKE '%.mp3' OR
     file_url ILIKE '%.wav' OR
     file_url ILIKE '%.ogg' OR
     file_url ILIKE '%.aac' OR
     file_url ILIKE '%.m4a')
    AND file_type != 'music';

-- 5. Verify the fix
SELECT
    'After fix:' as status,
    file_type,
    COUNT(*) as count
FROM artworks
GROUP BY file_type
ORDER BY count DESC;
