
-- 1) Restrict access to sensitive vehicle identifiers (vin, plates, serial_number)
-- Keep the public SELECT row policy, but use column-level grants to hide sensitive columns
-- from anon and authenticated. Owners/admins read these via SECURITY DEFINER RPC below.

REVOKE SELECT ON public.cars FROM anon, authenticated;

GRANT SELECT (
  id, owner_id, brand, model, year, km, price, city, status, description,
  image, gallery, transmission, fuel, body, color, featured,
  created_at, updated_at, accepts_trade, trade_preference, plan
) ON public.cars TO anon, authenticated;

-- Owners and admins need to write to sensitive columns through normal INSERT/UPDATE flow.
GRANT INSERT, UPDATE, DELETE ON public.cars TO authenticated;

-- RPC for owner/admin to fetch sensitive identifiers for a single car.
CREATE OR REPLACE FUNCTION public.get_car_sensitive(_car_id uuid)
RETURNS TABLE(vin text, serial_number text, plates text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.cars c
    WHERE c.id = _car_id
      AND (c.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
    SELECT c.vin, c.serial_number, c.plates
    FROM public.cars c
    WHERE c.id = _car_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_car_sensitive(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_car_sensitive(uuid) TO authenticated;

-- 2) credito_tramites: allow users to insert their own application rows
CREATE POLICY "Users can insert own tramites"
ON public.credito_tramites
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3) credito-docs storage bucket: allow authenticated users to upload to their own folder
CREATE POLICY "Users upload credito docs to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'credito-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4) credito-docs storage bucket: allow authenticated users to read their own files
CREATE POLICY "Users read own credito docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'credito-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to read all credito docs for review
CREATE POLICY "Admins read all credito docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'credito-docs'
  AND public.has_role(auth.uid(), 'admin')
);
