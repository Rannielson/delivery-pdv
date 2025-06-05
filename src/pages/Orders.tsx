
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import OrderForm from "@/components/orders/OrderForm";
import OrderTable from "@/components/orders/OrderTable";
import OrderStatusDialog from "@/components/orders/OrderStatusDialog";

export default function Orders() {
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const queryClient = useQueryClient();

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

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setIsEditDialogOpen(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm("Tem certeza que deseja excluir este pedido?")) {
      deleteOrderMutation.mutate(orderId);
    }
  };

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

      <OrderForm />

      <OrderTable 
        onEditOrder={handleEditOrder}
        onDeleteOrder={handleDeleteOrder}
      />

      <OrderStatusDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingOrder={editingOrder}
        setEditingOrder={setEditingOrder}
      />
    </div>
  );
}
