CREATE TABLE IF NOT EXISTS public.paypal_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    paypal_order_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.paypal_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own paypal payments"
ON public.paypal_payments FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.id = paypal_payments.subscription_id AND s.user_id = auth.uid()
));

CREATE POLICY "Users can insert own paypal payments"
ON public.paypal_payments FOR INSERT
WITH CHECK (EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.id = paypal_payments.subscription_id AND s.user_id = auth.uid()
));

CREATE POLICY "Admins manage paypal payments"
ON public.paypal_payments FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (key, value) VALUES
('paypal_details', '{"email": "paypal@wecar.mx"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
