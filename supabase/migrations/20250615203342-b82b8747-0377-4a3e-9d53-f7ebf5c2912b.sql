
-- Primeiro, remover completamente os registros com company_id null
DELETE FROM public.financial_entries WHERE company_id IS NULL;

-- Agora sim, tornar a coluna NOT NULL
ALTER TABLE public.financial_entries ALTER COLUMN company_id SET NOT NULL;

-- Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "Users can view company financial_entries" ON public.financial_entries;
DROP POLICY IF EXISTS "Users can insert company financial_entries" ON public.financial_entries;
DROP POLICY IF EXISTS "Users can update company financial_entries" ON public.financial_entries;
DROP POLICY IF EXISTS "Users can delete company financial_entries" ON public.financial_entries;

-- Recriar as políticas corretas para financial_entries
CREATE POLICY "Users can view company financial_entries" ON public.financial_entries
  FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert company financial_entries" ON public.financial_entries
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update company financial_entries" ON public.financial_entries
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete company financial_entries" ON public.financial_entries
  FOR DELETE USING (company_id = public.get_user_company_id());
