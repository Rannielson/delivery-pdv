
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const handleRefreshSubscription = async () => {
    console.log('Manual subscription refresh requested');
    await checkSubscription();
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
            <h2 className="text-xl font-semibold mb-4">Assinatura Necessária</h2>
            <p className="text-gray-600 mb-4">
              Esta funcionalidade requer uma assinatura ativa do plano {subscriptionRequired.toUpperCase()}.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Status atual: {subscription.tier ? `Plano ${subscription.tier.toUpperCase()}` : 'Não assinante'}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleRefreshSubscription}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Verificar Assinatura
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                Assinar Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar nível da assinatura
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
              <h2 className="text-xl font-semibold mb-4">Upgrade Necessário</h2>
              <p className="text-gray-600 mb-4">
                Esta funcionalidade requer o plano {subscriptionRequired.toUpperCase()}.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Seu plano atual: {subscription.tier?.toUpperCase() || 'Desconhecido'}.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleRefreshSubscription}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Verificar Assinatura
                </Button>
                <Button
                  onClick={() => window.location.href = '/'}
                  className="bg-purple-600 text-white hover:bg-purple-700"
                >
                  Fazer Upgrade
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
