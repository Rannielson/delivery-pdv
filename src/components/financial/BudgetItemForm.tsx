
import { useState, useEffect } from "react";
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
  editingItem?: any;
  onSuccess: () => void;
}

export default function BudgetItemForm({ budgetId, availableItems, editingItem, onSuccess }: BudgetItemFormProps) {
  const [itemType, setItemType] = useState<'existing' | 'custom'>('existing');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Preencher dados quando editando
  useEffect(() => {
    if (editingItem) {
      setDescription(editingItem.description);
      setQuantity(Number(editingItem.quantity));
      setUnitPrice(Number(editingItem.unit_price));
      setNotes(editingItem.notes || '');
      
      if (editingItem.item_id) {
        setItemType('existing');
        setSelectedItemId(editingItem.item_id);
      } else {
        setItemType('custom');
      }
    }
  }, [editingItem]);

  const saveItemMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingItem) {
        const { error } = await supabase
          .from("purchase_budget_items")
          .update(data)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("purchase_budget_items")
          .insert({ ...data, budget_id: budgetId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? "Item atualizado com sucesso!" : "Item adicionado com sucesso!");
      onSuccess();
    },
    onError: (error) => {
      toast.error("Erro ao salvar item: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const subtotal = quantity * unitPrice;
    
    const data = {
      item_id: itemType === 'existing' ? selectedItemId || null : null,
      description: description,
      unit_price: unitPrice,
      quantity: quantity,
      subtotal: subtotal,
      notes: notes || null,
    };

    saveItemMutation.mutate(data);
  };

  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = availableItems.find(i => i.id === itemId);
    if (item) {
      setUnitPrice(Number(item.price));
      setDescription(item.name);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!editingItem && (
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
      )}

      {itemType === 'existing' && !editingItem ? (
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
        <div>
          <Label>Descrição</Label>
          <Input
            placeholder="Descrição do item"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
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

      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
        <p className="text-sm text-green-700 font-medium">Subtotal:</p>
        <p className="text-2xl font-bold text-green-700">
          R$ {(quantity * unitPrice).toFixed(2)}
        </p>
      </div>

      <div>
        <Label>Observações</Label>
        <Textarea
          placeholder="Observações (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-purple-600 hover:bg-purple-700"
        disabled={saveItemMutation.isPending}
      >
        {saveItemMutation.isPending 
          ? (editingItem ? "Atualizando..." : "Adicionando...") 
          : (editingItem ? "Atualizar Item" : "Adicionar Item")
        }
      </Button>
    </form>
  );
}
