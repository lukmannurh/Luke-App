-- Migration to add 'role' column to users table

-- Add 'role' column with a default of 'user'
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text not null default 'user';

-- Ensure role can only be 'user' or 'admin'
ALTER TABLE public.users ADD CONSTRAINT check_role_valid CHECK (role IN ('user', 'admin'));

-- Note: RLS policies on public.users generally only allow the user to update their own profile.
-- To prevent users from updating their own role to 'admin', we should add a specific policy or trigger.
-- However, since the current UPDATE policy for users might just be: `true` for their own ID,
-- we should probably revoke updating the role column, but Supabase doesn't support column-level UPDATE policies easily.
-- Instead, we can create a trigger to prevent 'role' changes by non-admins, but for now, 
-- we'll rely on our API not exposing the `role` field in standard update queries.
-- To be fully secure:
CREATE OR REPLACE FUNCTION protect_role_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If the role is being changed
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- In a real app, we'd check auth.uid() role. For this MVP, we just block role updates 
    -- from the client-side entirely via this trigger (admins will update via service role or console)
    -- Actually, service_role bypasses RLS, but does it bypass triggers? Triggers still run.
    -- To allow service_role to bypass:
    IF current_setting('role') = 'authenticated' THEN
      RAISE EXCEPTION 'Users cannot update their own role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_role_protection ON public.users;
CREATE TRIGGER ensure_role_protection
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION protect_role_update();
