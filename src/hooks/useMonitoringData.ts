
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWebhook } from "@/hooks/useWebhook";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useMonitoringData() {
  const queryClient = useQueryClient();
  const { sendWebhook } = useWebhook();
  const { userProfile } = useAuth();

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
      // Primeiro, buscar o pedido atual para verificar se já foi finalizado
      const { data: currentOrder, error: fetchError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();
      
      if (fetchError) throw fetchError;

      // Atualizar o status do pedido
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

      // Se o status mudou para 'finalizado' e não estava finalizado antes
      if (newStatus === 'finalizado' && currentOrder.status !== 'finalizado') {
        // Verificar se já existe lançamento financeiro para este pedido
        const { data: existingEntry, error: entryError } = await supabase
          .from("financial_entries")
          .select("id")
          .eq("order_id", orderId)
          .eq("entry_type", "income")
          .single();

        if (entryError && entryError.code !== 'PGRST116') { // PGRST116 = não encontrado
          console.error("Erro ao verificar lançamento existente:", entryError);
        }

        // Se não existe lançamento, criar um novo
        if (!existingEntry && userProfile?.company_id) {
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
              company_id: userProfile.company_id,
              notes: 'Lançamento automático de venda'
            });

          if (insertError) {
            console.error("Erro ao criar lançamento financeiro:", insertError);
            toast.error("Erro ao registrar receita do pedido");
          } else {
            toast.success("Receita registrada automaticamente!");
          }
        }
      }
      
      return data;
    },
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ["monitoring-orders"] });
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      
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
      if (!userProfile?.company_id) {
        throw new Error("Company ID não encontrado");
      }

      // Para cada pedido, verificar e criar lançamento se necessário
      for (const orderId of orderIds) {
        const { data: currentOrder } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (currentOrder && currentOrder.status !== 'finalizado') {
          // Verificar se já existe lançamento
          const { data: existingEntry } = await supabase
            .from("financial_entries")
            .select("id")
            .eq("order_id", orderId)
            .eq("entry_type", "income")
            .single();

          if (!existingEntry) {
            const totalRevenue = currentOrder.total_amount + currentOrder.delivery_fee;
            
            await supabase
              .from("financial_entries")
              .insert({
                description: `Venda - Pedido #${currentOrder.order_number}`,
                amount: totalRevenue,
                entry_date: new Date().toISOString().split('T')[0],
                entry_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
                entry_type: 'income',
                order_id: orderId,
                company_id: userProfile.company_id,
                notes: 'Lançamento automático de venda (finalização em lote)'
              });
          }
        }
      }

      // Atualizar todos os pedidos para finalizado
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
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      toast.success("Pedidos finalizados e receitas registradas com sucesso!");
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
