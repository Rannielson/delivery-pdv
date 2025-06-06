
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingCart } from "lucide-react";
import CashFlow from "@/components/financial/CashFlow";
import PurchaseBudgets from "@/components/financial/PurchaseBudgets";

export default function Financial() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Módulo Financeiro
            </h1>
            <p className="text-emerald-100 text-lg">
              Gestão financeira completa e inteligente para seu negócio
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="cash-flow" className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-2">
          <TabsList className="grid w-full grid-cols-2 bg-gray-50">
            <TabsTrigger 
              value="cash-flow" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger 
              value="purchase-budgets" 
              className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
            >
              <ShoppingCart className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="cash-flow" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <TrendingUp className="w-5 h-5" />
                Fluxo de Caixa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <CashFlow />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase-budgets" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <ShoppingCart className="w-5 h-5" />
                Orçamentos de Compra
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <PurchaseBudgets />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
