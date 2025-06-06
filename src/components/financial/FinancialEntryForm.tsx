
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface FinancialEntryFormProps {
  costCenters: any[];
  categories: any[];
  onSuccess: () => void;
}

export default function FinancialEntryForm({ 
  costCenters, 
  categories, 
  onSuccess 
}: FinancialEntryFormProps) {
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');

  const createEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("financial_entries").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lançamento criado com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao criar lançamento: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      description: formData.get("description") as string,
      amount: parseFloat(formData.get("amount") as string),
      entry_date: formData.get("entry_date") as string,
      entry_time: formData.get("entry_time") as string,
      entry_type: entryType,
      expense_category_id: entryType === 'expense' ? 
        (formData.get("expense_category_id") as string || null) : null,
      cost_center_id: formData.get("cost_center_id") as string || null,
      notes: formData.get("notes") as string || null,
    };

    createEntryMutation.mutate(data);
  };

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
          defaultValue={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <Input
        name="entry_time"
        type="time"
        defaultValue={new Date().toTimeString().slice(0, 5)}
        required
      />

      {entryType === 'expense' && (
        <Select name="expense_category_id">
          <SelectTrigger>
            <SelectValue placeholder="Categoria de despesa" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select name="cost_center_id">
        <SelectTrigger>
          <SelectValue placeholder="Centro de custo (opcional)" />
        </SelectTrigger>
        <SelectContent>
          {costCenters.map((center) => (
            <SelectItem key={center.id} value={center.id}>
              {center.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
