-- Fix get_user_company_id function to properly return company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;