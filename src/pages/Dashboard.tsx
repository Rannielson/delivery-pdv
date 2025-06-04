
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package, 
  MapPin,
  Calendar,
  Activity,
  Star
} from "lucide-react";

export default function Dashboard() {
  const { data: totalOrders } = useQuery({
    queryKey: ["total-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("total_amount", { count: "exact" });
      if (error) throw error;
      return {
        count: data?.length || 0,
        total: data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
      };
    },
  });

  const { data: totalCustomers } = useQuery({
    queryKey: ["total-customers"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: totalProducts } = useQuery({
    queryKey: ["total-products"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: topNeighborhood } = useQuery({
    queryKey: ["top-neighborhood"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          neighborhood_id,
          neighborhoods(name)
        `)
        .limit(1000);
      
      if (error) throw error;
      
      const neighborhoods = data?.reduce((acc: any, order) => {
        const neighborhoodName = (order as any).neighborhoods?.name || 'Desconhecido';
        acc[neighborhoodName] = (acc[neighborhoodName] || 0) + 1;
        return acc;
      }, {});
      
      const topNeighborhood = Object.entries(neighborhoods || {})
        .sort(([,a], [,b]) => (b as number) - (a as number))[0];
      
      return topNeighborhood ? {
        name: topNeighborhood[0],
        orders: topNeighborhood[1]
      } : null;
    },
  });

  const statsCards = [
    {
      title: "Vendas Totais",
      value: `R$ ${(totalOrders?.total || 0).toFixed(2)}`,
      description: "Total em vendas do mês",
      icon: DollarSign,
      color: "from-green-500 to-emerald-600",
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Pedidos",
      value: totalOrders?.count || 0,
      description: "Total de pedidos realizados",
      icon: Package,
      color: "from-blue-500 to-cyan-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Clientes",
      value: totalCustomers || 0,
      description: "Clientes cadastrados",
      icon: Users,
      color: "from-purple-500 to-violet-600",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      title: "Produtos",
      value: totalProducts || 0,
      description: "Produtos disponíveis",
      icon: Star,
      color: "from-orange-500 to-red-600",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600"
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Visão geral do seu negócio</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-4 py-2 rounded-full">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('pt-BR')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                {card.value}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <MapPin className="w-5 h-5" />
              Bairro Mais Vendido
            </CardTitle>
            <CardDescription>
              Região com maior volume de pedidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topNeighborhood ? (
              <div className="space-y-4">
                <div className="text-2xl font-bold text-purple-600">
                  {topNeighborhood.name}
                </div>
                <div className="text-sm text-gray-600">
                  {topNeighborhood.orders} pedidos realizados
                </div>
                <div className="w-full bg-purple-100 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-violet-600 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: "75%" }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                Nenhum pedido encontrado
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Activity className="w-5 h-5" />
              Atividade Recente
            </CardTitle>
            <CardDescription>
              Últimas movimentações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Sistema inicializado</div>
                  <div className="text-gray-500">Banco de dados conectado</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Dados carregados</div>
                  <div className="text-gray-500">Produtos e clientes sincronizados</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Dashboard atualizado</div>
                  <div className="text-gray-500">Métricas em tempo real</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
