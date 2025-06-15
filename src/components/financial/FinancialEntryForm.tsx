
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatBrazilDateTime } from "@/utils/timezone";
import { useAuth } from "@/hooks/useAuth";

interface FinancialEntryFormProps {
  onSuccess: () => void;
}

export default function FinancialEntryForm({ onSuccess }: FinancialEntryFormProps) {
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
  const { userProfile } = useAuth();

  const { data: expenseCategories } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("FinancialEntryForm - Company ID check:", userProfile?.company_id);
      
      if (!userProfile?.company_id) {
        console.error("Company ID not found in userProfile:", userProfile);
        throw new Error("Company ID não encontrado. Verifique se você está logado corretamente.");
      }

      const entryData = {
        ...data,
        company_id: userProfile.company_id
      };

      console.log("FinancialEntryForm - Creating entry with data:", entryData);

      const { error } = await supabase.from("financial_entries").insert(entryData);
      if (error) {
        console.error("Error creating financial entry:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Lançamento criado com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      console.error("Erro ao criar lançamento:", error);
      toast.error("Erro ao criar lançamento: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!userProfile?.company_id) {
      toast.error("Company ID não encontrado. Verifique se você está logado corretamente.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    
    const { date, time } = formatBrazilDateTime(new Date());
    
    const data = {
      description: formData.get("description") as string,
      amount: parseFloat(formData.get("amount") as string),
      entry_date: formData.get("entry_date") as string || date,
      entry_time: formData.get("entry_time") as string || time,
      entry_type: entryType,
      expense_category_id: entryType === 'expense' ? 
        (formData.get("expense_category_id") as string || null) : null,
      notes: formData.get("notes") as string || null,
    };

    createEntryMutation.mutate(data);
  };

  const { date, time } = formatBrazilDateTime(new Date());

  // Se não há company_id, mostrar mensagem de erro
  if (!userProfile?.company_id) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro: Company ID não encontrado. Verifique se você está logado corretamente.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <RadioGroup value={entryType} onValueChange={(value: 'income' | 'expense') => setEntryType(value)}>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="income" id="income" />
            <Label htmlFor="income">Receita</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="expense" id="expense" />
            <Label htmlFor="expense">Despesa</Label>
          </div>
        </div>
      </RadioGroup>

      <Input
        name="description"
        placeholder="Descrição do lançamento"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          name="amount"
          type="number"
          step="0.01"
          placeholder="Valor"
          required
        />
        <Input
          name="entry_date"
          type="date"
          defaultValue={date}
          required
        />
      </div>

      <Input
        name="entry_time"
        type="time"
        defaultValue={time}
        required
      />

      {entryType === 'expense' && (
        <Select name="expense_category_id">
          <SelectTrigger>
            <SelectValue placeholder="Categoria de despesa" />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Textarea
        name="notes"
        placeholder="Observações (opcional)"
      />

      <Button 
        type="submit" 
        className="w-full"
        disabled={createEntryMutation.isPending}
      >
        {createEntryMutation.isPending ? "Criando..." : "Criar Lançamento"}
      </Button>
    </form>
  );
}
