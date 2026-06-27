-- Fix 1: Add WITH CHECK to cars UPDATE policy to prevent ownership transfer
DROP POLICY IF EXISTS "Owners or admins can update cars" ON public.cars;
CREATE POLICY "Owners or admins can update cars" ON public.cars
FOR UPDATE
USING ((auth.uid() = owner_id) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK ((auth.uid() = owner_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix 2 & 3: Lock down SECURITY DEFINER pgmq wrapper functions
-- Set search_path and revoke public/anon/authenticated EXECUTE (service_role only)
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;