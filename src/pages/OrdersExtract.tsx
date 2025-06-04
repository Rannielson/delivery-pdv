
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, FileText, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function OrdersExtract() {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: extractData } = useQuery({
    queryKey: ["orders-extract", startDate, endDate],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers(name, phone),
          neighborhoods(name, delivery_fee),
          order_items(
            quantity,
            unit_price,
            total_price,
            products(name, cost_price)
          )
        `)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return orders;
    },
  });

  const calculateTotals = () => {
    if (!extractData) return { totalCost: 0, totalRevenue: 0, totalProfit: 0 };

    let totalCost = 0;
    let totalRevenue = 0;

    extractData.forEach(order => {
      totalRevenue += order.total_amount;
      
      (order as any).order_items?.forEach((item: any) => {
        // Corrigido: usar cost_price em vez de price para o cálculo de custo
        const productCostPrice = item.products?.cost_price || 0;
        totalCost += productCostPrice * item.quantity;
      });
    });

    return {
      totalCost,
      totalRevenue,
      totalProfit: totalRevenue - totalCost
    };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Extrato de Pedidos
          </h1>
          <p className="text-gray-600 mt-2">Análise detalhada de custos e receitas</p>
        </div>
      </div>

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Calendar className="w-5 h-5" />
            Filtros
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

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <FileText className="w-5 h-5" />
            Relatório Detalhado
          </CardTitle>
          <CardDescription>
            {extractData?.length || 0} pedidos no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Bairro</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Custo Produção</TableHead>
                <TableHead>Valor Venda</TableHead>
                <TableHead>Lucro Bruto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {extractData?.map((order) => {
                // Corrigido: usar cost_price para cálculo correto do custo
                const orderCost = (order as any).order_items?.reduce((sum: number, item: any) => 
                  sum + ((item.products?.cost_price || 0) * item.quantity), 0) || 0;
                const orderProfit = order.total_amount - orderCost;

                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {(order as any).customers?.name}
                    </TableCell>
                    <TableCell>{(order as any).neighborhoods?.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {(order as any).order_items?.map((item: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            {item.quantity}x {item.products?.name}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-red-600 font-semibold">
                      R$ {orderCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-blue-600 font-semibold">
                      R$ {order.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell className={`font-semibold ${orderProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {orderProfit.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-red-50/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 font-medium">Custo Total</p>
                <p className="text-2xl font-bold text-red-700">
                  R$ {totals.totalCost.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-blue-50/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-medium">Receita Total</p>
                <p className="text-2xl font-bold text-blue-700">
                  R$ {totals.totalRevenue.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-green-50/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">Lucro Líquido</p>
                <p className="text-2xl font-bold text-green-700">
                  R$ {totals.totalProfit.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
