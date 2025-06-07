
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowLeft, Loader2, Check, Crown, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const businessSegments = [
  "Delivery de Comida",
  "Pizzaria", 
  "Lanchonete",
  "Restaurante",
  "Açaíteria",
  "Doceria",
  "Farmácia",
  "Pet Shop",
  "Outros"
];

const plans = {
  start: { 
    name: "Start", 
    price: "49,90",
    icon: Star,
    features: ["Até 100 pedidos/mês", "Dashboard básico", "Suporte por email"],
    color: "from-blue-500 to-blue-600"
  },
  pro: { 
    name: "Pro", 
    price: "69,90",
    icon: Zap,
    features: ["Pedidos ilimitados", "Relatórios avançados", "Integração completa", "Suporte prioritário"],
    color: "from-purple-500 to-purple-600",
    popular: true
  },
  premium: { 
    name: "Premium", 
    price: "99,90",
    icon: Crown,
    features: ["Tudo do Pro", "IA para análise", "Multi-lojas", "Suporte 24/7", "Consultoria"],
    color: "from-gold-500 to-yellow-600"
  }
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    cpf: "",
    businessName: "",
    segment: ""
  });

  const { signIn, signUp, user, subscription } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success('Login realizado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Senhas não conferem!");
      return;
    }

    if (!formData.businessName || !formData.segment) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      console.log('Iniciando registro do usuário...');
      const { data, error } = await signUp(formData.email, formData.password, {
        full_name: formData.name,
        phone: formData.phone,
        cpf: formData.cpf,
        business_name: formData.businessName,
        segment: formData.segment
      });

      if (error) {
        console.error('Erro no signup:', error);
        if (error.message.includes('already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      console.log('Usuário criado com sucesso:', data.user?.id);

      if (data.user) {
        try {
          console.log('Criando checkout para plano:', selectedPlan);
          
          // Aguardar um pouco para garantir que a sessão esteja disponível
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Obter a sessão mais recente
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !sessionData.session) {
            console.error('Erro de sessão:', sessionError);
            toast.error('Conta criada com sucesso! Faça login e tente novamente o checkout.');
            setLoading(false);
            return;
          }

          // Criar checkout do Stripe
          const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
            body: { plan: selectedPlan },
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
          });

          if (checkoutError) {
            console.error('Erro no checkout:', checkoutError);
            toast.error('Conta criada! Erro ao processar pagamento: ' + checkoutError.message);
            setLoading(false);
            return;
          }

          console.log('Checkout criado com sucesso:', checkoutData);

          // Verificar se temos a URL do checkout
          if (checkoutData?.url) {
            console.log('Redirecionando para:', checkoutData.url);
            toast.success('Conta criada! Redirecionando para pagamento...');
            
            // Redirecionar para o checkout
            setTimeout(() => {
              window.location.href = checkoutData.url;
            }, 1000);
          } else {
            console.error('URL de checkout não encontrada:', checkoutData);
            toast.error('Conta criada! Erro ao obter URL de pagamento');
          }
        } catch (checkoutError) {
          console.error('Erro durante processo de checkout:', checkoutError);
          toast.success('Conta criada com sucesso! Erro no checkout - tente fazer login e acessar novamente.');
        }
      }
    } catch (error) {
      console.error('Erro geral no registro:', error);
      toast.error('Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planKey: string) => {
    if (!user) {
      toast.error('Faça login primeiro');
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast.error('Sessão expirada, faça login novamente');
        return;
      }

      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: { plan: planKey },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (checkoutError) {
        toast.error('Erro ao processar upgrade: ' + checkoutError.message);
        return;
      }

      if (checkoutData?.url) {
        toast.success('Redirecionando para pagamento...');
        setTimeout(() => {
          window.location.href = checkoutData.url;
        }, 1000);
      }
    } catch (error) {
      toast.error('Erro ao fazer upgrade');
    } finally {
      setLoading(false);
    }
  };

  // Se o usuário estiver logado, mostrar opções de upgrade
  if (user && (showUpgrade || !subscription.subscribed)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-purple-100 p-6">
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <Link to="/dashboard" className="flex items-center gap-3">
                <ArrowLeft className="w-5 h-5 text-purple-600" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                    <Zap className="text-white w-5 h-5" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                    PDelivery
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Upgrade Plans */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-6xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Escolha seu Plano
              </h1>
              <p className="text-gray-600">
                Upgrade sua conta para acessar recursos premium
              </p>
              {subscription.tier && (
                <Badge variant="outline" className="mt-2">
                  Plano atual: {subscription.tier.toUpperCase()}
                </Badge>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {Object.entries(plans).map(([key, plan]) => {
                const Icon = plan.icon;
                const isCurrentPlan = subscription.tier === key;
                const isUpgrade = !subscription.tier || (subscription.tier === 'start' && key !== 'start') || (subscription.tier === 'pro' && key === 'premium');
                
                return (
                  <Card key={key} className={`relative ${plan.popular ? 'ring-2 ring-purple-500 shadow-xl' : 'shadow-lg'} ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-purple-500 text-white">Mais Popular</Badge>
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute -top-3 right-4">
                        <Badge className="bg-green-500 text-white">Seu Plano</Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center">
                      <div className={`w-12 h-12 bg-gradient-to-r ${plan.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                        <Icon className="text-white w-6 h-6" />
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <div className="text-3xl font-bold text-gray-800">
                        R$ {plan.price}
                        <span className="text-sm font-normal text-gray-500">/mês</span>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <Button
                        onClick={() => handleUpgrade(key)}
                        disabled={loading || isCurrentPlan}
                        className={`w-full ${plan.popular ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                        variant={isCurrentPlan ? 'outline' : plan.popular ? 'default' : 'outline'}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isCurrentPlan ? 'Plano Atual' : isUpgrade ? `Upgrade para ${plan.name}` : `Selecionar ${plan.name}`}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-purple-100 p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <ArrowLeft className="w-5 h-5 text-purple-600" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <Zap className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  PDelivery
                </span>
              </div>
            </Link>
            
            {user && (
              <Button
                onClick={() => setShowUpgrade(true)}
                variant="outline"
                className="text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                Ver Planos
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-bold text-gray-800">
                {isLogin ? "Entrar na sua conta" : "Criar conta"}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? "Acesse seu painel de controle" 
                  : "Comece sua jornada conosco"
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs value={isLogin ? "login" : "register"} onValueChange={(value) => setIsLogin(value === "login")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Registrar</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Sua senha"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Entrar
                    </Button>
                    
                    <div className="text-center">
                      <a href="#" className="text-sm text-purple-600 hover:underline">
                        Esqueceu sua senha?
                      </a>
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    {/* Seleção de Plano */}
                    <div className="space-y-2">
                      <Label>Escolha seu Plano</Label>
                      <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(plans).map(([key, plan]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                {plan.popular && <Badge variant="secondary" className="text-xs">Popular</Badge>}
                                {plan.name} - R$ {plan.price}/mês
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Form fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                          id="name"
                          placeholder="João Silva"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          placeholder="(11) 99999-9999"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={(e) => handleInputChange("cpf", e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="business-name">Nome da Empresa</Label>
                      <Input
                        id="business-name"
                        placeholder="Minha Empresa Ltda"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange("businessName", e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="segment">Segmento</Label>
                      <Select onValueChange={(value) => handleInputChange("segment", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione seu segmento" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessSegments.map((segment) => (
                            <SelectItem key={segment} value={segment}>
                              {segment}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Senha</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirme sua senha"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                      disabled={loading}
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Criar Conta e Pagar
                    </Button>
                    
                    <p className="text-xs text-center text-gray-500">
                      Ao criar uma conta, você concorda com nossos{" "}
                      <a href="#" className="text-purple-600 hover:underline">
                        Termos de Uso
                      </a>{" "}
                      e{" "}
                      <a href="#" className="text-purple-600 hover:underline">
                        Política de Privacidade
                      </a>
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Precisa de ajuda?{" "}
              <a href="#" className="text-purple-600 hover:underline">
                Entre em contato
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
