
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Package, Users, Calculator, MapPin, CreditCard, TrendingUp, Eye } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-4">
            AçaíPDV
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sistema completo de gestão para seu negócio. Controle vendas, estoque, clientes e finanças de forma inteligente.
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="mt-8 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700">
              <Eye className="w-5 h-5 mr-2" />
              Acessar Dashboard
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-purple-700">
                <BarChart3 className="w-6 h-6" />
                Dashboard Inteligente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Visualize métricas importantes, rankings de produtos e clientes mais ativos em tempo real.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-green-700">
                <Package className="w-6 h-6" />
                Gestão de Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Cadastre produtos, itens e gerencie seu estoque de forma organizada e eficiente.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-700">
                <Users className="w-6 h-6" />
                Clientes & Bairros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Mantenha dados completos dos clientes e configure taxas de entrega por bairro.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-orange-700">
                <Calculator className="w-6 h-6" />
                Controle Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Plano de contas, fluxo de caixa automático e orçamentos de compra inteligentes.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-700">
                <TrendingUp className="w-6 h-6" />
                Monitoramento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Acompanhe pedidos em tempo real com sistema Kanban e notificações automáticas.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-violet-700">
                <CreditCard className="w-6 h-6" />
                Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Configure métodos de pagamento e tenha controle total sobre as transações.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-600 to-violet-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
            <p className="text-xl mb-8 opacity-90">
              Transforme a gestão do seu negócio com nossa plataforma completa
            </p>
            <Link to="/dashboard">
              <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
