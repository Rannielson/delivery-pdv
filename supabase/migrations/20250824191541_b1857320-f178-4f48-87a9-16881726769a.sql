-- 1) Garantir função correta para obter company_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 2) Backfill: definir company_id em orders usando a empresa do cliente (corrigido)
UPDATE public.orders 
SET company_id = (
  SELECT c.company_id 
  FROM public.customers c 
  WHERE c.id = orders.customer_id
)
WHERE orders.company_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.customers c 
    WHERE c.id = orders.customer_id 
    AND c.company_id IS NOT NULL
  );

-- 3) Para pedidos ainda sem company_id, usar do bairro se disponível
UPDATE public.orders 
SET company_id = (
  SELECT n.company_id 
  FROM public.neighborhoods n 
  WHERE n.id = orders.neighborhood_id
)
WHERE orders.company_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.neighborhoods n 
    WHERE n.id = orders.neighborhood_id 
    AND n.company_id IS NOT NULL
  );

-- 4) Para pedidos ainda sem company_id, usar do método de pagamento se disponível  
UPDATE public.orders 
SET company_id = (
  SELECT pm.company_id 
  FROM public.payment_methods pm 
  WHERE pm.id = orders.payment_method_id
)
WHERE orders.company_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.payment_methods pm 
    WHERE pm.id = orders.payment_method_id 
    AND pm.company_id IS NOT NULL
  );

-- 5) Trigger para sempre definir company_id ao inserir pedidos
CREATE OR REPLACE FUNCTION public.set_order_company_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company uuid;
BEGIN
  IF NEW.company_id IS NULL THEN
    -- Tentar pegar da empresa do cliente
    SELECT company_id INTO v_company FROM public.customers WHERE id = NEW.customer_id;
    IF v_company IS NOT NULL THEN
      NEW.company_id := v_company;
    ELSE
      -- Se não encontrar, usar do usuário atual
      NEW.company_id := public.get_user_company_id();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_order_company_id ON public.orders;
CREATE TRIGGER trg_set_order_company_id
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_company_id();

-- 6) Trigger para impedir mudança de company_id em updates
CREATE OR REPLACE FUNCTION public.prevent_order_company_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'Changing company_id is not allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_order_company_change ON public.orders;
CREATE TRIGGER trg_prevent_order_company_change
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.prevent_order_company_change();

-- 7) Tornar company_id obrigatório após backfill (apenas se não houver mais NULLs)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE company_id IS NULL) THEN
    ALTER TABLE public.orders ALTER COLUMN company_id SET NOT NULL;
  END IF;
END $$;