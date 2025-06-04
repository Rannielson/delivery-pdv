
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Package, 
  MapPin,
  Calendar,
  Activity,
  Star,
  Crown
} from "lucide-react";

export default function Dashboard() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: totalOrders } = useQuery({
    queryKey: ["total-orders", startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("total_amount");
      
      if (startDate) {
        query = query.gte("created_at", startDate);
      }
      if (endDate) {
        query = query.lte("created_at", endDate + "T23:59:59");
      }
      
      const { data, error } = await query;
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

  const { data: neighborhoodRanking } = useQuery({
    queryKey: ["neighborhood-ranking", startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(`
          neighborhood_id,
          neighborhoods(name)
        `);
      
      if (startDate) {
        query = query.gte("created_at", startDate);
      }
      if (endDate) {
        query = query.lte("created_at", endDate + "T23:59:59");
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const neighborhoods = data?.reduce((acc: any, order) => {
        const neighborhoodName = (order as any).neighborhoods?.name || 'Desconhecido';
        acc[neighborhoodName] = (acc[neighborhoodName] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(neighborhoods || {})
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([name, orders], index) => ({
          name: name as string,
          orders: orders as number,
          position: index + 1
        }));
    },
  });

  const { data: customerRanking } = useQuery({
    queryKey: ["customer-ranking", startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(`
          customer_id,
          customers(name)
        `);
      
      if (startDate) {
        query = query.gte("created_at", startDate);
      }
      if (endDate) {
        query = query.lte("created_at", endDate + "T23:59:59");
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const customers = data?.reduce((acc: any, order) => {
        const customerName = (order as any).customers?.name || 'Desconhecido';
        acc[customerName] = (acc[customerName] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(customers || {})
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([name, orders], index) => ({
          name: name as string,
          orders: orders as number,
          position: index + 1
        }));
    },
  });

  const { data: statusRanking } = useQuery({
    queryKey: ["status-ranking", startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("status");
      
      if (startDate) {
        query = query.gte("created_at", startDate);
      }
      if (endDate) {
        query = query.lte("created_at", endDate + "T23:59:59");
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const statuses = data?.reduce((acc: any, order) => {
        const status = order.status || 'Desconhecido';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(statuses || {})
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .map(([status, count]) => ({
          status: status as string,
          count: count as number,
          percentage: ((count as number) / (data?.length || 1) * 100).toFixed(1)
        }));
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'em_producao': return 'bg-blue-100 text-blue-800';
      case 'a_caminho': return 'bg-purple-100 text-purple-800';
      case 'entregue': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pedido Aberto';
      case 'em_producao': return 'Em Produção';
      case 'a_caminho': return 'A Caminho';
      case 'entregue': return 'Entregue';
      default: return status;
    }
  };

  const statsCards = [
    {
      title: "Vendas Totais",
      value: `R$ ${(totalOrders?.total || 0).toFixed(2)}`,
      description: "Total em vendas",
      icon: DollarSign,
      color: "from-green-500 to-emerald-600",
      iconBg: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Pedidos",
      value: String(totalOrders?.count || 0),
      description: "Total de pedidos realizados",
      icon: Package,
      color: "from-blue-500 to-cyan-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Clientes",
      value: String(totalCustomers || 0),
      description: "Clientes cadastrados",
      icon: Users,
      color: "from-purple-500 to-violet-600",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      title: "Produtos",
      value: String(totalProducts || 0),
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

      {/* Filtros de Data */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Calendar className="w-5 h-5" />
            Filtros de Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
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

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Ranking de Bairros */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <MapPin className="w-5 h-5" />
              Top 5 Bairros
            </CardTitle>
            <CardDescription>
              Bairros com maior volume de pedidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {neighborhoodRanking && neighborhoodRanking.length > 0 ? (
              <div className="space-y-3">
                {neighborhoodRanking.map((neighborhood, index) => (
                  <div key={neighborhood.name} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-amber-600' : 'bg-purple-500'
                      }`}>
                        {index === 0 ? <Crown className="w-4 h-4" /> : neighborhood.position}
                      </div>
                      <div>
                        <div className="font-semibold text-purple-800">{neighborhood.name}</div>
                        <div className="text-sm text-gray-600">{neighborhood.orders} pedidos</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum pedido encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking de Clientes */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Users className="w-5 h-5" />
              Top 5 Clientes
            </CardTitle>
            <CardDescription>
              Clientes com mais pedidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {customerRanking && customerRanking.length > 0 ? (
              <div className="space-y-3">
                {customerRanking.map((customer, index) => (
                  <div key={customer.name} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-amber-600' : 'bg-purple-500'
                      }`}>
                        {index === 0 ? <Crown className="w-4 h-4" /> : customer.position}
                      </div>
                      <div>
                        <div className="font-semibold text-purple-800">{customer.name}</div>
                        <div className="text-sm text-gray-600">{customer.orders} pedidos</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum cliente encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking por Status */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Activity className="w-5 h-5" />
              Status dos Pedidos
            </CardTitle>
            <CardDescription>
              Distribuição por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusRanking && statusRanking.length > 0 ? (
              <div className="space-y-3">
                {statusRanking.map((status) => (
                  <div key={status.status} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status.status)}`}>
                        {getStatusLabel(status.status)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-purple-800">{status.count}</div>
                      <div className="text-sm text-gray-600">{status.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum pedido encontrado</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
