import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, Users, TrendingUp, ShoppingBag, Target } from "lucide-react";
export default function Dashboard() {
  const {
    data: stats
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const {
        data: orders,
        error: ordersError
      } = await supabase.from("orders").select("total_amount, delivery_fee, created_at");
      if (ordersError) throw ordersError;
      const {
        count: customersCount,
        error: customersError
      } = await supabase.from("customers").select("*", {
        count: "exact",
        head: true
      });
      if (customersError) throw customersError;
      const {
        data: orderItems,
        error: itemsError
      } = await supabase.from("order_items").select(`
          quantity,
          products(name),
          order_id,
          orders(customer_id, neighborhood_id, customers(name), neighborhoods(name))
        `);
      if (itemsError) throw itemsError;
      const productRanking: {
        [key: string]: number;
      } = {};
      const customerRanking: {
        [key: string]: number;
      } = {};
      const neighborhoodRanking: {
        [key: string]: number;
      } = {};
      orderItems?.forEach(item => {
        const productName = item.products?.name || "Produto sem nome";
        const customerName = (item.orders as any)?.customers?.name || "Cliente sem nome";
        const neighborhoodName = (item.orders as any)?.neighborhoods?.name || "Bairro sem nome";
        productRanking[productName] = (productRanking[productName] || 0) + item.quantity;
        customerRanking[customerName] = (customerRanking[customerName] || 0) + item.quantity;
        neighborhoodRanking[neighborhoodName] = (neighborhoodRanking[neighborhoodName] || 0) + item.quantity;
      });
      const topProducts = Object.entries(productRanking).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, quantity]) => ({
        name,
        quantity
      }));
      const topCustomers = Object.entries(customerRanking).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, quantity]) => ({
        name,
        quantity
      }));
      const topNeighborhoods = Object.entries(neighborhoodRanking).sort(([, a], [, b]) => b - a).slice(0, 5).map(([name, quantity]) => ({
        name,
        quantity
      }));
      const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount + order.delivery_fee, 0) || 0;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
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
    }
  });
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 p-6">
      {/* Header moderno e compacto */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent mb-1">
              Dashboard Executivo
            </h1>
            <p className="text-gray-600">Insights e métricas do seu negócio</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Atualizado em</p>
            <p className="text-sm font-semibold text-gray-700">
              {new Date().toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
            </p>
          </div>
        </div>
      </div>

      {/* Cards de métricas principais com ícones menores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4 py-[16px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total de Pedidos</p>
                <p className="text-2xl font-bold">
                  {stats?.totalOrders || 0}
                </p>
                <p className="text-blue-100 text-xs">+{stats?.monthlyOrders || 0} este mês</p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm mb-1">Receita Total</p>
                <p className="text-2xl font-bold">
                  R$ {stats?.totalRevenue?.toFixed(2) || '0.00'}
                </p>
                <p className="text-emerald-100 text-xs">Receita acumulada</p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Clientes Ativos</p>
                <p className="text-2xl font-bold">
                  {stats?.totalCustomers || 0}
                </p>
                <p className="text-purple-100 text-xs">Base de clientes</p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm mb-1">Meta Mensal</p>
                <p className="text-2xl font-bold">
                  {stats?.monthlyOrders || 0}
                </p>
                <p className="text-orange-100 text-xs">Pedidos este mês</p>
              </div>
              <div className="bg-white/20 p-2 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de rankings compactos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b border-purple-100 pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800 text-lg">
              <Package className="w-5 h-5" />
              Top Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {stats?.topProducts?.map((product, index) => <div key={product.name} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-800 text-sm">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-purple-600">
                      {product.quantity}
                    </span>
                    <p className="text-xs text-gray-500">unidades</p>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
              <Users className="w-5 h-5" />
              Top Clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {stats?.topCustomers?.map((customer, index) => <div key={customer.name} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-800 text-sm">{customer.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600">
                      {customer.quantity}
                    </span>
                    <p className="text-xs text-gray-500">produtos</p>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100 pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-800 text-lg">
              <TrendingUp className="w-5 h-5" />
              Top Bairros
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {stats?.topNeighborhoods?.map((neighborhood, index) => <div key={neighborhood.name} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-800 text-sm">{neighborhood.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-600">
                      {neighborhood.quantity}
                    </span>
                    <p className="text-xs text-gray-500">produtos</p>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}