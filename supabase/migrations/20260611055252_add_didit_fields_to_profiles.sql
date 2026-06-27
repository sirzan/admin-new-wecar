ALTER TABLE public.profiles
  ADD COLUMN didit_session_id text,
  ADD COLUMN didit_status text DEFAULT 'unverified',
  ADD COLUMN didit_verified_at timestamptz;
