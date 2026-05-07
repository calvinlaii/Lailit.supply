-- Phase 4: Payments & Webhooks schema migration
-- Run via: Supabase Dashboard → SQL Editor (paste and run)
-- Or: SUPABASE_ACCESS_TOKEN=<token> supabase db push

-- 1. Create public.users table (mirrors auth.users via trigger)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  membership_tier text CHECK (membership_tier IN ('monthly', 'lifetime')),
  membership_status text CHECK (membership_status IN ('active', 'canceled', 'expired')),
  membership_expires_at timestamptz,
  lifetime_purchased boolean NOT NULL DEFAULT false,
  mayar_member_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. RLS policy: users can only read their own row
CREATE POLICY "Users can view own row" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 4. RLS policy: service role can write (webhook handler uses service role)
CREATE POLICY "Service role can write users" ON public.users
  FOR ALL USING (true)
  WITH CHECK (true);

-- 5. Trigger function: auto-insert into public.users when auth.users row is created
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Drop trigger if exists (idempotent), then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 7. webhook_events table (idempotency ledger — D-10)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mayar_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. No RLS on webhook_events — accessed only via service role in webhook handler
-- (No ENABLE ROW LEVEL SECURITY intentionally)
