
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWebhook } from "@/hooks/useWebhook";
import { useAuth } from "@/hooks/useAuth";
import { useOrdersData } from "@/hooks/useOrdersData";
import { toast } from "sonner";

export function useOrderStatusMutation() {
  const queryClient = useQueryClient();
  const { sendWebhook } = useWebhook();
  const { userProfile } = useAuth();
  const { getOrderItems } = useOrdersData();

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      console.log("Company ID check:", userProfile?.company_id);
      
      if (!userProfile?.company_id) {
        console.error("Company ID not found in userProfile:", userProfile);
        throw new Error("Company ID não encontrado. Verifique se você está logado corretamente.");
      }

      // Primeiro, buscar o pedido atual para verificar se já foi finalizado
      const { data: currentOrder, error: fetchError } = await supabase
        .from("orders")
        .select("*, company_id")
        .eq("id", orderId)
        .single();
      
      if (fetchError) {
        console.error("Error fetching order:", fetchError);
        throw fetchError;
      }

      console.log("Current order company_id:", currentOrder.company_id);
      console.log("User profile company_id:", userProfile.company_id);

      // Verificar se o pedido pertence à mesma empresa do usuário
      if (currentOrder.company_id !== userProfile.company_id) {
        throw new Error("Você não tem permissão para editar este pedido.");
      }

      // Atualizar o status do pedido
      const { data, error } = await supabase
        .from("orders")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", orderId)
        .eq("company_id", userProfile.company_id)
        .select(`
          *,
          customers(name, phone),
          neighborhoods(name),
          payment_methods(name)
        `)
        .single();
      
      if (error) {
        console.error("Error updating order status:", error);
        throw error;
      }

      // Lançamento financeiro agora é feito via trigger no banco quando status muda para 'finalizado'/'entregue'

      
      return data;
    },
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ["monitoring-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
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
    onError: (error) => {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status do pedido: " + error.message);
    },
  });

  return { updateOrderStatusMutation };
}
