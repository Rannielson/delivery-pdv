
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, MapPin, DollarSign, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Neighborhoods() {
  const [newNeighborhood, setNewNeighborhood] = useState({
    name: "",
    delivery_fee: ""
  });
  const [editingNeighborhood, setEditingNeighborhood] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: neighborhoods } = useQuery({
    queryKey: ["neighborhoods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("neighborhoods")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createNeighborhoodMutation = useMutation({
    mutationFn: async (neighborhood: any) => {
      const { data, error } = await supabase
        .from("neighborhoods")
        .insert({
          name: neighborhood.name,
          delivery_fee: parseFloat(neighborhood.delivery_fee)
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neighborhoods"] });
      setNewNeighborhood({ name: "", delivery_fee: "" });
      toast.success("Bairro cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar bairro: " + error.message);
    },
  });

  const updateNeighborhoodMutation = useMutation({
    mutationFn: async (neighborhood: any) => {
      const { data, error } = await supabase
        .from("neighborhoods")
        .update({
          name: neighborhood.name,
          delivery_fee: parseFloat(neighborhood.delivery_fee),
          updated_at: new Date().toISOString()
        })
        .eq("id", neighborhood.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neighborhoods"] });
      setEditingNeighborhood(null);
      setIsEditDialogOpen(false);
      toast.success("Bairro atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar bairro: " + error.message);
    },
  });

  const deleteNeighborhoodMutation = useMutation({
    mutationFn: async (neighborhoodId: string) => {
      const { error } = await supabase
        .from("neighborhoods")
        .delete()
        .eq("id", neighborhoodId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["neighborhoods"] });
      toast.success("Bairro excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir bairro: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNeighborhood.name || !newNeighborhood.delivery_fee) {
      toast.error("Preencha todos os campos");
      return;
    }
    createNeighborhoodMutation.mutate(newNeighborhood);
  };

  const handleEdit = (neighborhood: any) => {
    setEditingNeighborhood({
      ...neighborhood,
      delivery_fee: neighborhood.delivery_fee.toString()
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingNeighborhood.name || !editingNeighborhood.delivery_fee) {
      toast.error("Preencha todos os campos");
      return;
    }
    updateNeighborhoodMutation.mutate(editingNeighborhood);
  };

  const handleDelete = (neighborhoodId: string) => {
    if (confirm("Tem certeza que deseja excluir este bairro?")) {
      deleteNeighborhoodMutation.mutate(neighborhoodId);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Bairros
          </h1>
          <p className="text-gray-600 mt-2">Gerencie os bairros de entrega</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Plus className="w-5 h-5" />
              Novo Bairro
            </CardTitle>
            <CardDescription>
              Cadastre um novo bairro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Nome do Bairro
                </Label>
                <Input
                  placeholder="Ex: Centro, Zona Norte..."
                  value={newNeighborhood.name}
                  onChange={(e) => setNewNeighborhood(prev => ({ ...prev, name: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Taxa de Entrega (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newNeighborhood.delivery_fee}
                  onChange={(e) => setNewNeighborhood(prev => ({ ...prev, delivery_fee: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <Button 
                type="submit" 
                disabled={createNeighborhoodMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
              >
                {createNeighborhoodMutation.isPending ? "Cadastrando..." : "Cadastrar Bairro"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-purple-700">Lista de Bairros</CardTitle>
              <CardDescription>
                {neighborhoods?.length || 0} bairros cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Taxa de Entrega</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {neighborhoods?.map((neighborhood) => (
                    <TableRow key={neighborhood.id}>
                      <TableCell className="font-medium">{neighborhood.name}</TableCell>
                      <TableCell className="font-semibold text-purple-600">
                        R$ {neighborhood.delivery_fee.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          neighborhood.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {neighborhood.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(neighborhood.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(neighborhood)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(neighborhood.id)}
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

      {/* Dialog para editar bairro */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Bairro</DialogTitle>
            <DialogDescription>
              Altere as informações do bairro
            </DialogDescription>
          </DialogHeader>
          {editingNeighborhood && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Nome do Bairro
                </Label>
                <Input
                  placeholder="Ex: Centro, Zona Norte..."
                  value={editingNeighborhood.name}
                  onChange={(e) => setEditingNeighborhood(prev => ({ ...prev, name: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Taxa de Entrega (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editingNeighborhood.delivery_fee}
                  onChange={(e) => setEditingNeighborhood(prev => ({ ...prev, delivery_fee: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdate}
                  disabled={updateNeighborhoodMutation.isPending}
                  className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
                >
                  {updateNeighborhoodMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
