
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, MapPin, DollarSign } from "lucide-react";
import { Draggable } from "react-beautiful-dnd";

interface OrderCardProps {
  order: any;
  index: number;
  status: string;
  isSelected: boolean;
  onSelection: (orderId: string, checked: boolean) => void;
  getOrderDescription: (orderId: string) => string;
  formatDateTime: (dateString: string) => { date: string; time: string };
}

export function OrderCard({
  order,
  index,
  status,
  isSelected,
  onSelection,
  getOrderDescription,
  formatDateTime
}: OrderCardProps) {
  const datetime = formatDateTime(order.updated_at);

  return (
    <Draggable draggableId={order.id} index={index}>
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
                      checked={isSelected}
                      onCheckedChange={(checked) => 
                        onSelection(order.id, checked as boolean)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <h3 className="font-semibold text-gray-900">
                    {order.customers?.name}
                  </h3>
                </div>
                <Badge variant="outline" className="text-xs">
                  #{order.order_number || order.id.slice(0, 8)}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                {order.neighborhoods?.name}
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
}
