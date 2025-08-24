-- Corrigir pedido 31 especificamente com company_id correto
UPDATE public.orders 
SET company_id = (
  SELECT c.company_id 
  FROM public.customers c 
  WHERE c.id = orders.customer_id
  LIMIT 1
)
WHERE order_number = 31 
  AND company_id IS NULL;

-- Se ainda não tiver company_id, usar o da empresa do usuário atual
UPDATE public.orders 
SET company_id = 'b1a156f0-98b7-463c-b169-a9582e467e4d'
WHERE order_number = 31 
  AND company_id IS NULL;

-- Verificar se há outros pedidos órfãos e corrigi-los
UPDATE public.orders 
SET company_id = 'b1a156f0-98b7-463c-b169-a9582e467e4d'
WHERE company_id IS NULL;