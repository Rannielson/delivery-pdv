
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
import { Plus, Clock, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PrioritySettings() {
  const [newPriority, setNewPriority] = useState({
    status: "",
    minutes_threshold: 30,
    priority_level: 1,
    priority_label: ""
  });
  const [editingPriority, setEditingPriority] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: prioritySettings } = useQuery({
    queryKey: ["priority-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("priority_settings")
        .select("*")
        .order("priority_level");
      if (error) throw error;
      return data;
    },
  });

  const createPriorityMutation = useMutation({
    mutationFn: async (priority: typeof newPriority) => {
      const { data, error } = await supabase
        .from("priority_settings")
        .insert(priority)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priority-settings"] });
      setNewPriority({
        status: "",
        minutes_threshold: 30,
        priority_level: 1,
        priority_label: ""
      });
      toast.success("Configuração de prioridade criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar configuração: " + error.message);
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async (priority: any) => {
      const { data, error } = await supabase
        .from("priority_settings")
        .update({
          status: priority.status,
          minutes_threshold: priority.minutes_threshold,
          priority_level: priority.priority_level,
          priority_label: priority.priority_label,
          updated_at: new Date().toISOString()
        })
        .eq("id", priority.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priority-settings"] });
      setEditingPriority(null);
      setIsEditDialogOpen(false);
      toast.success("Configuração atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar configuração: " + error.message);
    },
  });

  const deletePriorityMutation = useMutation({
    mutationFn: async (priorityId: string) => {
      const { error } = await supabase
        .from("priority_settings")
        .delete()
        .eq("id", priorityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priority-settings"] });
      toast.success("Configuração excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir configuração: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriority.status || !newPriority.priority_label) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createPriorityMutation.mutate(newPriority);
  };

  const handleEdit = (priority: any) => {
    setEditingPriority(priority);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingPriority.status || !editingPriority.priority_label) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    updatePriorityMutation.mutate(editingPriority);
  };

  const handleDelete = (priorityId: string) => {
    if (confirm("Tem certeza que deseja excluir esta configuração?")) {
      deletePriorityMutation.mutate(priorityId);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pedido Aberto';
      case 'em_producao': return 'Em Produção';
      case 'a_caminho': return 'A Caminho';
      default: return status;
    }
  };

  const getPriorityColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Configurações de Prioridade
          </h1>
          <p className="text-gray-600 mt-2">Configure as regras automáticas de prioridade dos pedidos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Plus className="w-5 h-5" />
              Nova Configuração
            </CardTitle>
            <CardDescription>
              Defina quando um pedido deve ser marcado como prioritário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Status do Pedido</Label>
                <Select value={newPriority.status} onValueChange={(value) => setNewPriority(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-400">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pedido Aberto</SelectItem>
                    <SelectItem value="em_producao">Em Produção</SelectItem>
                    <SelectItem value="a_caminho">A Caminho</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Tempo Limite (minutos)
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={newPriority.minutes_threshold}
                  onChange={(e) => setNewPriority(prev => ({ ...prev, minutes_threshold: parseInt(e.target.value) || 30 }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label>Nível de Prioridade</Label>
                <Select value={newPriority.priority_level.toString()} onValueChange={(value) => setNewPriority(prev => ({ ...prev, priority_level: parseInt(value) }))}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Urgente</SelectItem>
                    <SelectItem value="2">2 - Muito Urgente</SelectItem>
                    <SelectItem value="3">3 - Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Rótulo da Prioridade
                </Label>
                <Input
                  placeholder="Ex: Urgente, Muito Urgente..."
                  value={newPriority.priority_label}
                  onChange={(e) => setNewPriority(prev => ({ ...prev, priority_label: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <Button 
                type="submit" 
                disabled={createPriorityMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
              >
                {createPriorityMutation.isPending ? "Criando..." : "Criar Configuração"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-purple-700">Configurações Ativas</CardTitle>
              <CardDescription>
                {prioritySettings?.length || 0} configurações cadastradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Tempo Limite</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Rótulo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prioritySettings?.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell className="font-medium">
                        {getStatusLabel(setting.status)}
                      </TableCell>
                      <TableCell>{setting.minutes_threshold} min</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(setting.priority_level)}`}>
                          Nível {setting.priority_level}
                        </span>
                      </TableCell>
                      <TableCell>{setting.priority_label}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(setting)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(setting.id)}
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

      {/* Dialog para editar configuração */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Configuração de Prioridade</DialogTitle>
            <DialogDescription>
              Altere as configurações de prioridade
            </DialogDescription>
          </DialogHeader>
          {editingPriority && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Status do Pedido</Label>
                <Select value={editingPriority.status} onValueChange={(value) => setEditingPriority(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pedido Aberto</SelectItem>
                    <SelectItem value="em_producao">Em Produção</SelectItem>
                    <SelectItem value="a_caminho">A Caminho</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tempo Limite (minutos)</Label>
                <Input
                  type="number"
                  min="1"
                  value={editingPriority.minutes_threshold}
                  onChange={(e) => setEditingPriority(prev => ({ ...prev, minutes_threshold: parseInt(e.target.value) || 30 }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Nível de Prioridade</Label>
                <Select value={editingPriority.priority_level.toString()} onValueChange={(value) => setEditingPriority(prev => ({ ...prev, priority_level: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Urgente</SelectItem>
                    <SelectItem value="2">2 - Muito Urgente</SelectItem>
                    <SelectItem value="3">3 - Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rótulo da Prioridade</Label>
                <Input
                  placeholder="Ex: Urgente, Muito Urgente..."
                  value={editingPriority.priority_label}
                  onChange={(e) => setEditingPriority(prev => ({ ...prev, priority_label: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdate}
                  disabled={updatePriorityMutation.isPending}
                  className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
                >
                  {updatePriorityMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
