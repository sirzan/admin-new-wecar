-- 1) Split agencies' sensitive fiscal data into a separate owner/admin-only table
CREATE TABLE IF NOT EXISTS public.agency_fiscal (
  agency_id uuid PRIMARY KEY REFERENCES public.agencies(id) ON DELETE CASCADE,
  rfc text,
  fiscal_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agency_fiscal TO authenticated;
GRANT ALL ON public.agency_fiscal TO service_role;

ALTER TABLE public.agency_fiscal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners or admins read fiscal" ON public.agency_fiscal
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners or admins insert fiscal" ON public.agency_fiscal
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners or admins update fiscal" ON public.agency_fiscal
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Owners or admins delete fiscal" ON public.agency_fiscal
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER agency_fiscal_updated_at BEFORE UPDATE ON public.agency_fiscal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Migrate existing data, then drop sensitive columns from public agencies table
INSERT INTO public.agency_fiscal (agency_id, rfc, fiscal_address)
SELECT id, rfc, fiscal_address FROM public.agencies
WHERE rfc IS NOT NULL OR fiscal_address IS NOT NULL
ON CONFLICT (agency_id) DO NOTHING;

ALTER TABLE public.agencies DROP COLUMN IF EXISTS rfc;
ALTER TABLE public.agencies DROP COLUMN IF EXISTS fiscal_address;

-- 2) Fix overly permissive INSERT policies (RLS Always True)
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;
CREATE POLICY "Anyone can create leads" ON public.leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    car_id IS NOT NULL
    AND (owner_id IS NULL OR owner_id = auth.uid())
    AND (seller_id IS NULL OR seller_id = auth.uid())
  );

-- car_versions: admins already manage; drop redundant always-true insert
DROP POLICY IF EXISTS "Authenticated can insert versions" ON public.car_versions;

-- 3) Add explicit SELECT policy for car-images storage bucket
DROP POLICY IF EXISTS "Public can read car images" ON storage.objects;
CREATE POLICY "Public can read car images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'car-images');
