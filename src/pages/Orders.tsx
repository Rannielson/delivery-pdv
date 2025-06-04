import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, ShoppingCart, User, MapPin, CreditCard, FileText, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import OrderExport from "@/components/OrderExport";
import { usePriorityUpdater } from "@/hooks/usePriorityUpdater";

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function Orders() {
  const [newOrder, setNewOrder] = useState({
    customer_id: "",
    neighborhood_id: "",
    payment_method_id: "",
    notes: "",
    items: [] as OrderItem[]
  });
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const queryClient = useQueryClient();
  
  // Hook para atualização automática de prioridades
  usePriorityUpdater();

  const { data: orders } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers(name, phone),
          neighborhoods(name, delivery_fee),
          payment_methods(name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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

  // Query para buscar itens dos pedidos
  const { data: orderItemsData } = useQuery({
    queryKey: ["order-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, reason }: { orderId: string; status: string; reason?: string }) => {
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      
      if (status === 'cancelado' && reason) {
        updateData.cancellation_reason = reason;
      }

      const { data, error } = await supabase
        .from("orders")
        .update(updateData)
        .eq("id", orderId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setEditingOrder(null);
      setIsEditDialogOpen(false);
      setCancellationReason("");
      toast.success("Status do pedido atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir pedido: " + error.message);
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (order: any) => {
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
          notes: order.notes
        })
        .select()
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

      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setNewOrder({
        customer_id: "",
        neighborhood_id: "",
        payment_method_id: "",
        notes: "",
        items: []
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

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setIsEditDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!editingOrder || !editingOrder.status) return;
    
    if (editingOrder.status === 'cancelado' && !cancellationReason) {
      toast.error("Informe o motivo do cancelamento");
      return;
    }

    updateOrderStatusMutation.mutate({
      orderId: editingOrder.id,
      status: editingOrder.status,
      reason: editingOrder.status === 'cancelado' ? cancellationReason : undefined
    });
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm("Tem certeza que deseja excluir este pedido?")) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'em_producao': return 'bg-blue-100 text-blue-800';
      case 'a_caminho': return 'bg-purple-100 text-purple-800';
      case 'entregue': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pedido Aberto';
      case 'em_producao': return 'Em Produção';
      case 'a_caminho': return 'A Caminho';
      case 'entregue': return 'Entregue';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const getPriorityColor = (level: number | null) => {
    if (!level) return '';
    switch (level) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2: return 'bg-orange-100 text-orange-800 border-orange-200';
      case 3: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const totalOrder = newOrder.items.reduce((sum, item) => sum + item.total_price, 0);
  const deliveryFee = neighborhoods?.find(n => n.id === newOrder.neighborhood_id)?.delivery_fee || 0;
  const grandTotal = totalOrder + deliveryFee;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Pedidos
          </h1>
          <p className="text-gray-600 mt-2">Gerencie os pedidos do seu negócio</p>
        </div>
      </div>

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

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-purple-700">Pedidos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Bairro</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {(order as any).customers?.name}
                  </TableCell>
                  <TableCell>{(order as any).neighborhoods?.name}</TableCell>
                  <TableCell>{(order as any).payment_methods?.name}</TableCell>
                  <TableCell className="font-semibold text-purple-600">
                    R$ {order.total_amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    {order.status === 'cancelado' && order.cancellation_reason && (
                      <div className="text-xs text-gray-500 mt-1">
                        Motivo: {order.cancellation_reason}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.priority_level && order.priority_label ? (
                      <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(order.priority_level)}`}>
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                        {order.priority_label}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Normal</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <OrderExport
                        order={order}
                        customer={(order as any).customers}
                        neighborhood={(order as any).neighborhoods}
                        paymentMethod={(order as any).payment_methods}
                        orderItems={orderItemsData?.filter(item => item.order_id === order.id) || []}
                        products={products || []}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditOrder(order)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para editar status */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Status do Pedido</DialogTitle>
            <DialogDescription>
              Altere o status do pedido selecionado
            </DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input value={(editingOrder as any).customers?.name || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={editingOrder.status} 
                  onValueChange={(value) => setEditingOrder(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pedido Aberto</SelectItem>
                    <SelectItem value="em_producao">Em Produção</SelectItem>
                    <SelectItem value="a_caminho">A Caminho</SelectItem>
                    <SelectItem value="entregue">Entregue</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingOrder.status === 'cancelado' && (
                <div className="space-y-2">
                  <Label>Motivo do Cancelamento</Label>
                  <Textarea
                    placeholder="Informe o motivo do cancelamento..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="border-red-200 focus:border-red-400"
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdateStatus}
                  disabled={updateOrderStatusMutation.isPending}
                  className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
                >
                  {updateOrderStatusMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
