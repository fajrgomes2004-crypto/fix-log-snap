CREATE TABLE public.maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 120),
  equipment text NOT NULL CHECK (char_length(equipment) BETWEEN 2 AND 120),
  maintenance_date date NOT NULL,
  description text NOT NULL CHECK (char_length(description) BETWEEN 5 AND 4000),
  photo_urls text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.maintenance_records TO anon;
GRANT SELECT, INSERT ON public.maintenance_records TO authenticated;
GRANT ALL ON public.maintenance_records TO service_role;

ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read maintenance records"
ON public.maintenance_records
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Public can create maintenance records"
ON public.maintenance_records
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(title) BETWEEN 2 AND 120
  AND char_length(equipment) BETWEEN 2 AND 120
  AND char_length(description) BETWEEN 5 AND 4000
  AND cardinality(photo_urls) <= 6
);

CREATE INDEX maintenance_records_date_idx
ON public.maintenance_records (maintenance_date DESC, created_at DESC);

CREATE INDEX maintenance_records_search_idx
ON public.maintenance_records
USING gin (to_tsvector('portuguese', title || ' ' || equipment || ' ' || description));

CREATE POLICY "Public can view maintenance photos"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'maintenance-photos');

CREATE POLICY "Public can upload maintenance photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'maintenance-photos'
  AND lower(storage.extension(name)) IN ('jpg', 'jpeg', 'png', 'webp')
);