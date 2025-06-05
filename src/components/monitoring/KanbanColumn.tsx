
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droppable } from "react-beautiful-dnd";
import { OrderCard } from "./OrderCard";

interface KanbanColumnProps {
  title: string;
  status: string;
  orders: any[];
  color: string;
  selectedOrders: string[];
  onOrderSelection: (orderId: string, checked: boolean) => void;
  getOrderDescription: (orderId: string) => string;
  formatDateTime: (dateString: string) => { date: string; time: string };
}

export function KanbanColumn({ 
  title, 
  status, 
  orders, 
  color,
  selectedOrders,
  onOrderSelection,
  getOrderDescription,
  formatDateTime
}: KanbanColumnProps) {
  return (
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
                {orders.map((order, index) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    index={index}
                    status={status}
                    isSelected={selectedOrders.includes(order.id)}
                    onSelection={onOrderSelection}
                    getOrderDescription={getOrderDescription}
                    formatDateTime={formatDateTime}
                  />
                ))}
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
}
