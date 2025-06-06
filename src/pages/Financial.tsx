
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, ShoppingCart, Building } from "lucide-react";
import ChartOfAccounts from "@/components/financial/ChartOfAccounts";
import CashFlow from "@/components/financial/CashFlow";
import PurchaseBudgets from "@/components/financial/PurchaseBudgets";

export default function Financial() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Financeiro
          </h1>
          <p className="text-gray-600 mt-2">Gestão financeira completa do seu negócio</p>
        </div>
      </div>

      <Tabs defaultValue="chart-of-accounts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chart-of-accounts" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Plano de Contas
          </TabsTrigger>
          <TabsTrigger value="cash-flow" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Fluxo de Caixa
          </TabsTrigger>
          <TabsTrigger value="purchase-budgets" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Orçamentos de Compra
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chart-of-accounts">
          <ChartOfAccounts />
        </TabsContent>

        <TabsContent value="cash-flow">
          <CashFlow />
        </TabsContent>

        <TabsContent value="purchase-budgets">
          <PurchaseBudgets />
        </TabsContent>
      </Tabs>
    </div>
  );
}
