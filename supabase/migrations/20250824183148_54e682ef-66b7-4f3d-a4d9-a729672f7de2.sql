-- Função de trigger para criar lançamento financeiro ao finalizar/entregar pedido
CREATE OR REPLACE FUNCTION public.create_order_financial_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('entregue', 'finalizado') AND (OLD.status IS DISTINCT FROM NEW.status) AND COALESCE(OLD.status, '') NOT IN ('entregue', 'finalizado') THEN
    INSERT INTO public.financial_entries (
      description,
      amount,
      entry_date,
      entry_time,
      entry_type,
      order_id,
      company_id,
      notes
    ) VALUES (
      'Venda - Pedido #' || NEW.order_number,
      COALESCE(NEW.total_amount, 0) + COALESCE(NEW.delivery_fee, 0),
      COALESCE(NEW.updated_at::date, now()::date),
      COALESCE(NEW.updated_at::time, now()::time),
      'income',
      NEW.id,
      NEW.company_id,
      'Lançamento automático de venda'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Criar trigger (substitui se já existir)
DROP TRIGGER IF EXISTS trg_create_order_financial_entry ON public.orders;
CREATE TRIGGER trg_create_order_financial_entry
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (NEW.status IN ('entregue','finalizado') AND (OLD.status IS DISTINCT FROM NEW.status))
EXECUTE FUNCTION public.create_order_financial_entry();