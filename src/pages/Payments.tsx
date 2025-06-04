
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, CreditCard, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Payments() {
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    name: ""
  });
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: paymentMethods } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createPaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethod: typeof newPaymentMethod) => {
      const { data, error } = await supabase
        .from("payment_methods")
        .insert(paymentMethod)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      setNewPaymentMethod({ name: "" });
      toast.success("Forma de pagamento cadastrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar forma de pagamento: " + error.message);
    },
  });

  const updatePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethod: any) => {
      const { data, error } = await supabase
        .from("payment_methods")
        .update({
          name: paymentMethod.name,
          updated_at: new Date().toISOString()
        })
        .eq("id", paymentMethod.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      setEditingPaymentMethod(null);
      setIsEditDialogOpen(false);
      toast.success("Forma de pagamento atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar forma de pagamento: " + error.message);
    },
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", paymentMethodId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast.success("Forma de pagamento excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir forma de pagamento: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaymentMethod.name) {
      toast.error("Preencha o nome da forma de pagamento");
      return;
    }
    createPaymentMethodMutation.mutate(newPaymentMethod);
  };

  const handleEdit = (paymentMethod: any) => {
    setEditingPaymentMethod(paymentMethod);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingPaymentMethod.name) {
      toast.error("Preencha o nome da forma de pagamento");
      return;
    }
    updatePaymentMethodMutation.mutate(editingPaymentMethod);
  };

  const handleDelete = (paymentMethodId: string) => {
    if (confirm("Tem certeza que deseja excluir esta forma de pagamento?")) {
      deletePaymentMethodMutation.mutate(paymentMethodId);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Formas de Pagamento
          </h1>
          <p className="text-gray-600 mt-2">Gerencie as formas de pagamento aceitas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Plus className="w-5 h-5" />
              Nova Forma de Pagamento
            </CardTitle>
            <CardDescription>
              Cadastre uma nova forma de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Nome
                </Label>
                <Input
                  placeholder="Ex: PIX, Cartão de Crédito..."
                  value={newPaymentMethod.name}
                  onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, name: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <Button 
                type="submit" 
                disabled={createPaymentMethodMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
              >
                {createPaymentMethodMutation.isPending ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-purple-700">Lista de Formas de Pagamento</CardTitle>
              <CardDescription>
                {paymentMethods?.length || 0} formas de pagamento cadastradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods?.map((paymentMethod) => (
                    <TableRow key={paymentMethod.id}>
                      <TableCell className="font-medium">{paymentMethod.name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          paymentMethod.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {paymentMethod.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(paymentMethod.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(paymentMethod)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(paymentMethod.id)}
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

      {/* Dialog para editar forma de pagamento */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Forma de Pagamento</DialogTitle>
            <DialogDescription>
              Altere o nome da forma de pagamento
            </DialogDescription>
          </DialogHeader>
          {editingPaymentMethod && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Nome
                </Label>
                <Input
                  placeholder="Ex: PIX, Cartão de Crédito..."
                  value={editingPaymentMethod.name}
                  onChange={(e) => setEditingPaymentMethod(prev => ({ ...prev, name: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpdate}
                  disabled={updatePaymentMethodMutation.isPending}
                  className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
                >
                  {updatePaymentMethodMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
