
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Star, Zap, Shield, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Start",
    price: "49,90",
    description: "Ideal para pequenos negócios que estão começando",
    features: [
      "Sistema de pedidos completo",
      "Gestão de clientes",
      "Controle financeiro básico",
      "Relatórios essenciais",
      "Suporte por email"
    ],
    limitations: [
      "Sem monitoramento de pedidos",
      "Sem webhook do WhatsApp"
    ],
    popular: false
  },
  {
    name: "Pro",
    price: "69,90",
    description: "Para empresas que precisam de mais controle",
    features: [
      "Tudo do plano Start",
      "Monitoramento de pedidos em tempo real",
      "Dashboard avançado",
      "Gestão de estoque",
      "Relatórios detalhados",
      "Suporte prioritário"
    ],
    limitations: [
      "Sem webhook personalizado de mensagens"
    ],
    popular: true
  },
  {
    name: "Premium",
    price: "99,90",
    description: "Solução completa para empresas que querem tudo",
    features: [
      "Tudo do plano Pro",
      "Webhook personalizado do WhatsApp",
      "Integração com APIs externas",
      "Automação avançada",
      "Multi-usuários",
      "Suporte 24/7",
      "Consultoria especializada"
    ],
    limitations: [],
    popular: false
  }
];

export default function Landing() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-purple-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                <Zap className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                PDelivery
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost" className="text-purple-600 hover:text-purple-700">
                  Entrar
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700">
                  Começar Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            Revolucione seu Delivery
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Sistema completo de gestão para delivery e restaurantes. 
            Controle pedidos, clientes, financeiro e muito mais em uma única plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-lg px-8 py-4"
            >
              Começar Teste Grátis
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-4 border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              Ver Demonstração
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            ✨ Teste grátis por 7 dias • Sem compromisso • Suporte incluído
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-white/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">
              Tudo que você precisa para crescer
            </h2>
            <p className="text-xl text-gray-600">
              Funcionalidades pensadas para otimizar cada aspecto do seu negócio
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestão Inteligente</h3>
              <p className="text-gray-600">
                Dashboard completo com métricas em tempo real para tomar decisões baseadas em dados.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Clientes Felizes</h3>
              <p className="text-gray-600">
                Sistema de pedidos intuitivo e notificações automáticas via WhatsApp.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Seguro e Confiável</h3>
              <p className="text-gray-600">
                Seus dados protegidos com criptografia e backup automático na nuvem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-800">
              Escolha o plano ideal para você
            </h2>
            <p className="text-xl text-gray-600">
              Transparência total, sem taxas ocultas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                  plan.popular 
                    ? 'border-2 border-purple-500 scale-105 shadow-xl' 
                    : 'border border-gray-200 hover:border-purple-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-500 to-violet-600 text-white text-center py-2 text-sm font-semibold">
                    ⭐ Mais Popular
                  </div>
                )}
                
                <CardHeader className={plan.popular ? "pt-12" : ""}>
                  <CardTitle className="text-2xl text-center">{plan.name}</CardTitle>
                  <CardDescription className="text-center">{plan.description}</CardDescription>
                  <div className="text-center mt-4">
                    <span className="text-4xl font-bold text-purple-600">R$ {plan.price}</span>
                    <span className="text-gray-500">/mês</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-center gap-2 opacity-60">
                        <span className="w-5 h-5 text-red-400">✗</span>
                        <span className="text-sm">{limitation}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700' 
                        : 'bg-gray-800 hover:bg-gray-900'
                    }`}
                    onClick={() => setSelectedPlan(plan.name)}
                  >
                    Começar com {plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para revolucionar seu delivery?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Junte-se a centenas de empresas que já transformaram seus negócios com o PDelivery
          </p>
          <Button 
            size="lg" 
            className="bg-white text-purple-600 hover:bg-gray-50 text-lg px-8 py-4"
          >
            Começar Agora - Grátis por 7 dias
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <Zap className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-bold">PDelivery</span>
              </div>
              <p className="text-gray-400">
                A plataforma mais completa para gestão de delivery e restaurantes.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-white">Preços</a></li>
                <li><a href="#" className="hover:text-white">Demonstração</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
                <li><a href="#" className="hover:text-white">WhatsApp</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Sobre</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Privacidade</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PDelivery. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
