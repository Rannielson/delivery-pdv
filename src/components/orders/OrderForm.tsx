import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, ShoppingCart, User, MapPin, CreditCard, FileText } from "lucide-react";
import { OrderItem, NewOrder } from "@/types/order";
import { useWebhook } from "@/hooks/useWebhook";

export default function OrderForm() {
  const [newOrder, setNewOrder] = useState<NewOrder>({
    customer_id: "",
    neighborhood_id: "",
    payment_method_id: "",
    notes: "",
    items: [],
    delivery_address: "",
    needs_change: false,
    change_amount: 0
  });
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);

  const queryClient = useQueryClient();
  const { sendWebhook } = useWebhook();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: neighborhoods } = useQuery({
    queryKey: ["neighborhoods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("neighborhoods").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("payment_methods").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return data;
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (order: NewOrder) => {
      const neighborhood = neighborhoods?.find(n => n.id === order.neighborhood_id);
      const deliveryFee = neighborhood?.delivery_fee || 0;
      const totalAmount = order.items.reduce((sum: number, item: OrderItem) => sum + item.total_price, 0) + deliveryFee;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: order.customer_id,
          neighborhood_id: order.neighborhood_id,
          payment_method_id: order.payment_method_id,
          delivery_fee: deliveryFee,
          total_amount: totalAmount,
          notes: order.notes,
          status: 'pending'
        })
        .select(`
          *,
          customers(name, phone),
          neighborhoods(name, delivery_fee),
          payment_methods(name)
        `)
        .single();

      if (orderError) throw orderError;

      if (order.items.length > 0) {
        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(
            order.items.map((item: OrderItem) => ({
              order_id: orderData.id,
              ...item
            }))
          );

        if (itemsError) throw itemsError;
      }

      return { ...orderData, order };
    },
    onSuccess: (data) => {
      const { order } = data;
      const orderData = data;
      
      // Criar descrição do pedido
      const descricaoItens = newOrder.items.map(item => {
        const product = products?.find(p => p.id === item.product_id);
        return `${item.quantity}x ${product?.name}`;
      }).join(", ");

      // Calcular valor total + entrega
      const valorTotalComEntrega = orderData.total_amount + orderData.delivery_fee;

      // Enviar webhook
      sendWebhook({
        nomeCliente: (orderData as any).customers?.name || "",
        telefone: (orderData as any).customers?.phone || "",
        dataPedido: new Date(orderData.created_at).toLocaleDateString('pt-BR'),
        descricaoPedido: descricaoItens,
        valorTotal: orderData.total_amount,
        valorEntrega: orderData.delivery_fee,
        valorTotalComEntrega: valorTotalComEntrega,
        statusPedido: "pending",
        observacoes: orderData.notes || "",
        numeroPedido: orderData.id,
        formaPagamento: (orderData as any).payment_methods?.name || "",
        enderecoEntrega: order.delivery_address || "",
        precisaTroco: order.needs_change || false,
        valorTroco: order.change_amount || 0
      });

      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setNewOrder({
        customer_id: "",
        neighborhood_id: "",
        payment_method_id: "",
        notes: "",
        items: [],
        delivery_address: "",
        needs_change: false,
        change_amount: 0
      });
      setSelectedProduct("");
      setQuantity(1);
      toast.success("Pedido criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar pedido: " + error.message);
    },
  });

  const addProductToOrder = () => {
    if (!selectedProduct) return;
    
    const product = products?.find(p => p.id === selectedProduct);
    if (!product) return;

    const item: OrderItem = {
      product_id: selectedProduct,
      quantity,
      unit_price: product.price,
      total_price: product.price * quantity
    };

    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    setSelectedProduct("");
    setQuantity(1);
  };

  const removeItemFromOrder = (index: number) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleCreateOrder = () => {
    if (!newOrder.customer_id || !newOrder.neighborhood_id || !newOrder.payment_method_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (newOrder.items.length === 0) {
      toast.error("Adicione pelo menos um produto ao pedido");
      return;
    }

    createOrderMutation.mutate(newOrder);
  };

  const totalOrder = newOrder.items.reduce((sum, item) => sum + item.total_price, 0);
  const deliveryFee = neighborhoods?.find(n => n.id === newOrder.neighborhood_id)?.delivery_fee || 0;
  const grandTotal = totalOrder + deliveryFee;

  // Verificar se o método de pagamento selecionado é dinheiro
  const selectedPaymentMethod = paymentMethods?.find(pm => pm.id === newOrder.payment_method_id);
  const isCashPayment = selectedPaymentMethod?.name?.toLowerCase().includes('dinheiro');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Plus className="w-5 h-5" />
              Novo Pedido
            </CardTitle>
            <CardDescription>
              Crie um novo pedido para seu cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Cliente *
                </Label>
                <Select value={newOrder.customer_id} onValueChange={(value) => setNewOrder(prev => ({ ...prev, customer_id: value }))}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-400">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Bairro *
                </Label>
                <Select value={newOrder.neighborhood_id} onValueChange={(value) => setNewOrder(prev => ({ ...prev, neighborhood_id: value }))}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-400">
                    <SelectValue placeholder="Selecione o bairro" />
                  </SelectTrigger>
                  <SelectContent>
                    {neighborhoods?.map((neighborhood) => (
                      <SelectItem key={neighborhood.id} value={neighborhood.id}>
                        {neighborhood.name} - R$ {neighborhood.delivery_fee.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Forma de Pagamento *
                </Label>
                <Select value={newOrder.payment_method_id} onValueChange={(value) => setNewOrder(prev => ({ ...prev, payment_method_id: value }))}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-400">
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

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Endereço de Entrega
                </Label>
                <Input
                  placeholder="Endereço completo para entrega..."
                  value={newOrder.delivery_address}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, delivery_address: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              {isCashPayment && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="needs-change"
                        checked={newOrder.needs_change}
                        onCheckedChange={(checked) => setNewOrder(prev => ({ ...prev, needs_change: !!checked }))}
                      />
                      <Label htmlFor="needs-change">Precisa de troco?</Label>
                    </div>
                  </div>

                  {newOrder.needs_change && (
                    <div className="space-y-2">
                      <Label>Valor do Troco</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={newOrder.change_amount}
                        onChange={(e) => setNewOrder(prev => ({ ...prev, change_amount: parseFloat(e.target.value) || 0 }))}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Observações
                </Label>
                <Textarea
                  placeholder="Observações do pedido..."
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-purple-700 mb-4">Adicionar Produtos</h3>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Produto</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="border-purple-200 focus:border-purple-400">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - R$ {product.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label>Qtd</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>
                <Button onClick={addProductToOrder} className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>

            {newOrder.items.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-purple-700 mb-4">Itens do Pedido</h3>
                <div className="space-y-2">
                  {newOrder.items.map((item, index) => {
                    const product = products?.find(p => p.id === item.product_id);
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div>
                          <span className="font-medium">{product?.name}</span>
                          <span className="text-gray-600 ml-2">x{item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">R$ {item.total_price.toFixed(2)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemFromOrder(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <ShoppingCart className="w-5 h-5" />
              Resumo do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>R$ {totalOrder.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxa de Entrega:</span>
              <span>R$ {deliveryFee.toFixed(2)}</span>
            </div>
            {isCashPayment && newOrder.needs_change && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Troco para:</span>
                <span>R$ {newOrder.change_amount?.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span className="text-purple-600">R$ {grandTotal.toFixed(2)}</span>
            </div>
            <Button 
              onClick={handleCreateOrder}
              disabled={createOrderMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
            >
              {createOrderMutation.isPending ? "Criando..." : "Finalizar Pedido"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
