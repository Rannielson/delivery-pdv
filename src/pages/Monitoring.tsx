
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, MapPin, DollarSign, Archive } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useState } from "react";
import { useWebhook } from "@/hooks/useWebhook";
import { toast } from "sonner";

export default function Monitoring() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { sendWebhook } = useWebhook();

  const { data: orders } = useQuery({
    queryKey: ["monitoring-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers(name, phone),
          neighborhoods(name),
          payment_methods(name)
        `)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: orderItems } = useQuery({
    queryKey: ["monitoring-order-items"],
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

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId)
        .select(`
          *,
          customers(name, phone),
          neighborhoods(name),
          payment_methods(name)
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ["monitoring-orders"] });
      
      // Enviar webhook
      const items = getOrderItems(updatedOrder.id);
      const descricaoItens = items.map(item => 
        `${item.quantity}x ${item.products?.name}`
      ).join(", ");

      const valorTotalComEntrega = updatedOrder.total_amount + updatedOrder.delivery_fee;

      sendWebhook({
        nomeCliente: (updatedOrder as any).customers?.name || "",
        telefone: (updatedOrder as any).customers?.phone || "",
        dataPedido: new Date(updatedOrder.created_at).toLocaleString('pt-BR'),
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
      
      toast.success("Status do pedido atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar status do pedido");
    },
  });

  const bulkFinalizeMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: 'finalizado',
          updated_at: new Date().toISOString()
        })
        .in("id", orderIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoring-orders"] });
      setSelectedOrders([]);
      toast.success("Pedidos finalizados com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao finalizar pedidos");
    },
  });

  const getOrderItems = (orderId: string) => {
    return orderItems?.filter(item => item.order_id === orderId) || [];
  };

  const getOrderDescription = (orderId: string) => {
    const items = getOrderItems(orderId);
    return items.map(item => 
      `${item.quantity}x ${item.products?.name}`
    ).join(", ");
  };

  const ordersByStatus = {
    pending: orders?.filter(order => order.status === 'pending') || [],
    em_producao: orders?.filter(order => order.status === 'em_producao') || [],
    a_caminho: orders?.filter(order => order.status === 'a_caminho') || [],
    entregue: orders?.filter(order => order.status === 'entregue') || [],
    cancelado: orders?.filter(order => order.status === 'cancelado') || [],
    finalizado: orders?.filter(order => order.status === 'finalizado') || []
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    updateOrderStatusMutation.mutate({ orderId: draggableId, newStatus });
  };

  const handleOrderSelection = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleBulkFinalize = () => {
    if (selectedOrders.length === 0) {
      toast.error("Selecione pelo menos um pedido");
      return;
    }
    bulkFinalizeMutation.mutate(selectedOrders);
  };

  const KanbanColumn = ({ title, status, orders, color }: { 
    title: string; 
    status: string; 
    orders: any[]; 
    color: string;
  }) => (
    <div className="flex-1 min-w-80">
      <Card className="h-full border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className={`${color} text-white`}>
          <CardTitle className="flex items-center justify-between text-lg">
            {title}
            <Badge variant="secondary" className="bg-white/20 text-white">
              {orders.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          <Droppable droppableId={status}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-4 min-h-[200px]"
              >
                {orders.map((order, index) => {
                  const datetime = formatDateTime(order.updated_at);
                  return (
                    <Draggable key={order.id} draggableId={order.id} index={index}>
                      {(provided, snapshot) => (
                        <Card 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`border border-gray-200 hover:shadow-md transition-shadow ${
                            snapshot.isDragging ? 'rotate-2 shadow-lg' : ''
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {status !== 'finalizado' && (
                                    <Checkbox
                                      checked={selectedOrders.includes(order.id)}
                                      onCheckedChange={(checked) => 
                                        handleOrderSelection(order.id, checked as boolean)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  )}
                                  <h3 className="font-semibold text-gray-900">
                                    {(order as any).customers?.name}
                                  </h3>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  #{order.order_number || order.id.slice(0, 8)}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-4 h-4" />
                                {(order as any).neighborhoods?.name}
                              </div>
                              
                              <div className="text-sm text-gray-700">
                                <strong>Pedido:</strong> {getOrderDescription(order.id) || "Sem itens"}
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                                <DollarSign className="w-4 h-4" />
                                R$ {(order.total_amount + order.delivery_fee).toFixed(2)}
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs text-gray-500 border-t pt-2">
                                <Clock className="w-3 h-3" />
                                <span>Atualizado: {datetime.date} às {datetime.time}</span>
                              </div>
                              
                              {order.notes && (
                                <div className="text-xs text-gray-600 italic">
                                  <strong>Obs:</strong> {order.notes}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
                
                {orders.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Nenhum pedido nesta etapa
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Monitoramento de Pedidos
          </h1>
          <p className="text-gray-600 mt-2">Acompanhe o status dos pedidos em tempo real</p>
        </div>
        
        {selectedOrders.length > 0 && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedOrders.length} pedido(s) selecionado(s)
            </span>
            <Button 
              onClick={handleBulkFinalize}
              variant="outline"
              className="flex items-center gap-2"
              disabled={bulkFinalizeMutation.isPending}
            >
              <Archive className="w-4 h-4" />
              Finalizar Selecionados
            </Button>
          </div>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          <KanbanColumn
            title="Pedidos Abertos"
            status="pending"
            orders={ordersByStatus.pending}
            color="bg-gradient-to-r from-yellow-500 to-orange-500"
          />
          
          <KanbanColumn
            title="Em Produção"
            status="em_producao"
            orders={ordersByStatus.em_producao}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
          />
          
          <KanbanColumn
            title="A Caminho"
            status="a_caminho"
            orders={ordersByStatus.a_caminho}
            color="bg-gradient-to-r from-purple-500 to-violet-600"
          />
          
          <KanbanColumn
            title="Entregues"
            status="entregue"
            orders={ordersByStatus.entregue}
            color="bg-gradient-to-r from-green-500 to-green-600"
          />
          
          <KanbanColumn
            title="Cancelados"
            status="cancelado"
            orders={ordersByStatus.cancelado}
            color="bg-gradient-to-r from-red-500 to-red-600"
          />
          
          <KanbanColumn
            title="Finalizados"
            status="finalizado"
            orders={ordersByStatus.finalizado}
            color="bg-gradient-to-r from-gray-500 to-gray-600"
          />
        </div>
      </DragDropContext>
    </div>
  );
}
