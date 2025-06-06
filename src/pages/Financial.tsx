
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, TrendingUp, ShoppingCart, Building, DollarSign, Target } from "lucide-react";
import ChartOfAccounts from "@/components/financial/ChartOfAccounts";
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
          <div className="hidden lg:flex space-x-6">
            <div className="text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm text-emerald-100">Controle Total</p>
            </div>
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm text-emerald-100">Planejamento</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm text-emerald-100">Crescimento</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-xl transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <Building className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">Plano de Contas</h3>
            <p className="text-emerald-600 text-sm">Organize centros de custo e categorias</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50 hover:shadow-xl transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Fluxo de Caixa</h3>
            <p className="text-blue-600 text-sm">Acompanhe entradas e saídas em tempo real</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 hover:shadow-xl transition-all cursor-pointer">
          <CardContent className="p-6 text-center">
            <ShoppingCart className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Orçamentos</h3>
            <p className="text-purple-600 text-sm">Planeje compras e tome decisões inteligentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="chart-of-accounts" className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-2">
          <TabsList className="grid w-full grid-cols-3 bg-gray-50">
            <TabsTrigger 
              value="chart-of-accounts" 
              className="flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
            >
              <Building className="w-4 h-4" />
              Plano de Contas
            </TabsTrigger>
            <TabsTrigger 
              value="cash-flow" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4" />
              Fluxo de Caixa
            </TabsTrigger>
            <TabsTrigger 
              value="purchase-budgets" 
              className="flex items-center gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white"
            >
              <ShoppingCart className="w-4 h-4" />
              Orçamentos de Compra
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chart-of-accounts" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <Building className="w-5 h-5" />
                Plano de Contas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ChartOfAccounts />
            </CardContent>
          </Card>
        </TabsContent>

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
