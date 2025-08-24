-- 1) Garantir função correta para obter company_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 2) Backfill: definir company_id em orders usando a empresa do cliente
UPDATE public.orders o
SET company_id = COALESCE(c.company_id, n.company_id, pm.company_id)
FROM public.customers c
LEFT JOIN public.neighborhoods n ON n.id = o.neighborhood_id
LEFT JOIN public.payment_methods pm ON pm.id = o.payment_method_id
WHERE o.company_id IS NULL
  AND c.id = o.customer_id;

-- 3) Corrigir possíveis divergências: alinhar company_id do pedido com o do cliente
UPDATE public.orders o
SET company_id = c.company_id
FROM public.customers c
WHERE c.id = o.customer_id
  AND o.company_id IS DISTINCT FROM c.company_id;

-- 4) Trigger para sempre definir company_id ao inserir pedidos
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
    SELECT company_id INTO v_company FROM public.customers WHERE id = NEW.customer_id;
    IF v_company IS NOT NULL THEN
      NEW.company_id := v_company;
    ELSE
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

-- 5) Trigger para impedir mudança de company_id em updates
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

-- 6) Tornar company_id obrigatório após backfill
ALTER TABLE public.orders
ALTER COLUMN company_id SET NOT NULL;