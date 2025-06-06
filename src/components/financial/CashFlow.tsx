
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CashFlow() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState(7); // Últimos 7 dias

  // Buscar lançamentos do período
  const { data: cashFlowData } = useQuery({
    queryKey: ["cash-flow", selectedDate, dateRange],
    queryFn: async () => {
      const endDate = new Date(selectedDate);
      const startDate = subDays(endDate, dateRange - 1);
      
      const { data, error } = await supabase
        .from("financial_entries")
        .select(`
          *,
          expense_categories(name),
          cost_centers(name),
          orders(order_number)
        `)
        .gte("entry_date", startDate.toISOString().split('T')[0])
        .lte("entry_date", endDate.toISOString().split('T')[0])
        .order("entry_date", { ascending: false })
        .order("entry_time", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Calcular totais
  const totalIncome = cashFlowData?.filter(entry => entry.entry_type === 'income')
    .reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

  const totalExpenses = cashFlowData?.filter(entry => entry.entry_type === 'expense')
    .reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

  const balance = totalIncome - totalExpenses;

  // Agrupar por data
  const groupedByDate = cashFlowData?.reduce((groups: any, entry) => {
    const date = entry.entry_date;
    if (!groups[date]) {
      groups[date] = {
        date,
        entries: [],
        totalIncome: 0,
        totalExpenses: 0,
      };
    }
    groups[date].entries.push(entry);
    
    if (entry.entry_type === 'income') {
      groups[date].totalIncome += Number(entry.amount);
    } else {
      groups[date].totalExpenses += Number(entry.amount);
    }
    
    return groups;
  }, {}) || {};

  const dailySummary = Object.values(groupedByDate).sort((a: any, b: any) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {[7, 15, 30].map((days) => (
                <Button
                  key={days}
                  variant={dateRange === days ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateRange(days)}
                >
                  {days} dias
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Receitas</p>
                <p className="text-2xl font-bold text-green-700">
                  R$ {totalIncome.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500 rounded-lg">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Despesas</p>
                <p className="text-2xl font-bold text-red-700">
                  R$ {totalExpenses.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg ${balance >= 0 
          ? 'bg-gradient-to-br from-blue-50 to-blue-100' 
          : 'bg-gradient-to-br from-orange-50 to-orange-100'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${balance >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}>
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Saldo</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  R$ {balance.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lançamentos</p>
                <p className="text-2xl font-bold text-purple-700">
                  {cashFlowData?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fluxo diário */}
      <Card>
        <CardHeader>
          <CardTitle>Fluxo de Caixa Diário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {dailySummary.map((day: any) => (
              <div key={day.date} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {format(new Date(day.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">
                      +R$ {day.totalIncome.toFixed(2)}
                    </span>
                    <span className="text-red-600">
                      -R$ {day.totalExpenses.toFixed(2)}
                    </span>
                    <span className={`font-semibold ${
                      (day.totalIncome - day.totalExpenses) >= 0 ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      = R$ {(day.totalIncome - day.totalExpenses).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {day.entries
                      .sort((a: any, b: any) => a.entry_time.localeCompare(b.entry_time))
                      .map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-sm">
                          {entry.entry_time.slice(0, 5)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{entry.description}</p>
                            {entry.orders?.order_number && (
                              <p className="text-sm text-gray-500">
                                Pedido #{entry.orders.order_number}
                              </p>
                            )}
                            {entry.notes && (
                              <p className="text-sm text-gray-500">{entry.notes}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={entry.entry_type === 'income' ? 'default' : 'destructive'}>
                            {entry.entry_type === 'income' ? 'Receita' : 'Despesa'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {entry.expense_categories?.name && (
                            <Badge variant="outline">
                              {entry.expense_categories.name}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={entry.entry_type === 'income' ? 'text-green-600' : 'text-red-600'}>
                            {entry.entry_type === 'income' ? '+' : '-'}R$ {Number(entry.amount).toFixed(2)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
