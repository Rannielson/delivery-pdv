
export interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface NewOrder {
  customer_id: string;
  neighborhood_id: string;
  payment_method_id: string;
  notes: string;
  items: OrderItem[];
}
