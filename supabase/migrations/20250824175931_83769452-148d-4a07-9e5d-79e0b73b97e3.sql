-- Atualizar pedidos sem company_id para a empresa do usuário atual
UPDATE public.orders 
SET company_id = (
  SELECT id FROM public.companies WHERE owner_id = 'b548cc73-18f1-44b5-83be-5768e607dc59' LIMIT 1
)
WHERE company_id IS NULL;