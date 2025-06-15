
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useBulkFinalizeMutation() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();

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
            
            const { error: insertError } = await supabase
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

            if (insertError) {
              console.error("Erro ao criar lançamento financeiro:", insertError);
              throw insertError;
            }
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
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      toast.success("Pedidos finalizados e receitas registradas com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao finalizar pedidos:", error);
      toast.error("Erro ao finalizar pedidos: " + error.message);
    },
  });

  return { bulkFinalizeMutation };
}
