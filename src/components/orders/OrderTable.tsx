
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, AlertTriangle } from "lucide-react";
import OrderExport from "@/components/OrderExport";

interface OrderTableProps {
  onEditOrder: (order: any) => void;
  onDeleteOrder: (orderId: string) => void;
}

export default function OrderTable({ onEditOrder, onDeleteOrder }: OrderTableProps) {
  const { data: orders } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers(name, phone),
          neighborhoods(name, delivery_fee),
          payment_methods(name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: orderItemsData } = useQuery({
    queryKey: ["order-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return data;
    },
  });

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

  const getPriorityColor = (level: number | null) => {
    if (!level) return '';
    switch (level) {
      case 1: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2: return 'bg-orange-100 text-orange-800 border-orange-200';
      case 3: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-purple-700">Pedidos Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Bairro</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  {(order as any).customers?.name}
                </TableCell>
                <TableCell>{(order as any).neighborhoods?.name}</TableCell>
                <TableCell>{(order as any).payment_methods?.name}</TableCell>
                <TableCell className="font-semibold text-purple-600">
                  R$ {order.total_amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                  {order.status === 'cancelado' && order.cancellation_reason && (
                    <div className="text-xs text-gray-500 mt-1">
                      Motivo: {order.cancellation_reason}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {order.priority_level && order.priority_label ? (
                    <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(order.priority_level)}`}>
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      {order.priority_label}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Normal</span>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(order.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <OrderExport
                      order={order}
                      customer={(order as any).customers}
                      neighborhood={(order as any).neighborhoods}
                      paymentMethod={(order as any).payment_methods}
                      orderItems={orderItemsData?.filter(item => item.order_id === order.id) || []}
                      products={products || []}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditOrder(order)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteOrder(order.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
