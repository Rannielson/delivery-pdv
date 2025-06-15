
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_budget_items ENABLE ROW LEVEL SECURITY;

-- Função para obter o company_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Dropar políticas existentes que podem conflitar
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update own company" ON public.companies;
DROP POLICY IF EXISTS "Users can view company customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert company customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update company customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete company customers" ON public.customers;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Políticas para companies
CREATE POLICY "Users can view own company" ON public.companies
  FOR SELECT USING (id = public.get_user_company_id());

CREATE POLICY "Users can update own company" ON public.companies
  FOR UPDATE USING (id = public.get_user_company_id());

-- Políticas para customers
CREATE POLICY "Users can view company customers" ON public.customers
  FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert company customers" ON public.customers
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update company customers" ON public.customers
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete company customers" ON public.customers
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Políticas para products
CREATE POLICY "Users can view company products" ON public.products
  FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert company products" ON public.products
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update company products" ON public.products
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete company products" ON public.products
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Políticas para neighborhoods
CREATE POLICY "Users can view company neighborhoods" ON public.neighborhoods
  FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert company neighborhoods" ON public.neighborhoods
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update company neighborhoods" ON public.neighborhoods
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete company neighborhoods" ON public.neighborhoods
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Políticas para payment_methods
CREATE POLICY "Users can view company payment_methods" ON public.payment_methods
  FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert company payment_methods" ON public.payment_methods
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update company payment_methods" ON public.payment_methods
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete company payment_methods" ON public.payment_methods
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Políticas para orders
CREATE POLICY "Users can view company orders" ON public.orders
  FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert company orders" ON public.orders
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update company orders" ON public.orders
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete company orders" ON public.orders
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Políticas para order_items
CREATE POLICY "Users can view company order_items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can insert company order_items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can update company order_items" ON public.order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can delete company order_items" ON public.order_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND orders.company_id = public.get_user_company_id()
    )
  );

-- Políticas para financial_entries
CREATE POLICY "Users can view company financial_entries" ON public.financial_entries
  FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert company financial_entries" ON public.financial_entries
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update company financial_entries" ON public.financial_entries
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete company financial_entries" ON public.financial_entries
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Políticas para cost_centers (global)
CREATE POLICY "All users can view cost_centers" ON public.cost_centers
  FOR SELECT TO authenticated USING (true);

-- Políticas para expense_categories (global)
CREATE POLICY "All users can view expense_categories" ON public.expense_categories
  FOR SELECT TO authenticated USING (true);

-- Políticas para purchase_budgets
CREATE POLICY "Users can view company purchase_budgets" ON public.purchase_budgets
  FOR SELECT USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can insert company purchase_budgets" ON public.purchase_budgets
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id());

CREATE POLICY "Users can update company purchase_budgets" ON public.purchase_budgets
  FOR UPDATE USING (company_id = public.get_user_company_id());

CREATE POLICY "Users can delete company purchase_budgets" ON public.purchase_budgets
  FOR DELETE USING (company_id = public.get_user_company_id());

-- Políticas para purchase_budget_items
CREATE POLICY "Users can view company purchase_budget_items" ON public.purchase_budget_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.purchase_budgets 
      WHERE purchase_budgets.id = purchase_budget_items.budget_id 
      AND purchase_budgets.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can insert company purchase_budget_items" ON public.purchase_budget_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchase_budgets 
      WHERE purchase_budgets.id = purchase_budget_items.budget_id 
      AND purchase_budgets.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can update company purchase_budget_items" ON public.purchase_budget_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.purchase_budgets 
      WHERE purchase_budgets.id = purchase_budget_items.budget_id 
      AND purchase_budgets.company_id = public.get_user_company_id()
    )
  );

CREATE POLICY "Users can delete company purchase_budget_items" ON public.purchase_budget_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.purchase_budgets 
      WHERE purchase_budgets.id = purchase_budget_items.budget_id 
      AND purchase_budgets.company_id = public.get_user_company_id()
    )
  );

-- Atualizar a função handle_new_user para criar empresa e associar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Criar nova empresa
  INSERT INTO public.companies (
    name,
    segment,
    owner_id
  ) VALUES (
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'Minha Empresa'),
    COALESCE(NEW.raw_user_meta_data->>'segment', 'Outros'),
    NEW.id
  ) RETURNING id INTO new_company_id;

  -- Criar perfil do usuário associado à empresa
  INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    cpf,
    company_id
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'cpf',
    new_company_id
  );

  RETURN NEW;
END;
$$;
