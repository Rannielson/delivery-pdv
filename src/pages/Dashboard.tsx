
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  DollarSign,
  MapPin,
  TrendingUp,
  Users,
  ShoppingBag,
  Award,
  Activity
} from "lucide-react";

const Dashboard = () => {
  const salesData = {
    totalSales: 15420.50,
    monthlyGrowth: 12.5,
    ordersCount: 324,
    customersCount: 156,
    topNeighborhood: "Centro",
    neighborhoodSales: 4230.00,
    avgOrderValue: 47.60
  };

  const topProducts = [
    { name: "Açaí 500ml", sales: 89, revenue: 1780.00 },
    { name: "Açaí 300ml", sales: 67, revenue: 1340.00 },
    { name: "Açaí Especial", sales: 45, revenue: 1350.00 },
  ];

  const recentOrders = [
    { id: "#001", customer: "Maria Silva", value: 32.50, status: "Entregue", time: "14:30" },
    { id: "#002", customer: "João Santos", value: 28.00, status: "Preparando", time: "14:25" },
    { id: "#003", customer: "Ana Costa", value: 45.50, status: "Saiu para entrega", time: "14:20" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight bg-acai-gradient bg-clip-text text-transparent">
          Dashboard
        </h2>
        <p className="text-muted-foreground">
          Resumo das vendas e insights do mês atual
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover-scale border-0 shadow-lg bg-gradient-to-br from-acai-500 to-acai-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Vendas do Mês
            </CardTitle>
            <DollarSign className="h-5 w-5 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {salesData.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs opacity-90 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +{salesData.monthlyGrowth}% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="hover-scale border-0 shadow-lg bg-gradient-to-br from-fresh-500 to-fresh-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">
              Pedidos
            </CardTitle>
            <ShoppingBag className="h-5 w-5 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesData.ordersCount}</div>
            <p className="text-xs opacity-90">
              Ticket médio: R$ {salesData.avgOrderValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="hover-scale border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes
            </CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{salesData.customersCount}</div>
            <p className="text-xs text-muted-foreground">
              Clientes únicos
            </p>
          </CardContent>
        </Card>

        <Card className="hover-scale border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Bairro
            </CardTitle>
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{salesData.topNeighborhood}</div>
            <p className="text-xs text-muted-foreground">
              R$ {salesData.neighborhoodSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em vendas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos Mais Vendidos */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-acai-500" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-acai-100 text-acai-700">
                    #{index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sales} vendas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-fresh-600">
                    R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pedidos Recentes */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-fresh-500" />
              Pedidos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <p className="font-medium">{order.id} - {order.customer}</p>
                  <p className="text-sm text-muted-foreground">{order.time}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold">R$ {order.value.toFixed(2)}</p>
                  <Badge 
                    variant={order.status === "Entregue" ? "default" : "secondary"}
                    className={
                      order.status === "Entregue" 
                        ? "bg-fresh-500 hover:bg-fresh-600" 
                        : order.status === "Preparando" 
                        ? "bg-orange-500 hover:bg-orange-600 text-white" 
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Insights e Análises */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-acai-500" />
            Insights do Negócio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-acai-50 border border-acai-200">
              <h4 className="font-semibold text-acai-800 mb-2">Performance de Vendas</h4>
              <Progress value={75} className="mb-2" />
              <p className="text-sm text-acai-700">75% da meta mensal atingida</p>
            </div>
            
            <div className="p-4 rounded-lg bg-fresh-50 border border-fresh-200">
              <h4 className="font-semibold text-fresh-800 mb-2">Satisfação do Cliente</h4>
              <Progress value={92} className="mb-2" />
              <p className="text-sm text-fresh-700">92% de avaliações positivas</p>
            </div>
            
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
              <h4 className="font-semibold text-orange-800 mb-2">Tempo Médio de Entrega</h4>
              <Progress value={85} className="mb-2" />
              <p className="text-sm text-orange-700">25 minutos (85% dentro do prazo)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
