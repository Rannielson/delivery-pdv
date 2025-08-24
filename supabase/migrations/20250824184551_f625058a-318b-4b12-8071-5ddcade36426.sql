-- First remove duplicates, then prevent future ones
-- Step 1: Delete duplicate financial entries (keep oldest)
DELETE FROM public.financial_entries 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM public.financial_entries 
  WHERE entry_type = 'income' AND order_id IS NOT NULL
  GROUP BY order_id
) AND entry_type = 'income' AND order_id IS NOT NULL;

-- Step 2: Update trigger function to prevent duplicates
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

-- Step 3: Now create the unique constraint (after cleaning duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS uq_financial_income_per_order
ON public.financial_entries(order_id)
WHERE entry_type = 'income' AND order_id IS NOT NULL;