
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, Users, TrendingUp, ShoppingBag, Clock, Calendar, Target } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 p-8">
      {/* Header moderno */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Dashboard Executivo
            </h1>
            <p className="text-xl text-gray-600">Insights e métricas do seu negócio em tempo real</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Última atualização</p>
            <p className="text-lg font-semibold text-gray-700">
              {new Date().toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 font-medium mb-1">Total de Pedidos</p>
                <p className="text-4xl font-bold">
                  {stats?.totalOrders || 0}
                </p>
                <p className="text-blue-100 text-sm mt-1">+{stats?.monthlyOrders || 0} este mês</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full">
                <ShoppingBag className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-white/10 rounded-full" />
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 font-medium mb-1">Receita Total</p>
                <p className="text-4xl font-bold">
                  R$ {stats?.totalRevenue?.toFixed(2) || '0.00'}
                </p>
                <p className="text-emerald-100 text-sm mt-1">Receita acumulada</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-white/10 rounded-full" />
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 font-medium mb-1">Clientes Ativos</p>
                <p className="text-4xl font-bold">
                  {stats?.totalCustomers || 0}
                </p>
                <p className="text-purple-100 text-sm mt-1">Base de clientes</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full">
                <Users className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-white/10 rounded-full" />
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 font-medium mb-1">Meta Mensal</p>
                <p className="text-4xl font-bold">
                  {stats?.monthlyOrders || 0}
                </p>
                <p className="text-orange-100 text-sm mt-1">Pedidos este mês</p>
              </div>
              <div className="bg-white/20 p-4 rounded-full">
                <Target className="w-8 h-8" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-white/10 rounded-full" />
        </Card>
      </div>

      {/* Cards de rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100">
            <CardTitle className="flex items-center gap-3 text-purple-800">
              <Package className="w-6 h-6" />
              Top Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats?.topProducts?.map((product, index) => (
                <div key={product.name} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-gray-800">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-purple-600">
                      {product.quantity}
                    </span>
                    <p className="text-sm text-gray-500">unidades</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
            <CardTitle className="flex items-center gap-3 text-blue-800">
              <Users className="w-6 h-6" />
              Top Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats?.topCustomers?.map((customer, index) => (
                <div key={customer.name} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-gray-800">{customer.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">
                      {customer.quantity}
                    </span>
                    <p className="text-sm text-gray-500">produtos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
            <CardTitle className="flex items-center gap-3 text-emerald-800">
              <TrendingUp className="w-6 h-6" />
              Top Bairros
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {stats?.topNeighborhoods?.map((neighborhood, index) => (
                <div key={neighborhood.name} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {index + 1}
                    </div>
                    <span className="font-semibold text-gray-800">{neighborhood.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-emerald-600">
                      {neighborhood.quantity}
                    </span>
                    <p className="text-sm text-gray-500">produtos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
