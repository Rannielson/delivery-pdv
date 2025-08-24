-- Criar tabela companies se não existir
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  segment TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela companies
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company" 
ON public.companies 
FOR SELECT 
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own company" ON public.companies;
CREATE POLICY "Users can create their own company" 
ON public.companies 
FOR INSERT 
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
CREATE POLICY "Users can update their own company" 
ON public.companies 
FOR UPDATE 
USING (owner_id = auth.uid());

-- Função para obter company_id do usuário atual (corrigir search_path)
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Corrigir função handle_new_user (search_path)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Criar nova empresa
  INSERT INTO public.companies (
    name,
    segment,
    owner_id
  ) VALUES (
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'Minha Empresa'),
    COALESCE(NEW.raw_user_meta_data->>'segment', 'Outros'),
    NEW.id
  ) RETURNING id INTO new_company_id;

  -- Criar perfil do usuário associado à empresa
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    cpf,
    company_id
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'cpf',
    new_company_id
  );

  RETURN NEW;
END;
$$;