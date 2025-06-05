
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, Users, TrendingUp, MapPin } from "lucide-react";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Buscar estatísticas de pedidos
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("total_amount, delivery_fee, created_at");
      if (ordersError) throw ordersError;

      // Buscar total de clientes
      const { count: customersCount, error: customersError } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });
      if (customersError) throw customersError;

      // Buscar itens de pedidos para rankings
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          quantity,
          products(name),
          order_id,
          orders(customer_id, neighborhood_id, customers(name), neighborhoods(name))
        `);
      if (itemsError) throw itemsError;

      // Calcular ranking por quantidade de produtos
      const productRanking: { [key: string]: number } = {};
      const customerRanking: { [key: string]: number } = {};
      const neighborhoodRanking: { [key: string]: number } = {};

      orderItems?.forEach(item => {
        const productName = item.products?.name || "Produto sem nome";
        const customerName = (item.orders as any)?.customers?.name || "Cliente sem nome";
        const neighborhoodName = (item.orders as any)?.neighborhoods?.name || "Bairro sem nome";
        
        // Ranking por produto
        productRanking[productName] = (productRanking[productName] || 0) + item.quantity;
        
        // Ranking por cliente (por quantidade de produtos comprados)
        customerRanking[customerName] = (customerRanking[customerName] || 0) + item.quantity;
        
        // Ranking por bairro (por quantidade de produtos vendidos)
        neighborhoodRanking[neighborhoodName] = (neighborhoodRanking[neighborhoodName] || 0) + item.quantity;
      });

      // Ordenar rankings
      const topProducts = Object.entries(productRanking)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));

      const topCustomers = Object.entries(customerRanking)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));

      const topNeighborhoods = Object.entries(neighborhoodRanking)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));

      // Calcular receita total
      const totalRevenue = orders?.reduce((sum, order) => 
        sum + order.total_amount + order.delivery_fee, 0) || 0;

      // Pedidos do mês atual
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === currentMonth && 
               orderDate.getFullYear() === currentYear;
      }) || [];

      return {
        totalOrders: orders?.length || 0,
        totalRevenue,
        totalCustomers: customersCount || 0,
        monthlyOrders: monthlyOrders.length,
        topProducts,
        topCustomers,
        topNeighborhoods
      };
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-2">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 font-medium">Total de Pedidos</p>
                <p className="text-2xl font-bold text-purple-700">
                  {stats?.totalOrders || 0}
                </p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">Receita Total</p>
                <p className="text-2xl font-bold text-green-700">
                  R$ {stats?.totalRevenue?.toFixed(2) || '0.00'}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-medium">Total de Clientes</p>
                <p className="text-2xl font-bold text-blue-700">
                  {stats?.totalCustomers || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 font-medium">Pedidos Este Mês</p>
                <p className="text-2xl font-bold text-orange-700">
                  {stats?.monthlyOrders || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-purple-700">Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topProducts?.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <span className="text-purple-600 font-semibold">
                    {product.quantity} unidades
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-blue-700">Clientes Mais Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topCustomers?.map((customer, index) => (
                <div key={customer.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{customer.name}</span>
                  </div>
                  <span className="text-blue-600 font-semibold">
                    {customer.quantity} produtos
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-green-700">Bairros Mais Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topNeighborhoods?.map((neighborhood, index) => (
                <div key={neighborhood.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{neighborhood.name}</span>
                  </div>
                  <span className="text-green-600 font-semibold">
                    {neighborhood.quantity} produtos
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
