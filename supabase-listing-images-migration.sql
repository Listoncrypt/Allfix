INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  TRUE,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = TRUE,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Block listing image uploads for anonymous users" ON storage.objects;
CREATE POLICY "Block listing image uploads for anonymous users"
  ON storage.objects AS RESTRICTIVE
  FOR INSERT TO anon
  WITH CHECK (bucket_id <> 'listing-images');

DROP POLICY IF EXISTS "Block listing image uploads for authenticated users" ON storage.objects;
CREATE POLICY "Block listing image uploads for authenticated users"
  ON storage.objects AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id <> 'listing-images');

DROP POLICY IF EXISTS "Block listing image changes for anonymous users" ON storage.objects;
CREATE POLICY "Block listing image changes for anonymous users"
  ON storage.objects AS RESTRICTIVE
  FOR UPDATE TO anon
  USING (bucket_id <> 'listing-images')
  WITH CHECK (bucket_id <> 'listing-images');

DROP POLICY IF EXISTS "Block listing image changes for authenticated users" ON storage.objects;
CREATE POLICY "Block listing image changes for authenticated users"
  ON storage.objects AS RESTRICTIVE
  FOR UPDATE TO authenticated
  USING (bucket_id <> 'listing-images')
  WITH CHECK (bucket_id <> 'listing-images');

DROP POLICY IF EXISTS "Block listing image deletion for anonymous users" ON storage.objects;
CREATE POLICY "Block listing image deletion for anonymous users"
  ON storage.objects AS RESTRICTIVE
  FOR DELETE TO anon
  USING (bucket_id <> 'listing-images');

DROP POLICY IF EXISTS "Block listing image deletion for authenticated users" ON storage.objects;
CREATE POLICY "Block listing image deletion for authenticated users"
  ON storage.objects AS RESTRICTIVE
  FOR DELETE TO authenticated
  USING (bucket_id <> 'listing-images');
