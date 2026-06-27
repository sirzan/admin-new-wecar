
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0;

UPDATE public.plans SET commission_rate = 4.00 WHERE key_name = 'basico';
UPDATE public.plans SET commission_rate = 3.50 WHERE key_name = 'destacado';
UPDATE public.plans SET commission_rate = 3.00 WHERE key_name = 'premium';
UPDATE public.plans SET commission_rate = 3.00 WHERE key_name = 'agencia';

CREATE TABLE IF NOT EXISTS public.sale_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id),
  seller_id UUID NOT NULL,
  sale_price NUMERIC(12,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount NUMERIC(12,2) NOT NULL,
  financed BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_commissions TO authenticated;
GRANT ALL ON public.sale_commissions TO service_role;

ALTER TABLE public.sale_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their commissions"
  ON public.sale_commissions FOR SELECT TO authenticated
  USING (seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage commissions"
  ON public.sale_commissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_sale_commissions_updated_at
  BEFORE UPDATE ON public.sale_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
