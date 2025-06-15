
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

export function useCompanyData() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const companyId = userProfile?.company_id;

  // Hook para buscar dados de uma tabela com filtro por company_id
  const useCompanyTable = <T extends TableName>(tableName: T, options?: any) => {
    return useQuery({
      queryKey: [tableName, companyId],
      queryFn: async () => {
        if (!companyId) return [];
        
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('company_id', companyId);

        if (error) throw error;
        return data;
      },
      enabled: !!companyId,
      ...options,
    });
  };

  // Hook para inserir dados com company_id automático
  const useCompanyInsert = <T extends TableName>(tableName: T) => {
    return useMutation({
      mutationFn: async (data: any) => {
        if (!companyId) throw new Error('Company ID não encontrado');

        const { data: result, error } = await supabase
          .from(tableName)
          .insert({ ...data, company_id: companyId })
          .select()
          .single();

        if (error) throw error;
        return result;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [tableName, companyId] });
      },
    });
  };

  // Hook para atualizar dados
  const useCompanyUpdate = <T extends TableName>(tableName: T) => {
    return useMutation({
      mutationFn: async ({ id, data }: { id: string; data: any }) => {
        const { data: result, error } = await supabase
          .from(tableName)
          .update(data)
          .eq('id' as any, id)
          .eq('company_id' as any, companyId)
          .select()
          .single();

        if (error) throw error;
        return result;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [tableName, companyId] });
      },
    });
  };

  // Hook para deletar dados
  const useCompanyDelete = <T extends TableName>(tableName: T) => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id' as any, id)
          .eq('company_id' as any, companyId);

        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [tableName, companyId] });
      },
    });
  };

  return {
    companyId,
    useCompanyTable,
    useCompanyInsert,
    useCompanyUpdate,
    useCompanyDelete,
  };
}
