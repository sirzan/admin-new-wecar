
-- 1) profiles.is_agency flag
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_agency boolean NOT NULL DEFAULT false;

-- 2) agencies table
CREATE TABLE public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  logo text,
  description text,
  city text,
  address text,
  phone text,
  whatsapp text,
  hours text,
  rfc text,
  legal_name text,
  fiscal_address text,
  plan text NOT NULL DEFAULT 'agencia',
  plan_expires_at timestamptz,
  max_cars integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.agencies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.agencies TO authenticated;
GRANT ALL ON public.agencies TO service_role;

ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agencies are publicly viewable"
ON public.agencies FOR SELECT
USING (true);

CREATE POLICY "Owners can insert their agency"
ON public.agencies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners or admins update agency"
ON public.agencies FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Owners or admins delete agency"
ON public.agencies FOR DELETE
TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER agencies_updated_at
BEFORE UPDATE ON public.agencies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3) agency_members table
CREATE TYPE public.agency_role AS ENUM ('admin', 'seller');

CREATE TABLE public.agency_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  role public.agency_role NOT NULL DEFAULT 'seller',
  status text NOT NULL DEFAULT 'invited',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agency_id, invited_email)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agency_members TO authenticated;
GRANT ALL ON public.agency_members TO service_role;

ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

-- Security definer helper to check membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_agency_member(_agency_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agencies a WHERE a.id = _agency_id AND a.owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.agency_members m
    WHERE m.agency_id = _agency_id AND m.user_id = _user_id AND m.status = 'active'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_agency_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_agency_member(uuid, uuid) TO authenticated;

CREATE POLICY "Agency owner or members read team"
ON public.agency_members FOR SELECT
TO authenticated
USING (
  public.is_agency_member(agency_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Agency owner manages team"
ON public.agency_members FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid())
);

CREATE POLICY "Agency owner updates team"
ON public.agency_members FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid())
  OR user_id = auth.uid()
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid())
  OR user_id = auth.uid()
);

CREATE POLICY "Agency owner deletes team"
ON public.agency_members FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.agencies a WHERE a.id = agency_id AND a.owner_id = auth.uid())
);

CREATE TRIGGER agency_members_updated_at
BEFORE UPDATE ON public.agency_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4) cars.seller_id (vendedor asignado dentro de la agencia)
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL;
GRANT SELECT (seller_id, agency_id) ON public.cars TO anon, authenticated;

-- 5) leads table
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp','call','form','message')),
  contact_name text,
  contact_phone text,
  contact_email text,
  message text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT INSERT ON public.leads TO anon;
GRANT ALL ON public.leads TO service_role;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- anyone (anon or authenticated) can submit a lead for any car
CREATE POLICY "Anyone can create leads"
ON public.leads FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Car owner or agency reads leads"
ON public.leads FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR seller_id = auth.uid()
  OR (agency_id IS NOT NULL AND public.is_agency_member(agency_id, auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Car owner or agency updates leads"
ON public.leads FOR UPDATE
TO authenticated
USING (
  owner_id = auth.uid()
  OR seller_id = auth.uid()
  OR (agency_id IS NOT NULL AND public.is_agency_member(agency_id, auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  owner_id = auth.uid()
  OR seller_id = auth.uid()
  OR (agency_id IS NOT NULL AND public.is_agency_member(agency_id, auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Car owner or agency deletes leads"
ON public.leads FOR DELETE
TO authenticated
USING (
  owner_id = auth.uid()
  OR (agency_id IS NOT NULL AND public.is_agency_member(agency_id, auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);

CREATE TRIGGER leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 6) RPC: my_agency() returns the agency the current user owns or belongs to
CREATE OR REPLACE FUNCTION public.my_agency()
RETURNS public.agencies
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.* FROM public.agencies a
  WHERE a.owner_id = auth.uid()
  UNION
  SELECT a.* FROM public.agencies a
  JOIN public.agency_members m ON m.agency_id = a.id
  WHERE m.user_id = auth.uid() AND m.status = 'active'
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.my_agency() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_agency() TO authenticated;
