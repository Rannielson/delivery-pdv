
import { DragDropContext } from "react-beautiful-dnd";
import { useState } from "react";
import { toast } from "sonner";
import { KanbanColumn } from "@/components/monitoring/KanbanColumn";
import { BulkActionsHeader } from "@/components/monitoring/BulkActionsHeader";
import { useMonitoringData } from "@/hooks/useMonitoringData";
import { formatDateTime } from "@/utils/dateUtils";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Monitoring() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  
  const {
    orders,
    updateOrderStatusMutation,
    bulkFinalizeMutation,
    getOrderDescription
  } = useMonitoringData();

  const ordersByStatus = {
    pending: orders?.filter(order => order.status === 'pending') || [],
    em_producao: orders?.filter(order => order.status === 'em_producao') || [],
    a_caminho: orders?.filter(order => order.status === 'a_caminho') || [],
    entregue: orders?.filter(order => order.status === 'entregue') || [],
    cancelado: orders?.filter(order => order.status === 'cancelado') || [],
    finalizado: orders?.filter(order => order.status === 'finalizado') || []
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId;
    
    // Find current order to check if status is actually different
    const currentOrder = orders?.find(order => order.id === draggableId);
    if (currentOrder?.status === newStatus) {
      return; // Don't update if status is the same
    }
    
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
    setSelectedOrders([]);
  };

  return (
    <ProtectedRoute subscriptionRequired="pro">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              Monitoramento de Pedidos
            </h1>
            <p className="text-gray-600 mt-2">Acompanhe o status dos pedidos em tempo real</p>
          </div>
          
          <BulkActionsHeader
            selectedOrders={selectedOrders}
            onBulkFinalize={handleBulkFinalize}
            isLoading={bulkFinalizeMutation.isPending}
          />
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-4">
            <KanbanColumn
              title="Pedidos Abertos"
              status="pending"
              orders={ordersByStatus.pending}
              color="bg-gradient-to-r from-yellow-500 to-orange-500"
              selectedOrders={selectedOrders}
              onOrderSelection={handleOrderSelection}
              getOrderDescription={getOrderDescription}
              formatDateTime={formatDateTime}
            />
            
            <KanbanColumn
              title="Em Produção"
              status="em_producao"
              orders={ordersByStatus.em_producao}
              color="bg-gradient-to-r from-blue-500 to-blue-600"
              selectedOrders={selectedOrders}
              onOrderSelection={handleOrderSelection}
              getOrderDescription={getOrderDescription}
              formatDateTime={formatDateTime}
            />
            
            <KanbanColumn
              title="A Caminho"
              status="a_caminho"
              orders={ordersByStatus.a_caminho}
              color="bg-gradient-to-r from-purple-500 to-violet-600"
              selectedOrders={selectedOrders}
              onOrderSelection={handleOrderSelection}
              getOrderDescription={getOrderDescription}
              formatDateTime={formatDateTime}
            />
            
            <KanbanColumn
              title="Entregues"
              status="entregue"
              orders={ordersByStatus.entregue}
              color="bg-gradient-to-r from-green-500 to-green-600"
              selectedOrders={selectedOrders}
              onOrderSelection={handleOrderSelection}
              getOrderDescription={getOrderDescription}
              formatDateTime={formatDateTime}
            />
            
            <KanbanColumn
              title="Cancelados"
              status="cancelado"
              orders={ordersByStatus.cancelado}
              color="bg-gradient-to-r from-red-500 to-red-600"
              selectedOrders={selectedOrders}
              onOrderSelection={handleOrderSelection}
              getOrderDescription={getOrderDescription}
              formatDateTime={formatDateTime}
            />
            
            <KanbanColumn
              title="Finalizados"
              status="finalizado"
              orders={ordersByStatus.finalizado}
              color="bg-gradient-to-r from-gray-500 to-gray-600"
              selectedOrders={selectedOrders}
              onOrderSelection={handleOrderSelection}
              getOrderDescription={getOrderDescription}
              formatDateTime={formatDateTime}
            />
          </div>
        </DragDropContext>
      </div>
    </ProtectedRoute>
  );
}
