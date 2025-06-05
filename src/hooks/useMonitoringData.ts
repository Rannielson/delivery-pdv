
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWebhook } from "@/hooks/useWebhook";
import { toast } from "sonner";

export function useMonitoringData() {
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

  return {
    orders,
    orderItems,
    updateOrderStatusMutation,
    bulkFinalizeMutation,
    getOrderItems,
    getOrderDescription
  };
}
