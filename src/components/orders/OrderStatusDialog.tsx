
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface OrderStatusDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingOrder: any;
  setEditingOrder: (order: any) => void;
}

export default function OrderStatusDialog({ 
  isOpen, 
  onOpenChange, 
  editingOrder, 
  setEditingOrder 
}: OrderStatusDialogProps) {
  const [cancellationReason, setCancellationReason] = useState("");
  const queryClient = useQueryClient();

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
      onOpenChange(false);
      setCancellationReason("");
      toast.success("Status do pedido atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              <Button variant="outline" onClick={() => onOpenChange(false)}>
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
  );
}
