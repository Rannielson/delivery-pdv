
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

export function useCompanyData() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const companyId = userProfile?.company_id;

  console.log("useCompanyData - Company ID:", companyId);
  console.log("useCompanyData - User Profile:", userProfile);

  // Hook para buscar dados de uma tabela com filtro por company_id
  const useCompanyTable = <T extends TableName>(tableName: T, options?: any) => {
    return useQuery({
      queryKey: [tableName, companyId],
      queryFn: async () => {
        if (!companyId) {
          console.warn(`useCompanyTable: No company ID found for table ${tableName}`);
          return [];
        }
        
        console.log(`useCompanyTable: Fetching ${tableName} for company ${companyId}`);
        
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('company_id', companyId);

        if (error) {
          console.error(`Error fetching ${tableName}:`, error);
          throw error;
        }
        
        console.log(`useCompanyTable: Found ${data?.length || 0} records for ${tableName}`);
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
        if (!companyId) {
          console.error(`useCompanyInsert: Company ID não encontrado para inserir em ${tableName}`);
          throw new Error('Company ID não encontrado');
        }

        console.log(`useCompanyInsert: Inserting into ${tableName} with company_id ${companyId}`);

        const { data: result, error } = await supabase
          .from(tableName)
          .insert({ ...data, company_id: companyId })
          .select()
          .single();

        if (error) {
          console.error(`Error inserting into ${tableName}:`, error);
          throw error;
        }
        
        console.log(`useCompanyInsert: Successfully inserted into ${tableName}`);
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
        if (!companyId) {
          console.error(`useCompanyUpdate: Company ID não encontrado para atualizar ${tableName}`);
          throw new Error('Company ID não encontrado');
        }

        console.log(`useCompanyUpdate: Updating ${tableName} id ${id} for company ${companyId}`);

        const { data: result, error } = await supabase
          .from(tableName)
          .update(data)
          .eq('id' as any, id)
          .eq('company_id' as any, companyId)
          .select()
          .single();

        if (error) {
          console.error(`Error updating ${tableName}:`, error);
          throw error;
        }
        
        console.log(`useCompanyUpdate: Successfully updated ${tableName}`);
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
        if (!companyId) {
          console.error(`useCompanyDelete: Company ID não encontrado para deletar de ${tableName}`);
          throw new Error('Company ID não encontrado');
        }

        console.log(`useCompanyDelete: Deleting from ${tableName} id ${id} for company ${companyId}`);

        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id' as any, id)
          .eq('company_id' as any, companyId);

        if (error) {
          console.error(`Error deleting from ${tableName}:`, error);
          throw error;
        }
        
        console.log(`useCompanyDelete: Successfully deleted from ${tableName}`);
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
