-- These SECURITY DEFINER functions run only as database triggers.
-- API users must not invoke them directly through the public schema.
revoke execute on function public.create_profile_for_new_user()
from public, anon, authenticated;

revoke execute on function public.rls_auto_enable()
from public, anon, authenticated;
