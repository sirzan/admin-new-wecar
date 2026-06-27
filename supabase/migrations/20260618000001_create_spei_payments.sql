-- 1. Modify car_status enum to include 'pending'
ALTER TYPE public.car_status ADD VALUE IF NOT EXISTS 'pending';

-- 2. Create spei_payments table
CREATE TABLE IF NOT EXISTS public.spei_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    reference_code TEXT UNIQUE NOT NULL, -- Código generado por el sistema que el usuario pondrá en el concepto
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.spei_payments ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view own spei payments" 
ON public.spei_payments FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.id = spei_payments.subscription_id AND s.user_id = auth.uid()));

CREATE POLICY "Users can insert own spei payments" 
ON public.spei_payments FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.id = spei_payments.subscription_id AND s.user_id = auth.uid()));

CREATE POLICY "Admins manage spei payments" 
ON public.spei_payments FOR ALL 
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER trg_spei_payments_updated 
BEFORE UPDATE ON public.spei_payments 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. Seed bank_details in site_settings
INSERT INTO public.site_settings (key, value) VALUES
('bank_details', '{"bank": "BBVA", "clabe": "012345678901234567", "beneficiary": "Wecar S.A. de C.V."}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
