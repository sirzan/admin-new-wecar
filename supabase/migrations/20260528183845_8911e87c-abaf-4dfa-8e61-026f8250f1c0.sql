
-- Bucket privado para los documentos del trámite de crédito
INSERT INTO storage.buckets (id, name, public)
VALUES ('credito-docs', 'credito-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Solo el service role puede leer/escribir; los uploads pasarán por la server route con service role
CREATE POLICY "Service role manages credito-docs"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'credito-docs' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'credito-docs' AND auth.role() = 'service_role');

-- Tabla de trámites de crédito
CREATE TABLE public.credito_tramites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  nombre text NOT NULL,
  email text NOT NULL,
  telefono text NOT NULL,
  score integer NOT NULL,
  nivel text,
  inputs jsonb NOT NULL,
  ofertas_elegibles jsonb NOT NULL DEFAULT '[]'::jsonb,
  ine_path text NOT NULL,
  domicilio_path text NOT NULL,
  estado_cuenta_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.credito_tramites TO authenticated;
GRANT ALL ON public.credito_tramites TO service_role;

ALTER TABLE public.credito_tramites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all tramites"
ON public.credito_tramites
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own tramites"
ON public.credito_tramites
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
