-- 1) Permitir backfill: bloquear troca de company_id apenas se já havia valor
CREATE OR REPLACE FUNCTION public.prevent_order_company_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.company_id IS NOT NULL AND NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'Changing company_id is not allowed';
  END IF;
  RETURN NEW;
END;
$$;

-- Recriar trigger para garantir uso da função atualizada
DROP TRIGGER IF EXISTS trg_prevent_order_company_change ON public.orders;
CREATE TRIGGER trg_prevent_order_company_change
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.prevent_order_company_change();

-- 2) Backfill: primeiro via cliente
UPDATE public.orders o
SET company_id = c.company_id
FROM public.customers c
WHERE o.customer_id = c.id
  AND o.company_id IS NULL
  AND c.company_id IS NOT NULL;

-- 3) Backfill: depois via bairro
UPDATE public.orders o
SET company_id = n.company_id
FROM public.neighborhoods n
WHERE o.neighborhood_id = n.id
  AND o.company_id IS NULL
  AND n.company_id IS NOT NULL;

-- 4) Backfill: por fim via método de pagamento
UPDATE public.orders o
SET company_id = pm.company_id
FROM public.payment_methods pm
WHERE o.payment_method_id = pm.id
  AND o.company_id IS NULL
  AND pm.company_id IS NOT NULL;

-- 5) Garantir que o pedido #31 recebeu company_id; se ainda estiver NULL, usar a empresa existente do usuário reportado
UPDATE public.orders
SET company_id = 'b1a156f0-98b7-463c-b169-a9582e467e4d'
WHERE order_number = 31 AND company_id IS NULL;

-- 6) Opcional: marcar coluna NOT NULL se não houver mais nulos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE company_id IS NULL) THEN
    ALTER TABLE public.orders ALTER COLUMN company_id SET NOT NULL;
  END IF;
END $$;