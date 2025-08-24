-- Corrigir pedidos existentes vinculando-os à empresa do usuário
UPDATE public.orders 
SET company_id = (
  SELECT id FROM public.companies 
  WHERE owner_id = 'b548cc73-18f1-44b5-83be-5768e607dc59'
  LIMIT 1
)
WHERE company_id IS NULL;