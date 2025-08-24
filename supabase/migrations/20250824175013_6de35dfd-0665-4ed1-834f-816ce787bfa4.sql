-- Inserir empresa para o usuário atual se ele não tiver uma
INSERT INTO public.companies (name, segment, owner_id)
SELECT 
  'Up Açaí', 
  'Açaiteria', 
  'b548cc73-18f1-44b5-83be-5768e607dc59'
WHERE NOT EXISTS (
  SELECT 1 FROM public.companies 
  WHERE owner_id = 'b548cc73-18f1-44b5-83be-5768e607dc59'
);

-- Atualizar o perfil do usuário com o company_id
UPDATE public.profiles 
SET company_id = (
  SELECT id FROM public.companies 
  WHERE owner_id = 'b548cc73-18f1-44b5-83be-5768e607dc59'
  LIMIT 1
)
WHERE id = 'b548cc73-18f1-44b5-83be-5768e607dc59' 
AND company_id IS NULL;