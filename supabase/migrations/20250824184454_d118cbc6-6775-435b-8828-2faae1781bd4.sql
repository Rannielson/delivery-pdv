-- Idempotent financial entry trigger + uniqueness guard
-- 1) Create or replace function with existence check
CREATE OR REPLACE FUNCTION public.create_order_financial_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when transitioning into delivered/finalized and not previously in those
  IF NEW.status IN ('entregue', 'finalizado')
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND COALESCE(OLD.status, '') NOT IN ('entregue', 'finalizado')
  THEN
    -- Prevent duplicate income entry for the same order
    IF NOT EXISTS (
      SELECT 1 FROM public.financial_entries fe
      WHERE fe.order_id = NEW.id AND fe.entry_type = 'income'
    ) THEN
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
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Ensure a single trigger exists
DROP TRIGGER IF EXISTS trg_create_order_financial_entry ON public.orders;
CREATE TRIGGER trg_create_order_financial_entry
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (NEW.status IN ('entregue','finalizado') AND (OLD.status IS DISTINCT FROM NEW.status))
EXECUTE FUNCTION public.create_order_financial_entry();

-- 3) Add a partial unique index to enforce one income per order (defensive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_financial_income_per_order
ON public.financial_entries(order_id)
WHERE entry_type = 'income';