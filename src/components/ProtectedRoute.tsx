
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  subscriptionRequired?: 'start' | 'pro' | 'premium';
}

export default function ProtectedRoute({ children, subscriptionRequired }: ProtectedRouteProps) {
  const { user, loading, subscription, checkSubscription } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth';
    }
  }, [user, loading]);

  const handleUpgradeClick = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    console.log('Iniciando processo de upgrade para plano:', subscriptionRequired);
    toast.info('Redirecionando para checkout...');
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        console.error('Erro de sessão:', sessionError);
        toast.error('Erro de autenticação. Faça login novamente.');
        return;
      }

      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: { plan: subscriptionRequired },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (checkoutError) {
        console.error('Erro no checkout:', checkoutError);
        toast.error('Erro ao processar checkout: ' + checkoutError.message);
        return;
      }

      if (checkoutData?.url) {
        console.log('Redirecionando para checkout:', checkoutData.url);
        window.open(checkoutData.url, '_blank');
      } else {
        console.error('URL de checkout não encontrada:', checkoutData);
        toast.error('Erro ao obter URL de checkout');
      }
    } catch (error) {
      console.error('Erro durante processo de checkout:', error);
      toast.error('Erro inesperado ao processar checkout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Verificar se a assinatura é necessária
  if (subscriptionRequired && !subscription.subscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <Crown className="w-16 h-16 mx-auto mb-4 text-purple-600" />
            <h2 className="text-xl font-semibold mb-4">Assinatura Necessária</h2>
            <p className="text-gray-600 mb-4">
              Esta funcionalidade requer uma assinatura ativa do plano {subscriptionRequired.toUpperCase()}.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Status atual: {subscription.tier ? `Plano ${subscription.tier.toUpperCase()}` : 'Não assinante'}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleUpgradeClick}
                className="bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Upgrade para {subscriptionRequired.toUpperCase()}
              </Button>
              <Button
                onClick={() => checkSubscription()}
                variant="outline"
                className="flex items-center gap-2"
              >
                Verificar Status da Assinatura
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar nível da assinatura se necessário
  if (subscriptionRequired && subscription.subscribed) {
    const tierOrder = { start: 1, pro: 2, premium: 3 };
    const userTier = tierOrder[subscription.tier as keyof typeof tierOrder] || 0;
    const requiredTier = tierOrder[subscriptionRequired];

    console.log('Subscription tier check:', {
      userTier: subscription.tier,
      userTierLevel: userTier,
      requiredTier: subscriptionRequired,
      requiredTierLevel: requiredTier,
      hasAccess: userTier >= requiredTier
    });

    if (userTier < requiredTier) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="max-w-md">
            <CardContent className="text-center p-8">
              <Crown className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h2 className="text-xl font-semibold mb-4">Upgrade Necessário</h2>
              <p className="text-gray-600 mb-4">
                Esta funcionalidade requer o plano {subscriptionRequired.toUpperCase()}.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Seu plano atual: {subscription.tier?.toUpperCase() || 'Desconhecido'}.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleUpgradeClick}
                  className="bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade para {subscriptionRequired.toUpperCase()}
                </Button>
                <Button
                  onClick={() => checkSubscription()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Verificar Status da Assinatura
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
}
