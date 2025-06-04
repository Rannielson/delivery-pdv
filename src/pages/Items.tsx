
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Item {
  id: string;
  name: string;
  price: number;
  category: string;
}

const Items = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([
    { id: "1", name: "Açaí base", price: 8.00, category: "Base" },
    { id: "2", name: "Granola", price: 2.50, category: "Complemento" },
    { id: "3", name: "Banana", price: 1.50, category: "Fruta" },
    { id: "4", name: "Leite condensado", price: 2.00, category: "Complemento" },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const newItem: Item = {
      id: editingId || Date.now().toString(),
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category,
    };

    if (editingId) {
      setItems(items.map(item => item.id === editingId ? newItem : item));
      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso!",
      });
      setEditingId(null);
    } else {
      setItems([...items, newItem]);
      toast({
        title: "Sucesso",
        description: "Item cadastrado com sucesso!",
      });
    }

    setFormData({ name: "", price: "", category: "" });
  };

  const handleEdit = (item: Item) => {
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
    });
    setEditingId(item.id);
  };

  const handleDelete = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast({
      title: "Sucesso",
      description: "Item removido com sucesso!",
    });
  };

  const categories = ["Base", "Fruta", "Complemento", "Adicional"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight bg-acai-gradient bg-clip-text text-transparent">
          Cadastro de Itens
        </h2>
        <p className="text-muted-foreground">
          Gerencie os itens base para composição dos seus produtos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Cadastro */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-acai-500" />
              {editingId ? "Editar Item" : "Novo Item"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Item</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Açaí base, Granola..."
                />
              </div>
              
              <div>
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-acai-gradient hover:opacity-90">
                  {editingId ? "Atualizar" : "Cadastrar"}
                </Button>
                {editingId && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: "", price: "", category: "" });
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Itens */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Itens Cadastrados ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold text-fresh-600">
                        R$ {item.price.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                        className="hover:bg-acai-100 hover:text-acai-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="hover:bg-red-100 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {items.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum item cadastrado ainda
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Items;
