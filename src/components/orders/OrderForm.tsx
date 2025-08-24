import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { formatBrazilDateTime } from "@/utils/timezone";
import { useAuth } from "@/hooks/useAuth";
interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function OrderForm() {
  const [customer_id, setCustomerId] = useState<string>("");
  const [neighborhood_id, setNeighborhoodId] = useState<string>("");
  const [payment_method_id, setPaymentMethodId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: neighborhoods } = useQuery({
    queryKey: ["neighborhoods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neighborhoods")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (neighborhood_id) {
      const selectedNeighborhood = neighborhoods?.find(n => n.id === neighborhood_id);
      if (selectedNeighborhood) {
        setDeliveryFee(Number(selectedNeighborhood.delivery_fee));
      }
    }
  }, [neighborhood_id, neighborhoods]);

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const { brazilDateTime } = formatBrazilDateTime(new Date());
      
      // Criar o pedido
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          ...orderData,
          created_at: brazilDateTime,
          updated_at: brazilDateTime
        })
        .select()
        .single();
      
      if (orderError) throw orderError;

      // Criar os itens do pedido
      if (orderItems.length > 0) {
        const itemsToInsert = orderItems.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(itemsToInsert);
        
        if (itemsError) throw itemsError;
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      resetForm();
      toast.success("Pedido criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar pedido: " + error.message);
    },
  });

  const resetForm = () => {
    setCustomerId("");
    setNeighborhoodId("");
    setPaymentMethodId("");
    setNotes("");
    setOrderItems([]);
    setDeliveryFee(0);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, {
      product_id: "",
      quantity: 1,
      unit_price: 0,
      total_price: 0
    }]);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'product_id') {
      const selectedProduct = products?.find(p => p.id === value);
      if (selectedProduct) {
        newItems[index].unit_price = Number(selectedProduct.price);
      }
    }
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setOrderItems(newItems);
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.total_price, 0);
  const grandTotal = totalAmount + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customer_id || !neighborhood_id || !payment_method_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    if (orderItems.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido");
      return;
    }

    if (!userProfile?.company_id) {
      toast.error("Empresa não identificada. Faça login novamente.");
      return;
    }

    createOrderMutation.mutate({
      customer_id,
      neighborhood_id,
      payment_method_id,
      notes: notes || null,
      total_amount: totalAmount,
      delivery_fee: deliveryFee,
      status: 'pending',
      company_id: userProfile.company_id,
    });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <ShoppingCart className="w-5 h-5" />
          Novo Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Cliente *</label>
              <Select value={customer_id} onValueChange={setCustomerId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bairro *</label>
              <Select value={neighborhood_id} onValueChange={setNeighborhoodId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um bairro" />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods?.map((neighborhood) => (
                    <SelectItem key={neighborhood.id} value={neighborhood.id}>
                      {neighborhood.name} (Taxa: R$ {Number(neighborhood.delivery_fee).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Forma de Pagamento *</label>
              <Select value={payment_method_id} onValueChange={setPaymentMethodId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods?.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Itens do Pedido</h3>
              <Button type="button" onClick={addOrderItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Produto</label>
                      <Select 
                        value={item.product_id} 
                        onValueChange={(value) => updateOrderItem(index, 'product_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - R$ {Number(product.price).toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Quantidade</label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', Number(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Preço Unitário</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateOrderItem(index, 'unit_price', Number(e.target.value))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium mb-2">Total</label>
                        <p className="text-lg font-semibold text-green-600">
                          R$ {item.total_price.toFixed(2)}
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        onClick={() => removeOrderItem(index)}
                        variant="destructive"
                        size="sm"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Observações</label>
            <Textarea
              placeholder="Observações do pedido (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Separator />

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span className="font-semibold">R$ {totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg">
                <span>Taxa de Entrega:</span>
                <span className="font-semibold">R$ {deliveryFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-2xl font-bold text-green-700">
                <span>Total:</span>
                <span>R$ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
            disabled={createOrderMutation.isPending}
          >
            {createOrderMutation.isPending ? "Criando Pedido..." : "Criar Pedido"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
