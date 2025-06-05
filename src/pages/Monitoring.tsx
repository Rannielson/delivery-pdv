
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, DollarSign } from "lucide-react";

export default function Monitoring() {
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

  const getOrderItems = (orderId: string) => {
    return orderItems?.filter(item => item.order_id === orderId) || [];
  };

  const getOrderDescription = (orderId: string) => {
    const items = getOrderItems(orderId);
    return items.map(item => 
      `${item.quantity}x ${item.products?.name}`
    ).join(", ");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'em_producao': return 'bg-blue-100 text-blue-800';
      case 'a_caminho': return 'bg-purple-100 text-purple-800';
      case 'entregue': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pedido Aberto';
      case 'em_producao': return 'Em Produção';
      case 'a_caminho': return 'A Caminho';
      case 'entregue': return 'Entregue';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const ordersByStatus = {
    pending: orders?.filter(order => order.status === 'pending') || [],
    em_producao: orders?.filter(order => order.status === 'em_producao') || [],
    a_caminho: orders?.filter(order => order.status === 'a_caminho') || [],
    entregue: orders?.filter(order => order.status === 'entregue') || [],
    cancelado: orders?.filter(order => order.status === 'cancelado') || []
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
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
          <div className="space-y-4">
            {orders.map((order) => {
              const datetime = formatDateTime(order.updated_at);
              return (
                <Card key={order.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          {(order as any).customers?.name}
                        </h3>
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
              );
            })}
            
            {orders.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                Nenhum pedido nesta etapa
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
          Monitoramento de Pedidos
        </h1>
        <p className="text-gray-600 mt-2">Acompanhe o status dos pedidos em tempo real</p>
      </div>

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
      </div>
    </div>
  );
}
