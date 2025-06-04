
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePriorityUpdater = () => {
  const queryClient = useQueryClient();

  const { data: prioritySettings } = useQuery({
    queryKey: ['priority-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('priority_settings')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const updateOrderPriorityMutation = useMutation({
    mutationFn: async ({ orderId, priorityLevel, priorityLabel }: { 
      orderId: string; 
      priorityLevel: number; 
      priorityLabel: string;
    }) => {
      const { error } = await supabase
        .from('orders')
        .update({
          priority_level: priorityLevel,
          priority_label: priorityLabel,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const checkAndUpdatePriorities = async () => {
    if (!prioritySettings || prioritySettings.length === 0) return;

    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'em_producao', 'a_caminho'])
        .is('priority_level', null);

      if (error) throw error;

      const now = new Date();

      for (const order of orders || []) {
        const orderDate = new Date(order.created_at);
        const minutesDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));

        // Encontrar a configuração de prioridade aplicável
        const applicableSetting = prioritySettings
          .filter(setting => setting.status === order.status)
          .find(setting => minutesDiff >= setting.minutes_threshold);

        if (applicableSetting) {
          updateOrderPriorityMutation.mutate({
            orderId: order.id,
            priorityLevel: applicableSetting.priority_level,
            priorityLabel: applicableSetting.priority_label
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar prioridades:', error);
    }
  };

  useEffect(() => {
    // Verificar prioridades a cada 5 minutos
    const interval = setInterval(checkAndUpdatePriorities, 5 * 60 * 1000);
    
    // Verificar uma vez ao carregar
    checkAndUpdatePriorities();

    return () => clearInterval(interval);
  }, [prioritySettings]);

  return { checkAndUpdatePriorities };
};
