
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useWebhook } from "@/hooks/useWebhook";
import OrderExport from "@/components/OrderExport";

interface OrderTableProps {
  onEditOrder: (order: any) => void;
  onDeleteOrder: (orderId: string) => void;
}

export default function OrderTable({ onEditOrder, onDeleteOrder }: OrderTableProps) {
  const queryClient = useQueryClient();
  const { sendWebhook } = useWebhook();

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

  const { data: orderItemsData } = useQuery({
    queryKey: ["order-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          *,
          products(name)
        `);
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

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      // Primeiro, buscar o pedido atual
      const { data: currentOrder, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      
      if (fetchError) throw fetchError;

      // Atualizar o status
      const { data, error } = await supabase
        .from("orders")
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", orderId)
        .select(`
          *,
          customers(name, phone),
          neighborhoods(name, delivery_fee),
          payment_methods(name)
        `)
        .single();
      
      if (error) throw error;

      // Se mudou para finalizado e não estava finalizado antes
      if (status === 'finalizado' && currentOrder.status !== 'finalizado') {
        // Verificar se já existe lançamento
        const { data: existingEntry, error: entryError } = await supabase
          .from("financial_entries")
          .select("id")
          .eq("order_id", orderId)
          .eq("entry_type", "income")
          .single();

        if (entryError && entryError.code !== 'PGRST116') {
          console.error("Erro ao verificar lançamento:", entryError);
        }

        if (!existingEntry) {
          const totalRevenue = data.total_amount + data.delivery_fee;
          
          const { error: insertError } = await supabase
            .from("financial_entries")
            .insert({
              description: `Venda - Pedido #${data.order_number}`,
              amount: totalRevenue,
              entry_date: new Date().toISOString().split('T')[0],
              entry_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
              entry_type: 'income',
              order_id: orderId,
              notes: 'Lançamento automático de venda'
            });

          if (insertError) {
            console.error("Erro ao criar lançamento:", insertError);
          } else {
            toast.success("Receita registrada automaticamente!");
          }
        }
      }
      
      return data;
    },
    onSuccess: (updatedOrder) => {
      // Criar descrição do pedido
      const orderItems = getOrderItems(updatedOrder.id);
      const descricaoItens = orderItems.map(item => 
        `${item.quantity}x ${item.products?.name}`
      ).join(", ") || "";

      // Calcular valor total + entrega
      const valorTotalComEntrega = updatedOrder.total_amount + updatedOrder.delivery_fee;

      // Enviar webhook
      sendWebhook({
        nomeCliente: (updatedOrder as any).customers?.name || "",
        telefone: (updatedOrder as any).customers?.phone || "",
        dataPedido: new Date(updatedOrder.created_at).toLocaleDateString('pt-BR'),
        descricaoPedido: descricaoItens,
        valorTotal: updatedOrder.total_amount,
        valorEntrega: updatedOrder.delivery_fee,
        valorTotalComEntrega: valorTotalComEntrega,
        statusPedido: updatedOrder.status,
        observacoes: updatedOrder.notes || "",
        numeroPedido: updatedOrder.order_number?.toString() || updatedOrder.id,
        formaPagamento: (updatedOrder as any).payment_methods?.name || "",
        enderecoEntrega: "",
        precisaTroco: false,
        valorTroco: 0
      });

      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      toast.success("Status do pedido atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const getOrderItems = (orderId: string) => {
    return orderItemsData?.filter(item => item.order_id === orderId) || [];
  };

  const getOrderDescription = (orderId: string) => {
    const items = getOrderItems(orderId);
    return items.map(item => 
      `${item.quantity}x ${item.products?.name}`
    ).join(", ");
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

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderStatusMutation.mutate({ orderId, status: newStatus });
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-purple-700">Pedidos Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Itens do Pedido</TableHead>
              <TableHead>Bairro</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-sm">
                  #{order.order_number || order.id.slice(0, 8)}
                </TableCell>
                <TableCell className="font-medium">
                  {(order as any).customers?.name}
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="text-sm text-gray-600 truncate" title={getOrderDescription(order.id)}>
                    {getOrderDescription(order.id) || "Sem itens"}
                  </div>
                </TableCell>
                <TableCell>{(order as any).neighborhoods?.name}</TableCell>
                <TableCell>{(order as any).payment_methods?.name}</TableCell>
                <TableCell className="font-semibold text-purple-600">
                  R$ {order.total_amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Select 
                    value={order.status} 
                    onValueChange={(value) => handleStatusChange(order.id, value)}
                    disabled={updateOrderStatusMutation.isPending}
                  >
                    <SelectTrigger className={`w-40 ${getStatusColor(order.status)} border-0`}>
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
                  {order.status === 'cancelado' && order.cancellation_reason && (
                    <div className="text-xs text-gray-500 mt-1">
                      Motivo: {order.cancellation_reason}
                    </div>
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
                      orderItems={getOrderItems(order.id)}
                      products={products || []}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditOrder(order)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteOrder(order.id)}
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
  );
}
