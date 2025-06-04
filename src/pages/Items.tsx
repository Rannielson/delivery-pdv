
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Package, DollarSign, Tag, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Items() {
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: ""
  });
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: items } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase
        .from("items")
        .insert({
          name: item.name,
          price: parseFloat(item.price),
          category: item.category
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setNewItem({ name: "", price: "", category: "" });
      toast.success("Item cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar item: " + error.message);
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async (item: any) => {
      const { data, error } = await supabase
        .from("items")
        .update({
          name: item.name,
          price: parseFloat(item.price),
          category: item.category,
          updated_at: new Date().toISOString()
        })
        .eq("id", item.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setEditingItem(null);
      setIsEditDialogOpen(false);
      toast.success("Item atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar item: " + error.message);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      toast.success("Item excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir item: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.category) {
      toast.error("Preencha todos os campos");
      return;
    }
    createItemMutation.mutate(newItem);
  };

  const handleEdit = (item: any) => {
    setEditingItem({
      ...item,
      price: item.price.toString()
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingItem.name || !editingItem.price || !editingItem.category) {
      toast.error("Preencha todos os campos");
      return;
    }
    updateItemMutation.mutate(editingItem);
  };

  const handleDelete = (itemId: string) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const categories = ["Base", "Fruta", "Complemento", "Adicional"];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Itens
          </h1>
          <p className="text-gray-600 mt-2">Gerencie os itens individuais para composição dos produtos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Plus className="w-5 h-5" />
              Novo Item
            </CardTitle>
            <CardDescription>
              Cadastre um novo item para compor produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Nome do Item
                </Label>
                <Input
                  placeholder="Ex: Açaí base 300ml, Granola..."
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Preço (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newItem.price}
                  onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Categoria
                </Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-400">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                disabled={createItemMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
              >
                {createItemMutation.isPending ? "Cadastrando..." : "Cadastrar Item"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-purple-700">Lista de Itens</CardTitle>
              <CardDescription>
                {items?.length || 0} itens cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          {item.category}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-purple-600">
                        R$ {item.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog para editar item */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Altere as informações do item
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Nome do Item
                </Label>
                <Input
                  placeholder="Ex: Açaí base 300ml, Granola..."
                  value={editingItem.name}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Preço (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem(prev => ({ ...prev, price: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Categoria
                </Label>
                <Select 
                  value={editingItem.category} 
                  onValueChange={(value) => setEditingItem(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="border-purple-200 focus:border-purple-400">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdate}
                  disabled={updateItemMutation.isPending}
                  className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
                >
                  {updateItemMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
