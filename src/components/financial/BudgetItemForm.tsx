
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

interface BudgetItemFormProps {
  budgetId: string;
  availableItems: any[];
  onSuccess: () => void;
}

export default function BudgetItemForm({ budgetId, availableItems, onSuccess }: BudgetItemFormProps) {
  const [itemType, setItemType] = useState<'existing' | 'custom'>('existing');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  const createItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("purchase_budget_items").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item adicionado com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar item: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const subtotal = quantity * unitPrice;
    
    const data = {
      budget_id: budgetId,
      item_id: itemType === 'existing' ? selectedItemId || null : null,
      description: formData.get("description") as string,
      unit_price: unitPrice,
      quantity: quantity,
      subtotal: subtotal,
      notes: formData.get("notes") as string || null,
    };

    createItemMutation.mutate(data);
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = availableItems.find(i => i.id === itemId);
    if (item) {
      setUnitPrice(Number(item.price));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <RadioGroup value={itemType} onValueChange={(value: 'existing' | 'custom') => setItemType(value)}>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="existing" id="existing" />
            <Label htmlFor="existing">Item Cadastrado</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom">Item Personalizado</Label>
          </div>
        </div>
      </RadioGroup>

      {itemType === 'existing' ? (
        <Select onValueChange={handleItemSelect} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um item" />
          </SelectTrigger>
          <SelectContent>
            {availableItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} - {item.category} (R$ {Number(item.price).toFixed(2)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          name="description"
          placeholder="Descrição do item personalizado"
          required
        />
      )}

      {itemType === 'existing' && selectedItemId && (
        <Input
          name="description"
          placeholder="Descrição adicional (opcional)"
          defaultValue={availableItems.find(i => i.id === selectedItemId)?.name || ''}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Quantidade</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <Label>Valor Unitário</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Subtotal:</p>
        <p className="text-lg font-semibold text-green-600">
          R$ {(quantity * unitPrice).toFixed(2)}
        </p>
      </div>

      <Textarea
        name="notes"
        placeholder="Observações (opcional)"
      />

      <Button 
        type="submit" 
        className="w-full"
        disabled={createItemMutation.isPending}
      >
        {createItemMutation.isPending ? "Adicionando..." : "Adicionar Item"}
      </Button>
    </form>
  );
}
