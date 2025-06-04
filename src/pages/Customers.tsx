
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
import { Plus, Users, Phone, MapPin, Calendar, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Customers() {
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    neighborhood_id: ""
  });
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select(`
          *,
          neighborhoods(name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: neighborhoods } = useQuery({
    queryKey: ["neighborhoods"],
    queryFn: async () => {
      const { data, error } = await supabase.from("neighborhoods").select("*");
      if (error) throw error;
      return data;
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (customer: typeof newCustomer) => {
      const { data, error } = await supabase
        .from("customers")
        .insert(customer)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setNewCustomer({ name: "", phone: "", neighborhood_id: "" });
      toast.success("Cliente cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar cliente: " + error.message);
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async (customer: any) => {
      const { data, error } = await supabase
        .from("customers")
        .update({
          name: customer.name,
          phone: customer.phone,
          neighborhood_id: customer.neighborhood_id,
          updated_at: new Date().toISOString()
        })
        .eq("id", customer.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setEditingCustomer(null);
      setIsEditDialogOpen(false);
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar cliente: " + error.message);
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir cliente: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createCustomerMutation.mutate(newCustomer);
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingCustomer.name || !editingCustomer.phone) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    updateCustomerMutation.mutate(editingCustomer);
  };

  const handleDelete = (customerId: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Clientes
          </h1>
          <p className="text-gray-600 mt-2">Gerencie seus clientes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Plus className="w-5 h-5" />
              Novo Cliente
            </CardTitle>
            <CardDescription>
              Cadastre um novo cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Nome *
                </Label>
                <Input
                  placeholder="Nome do cliente"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone *
                </Label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Bairro
                </Label>
                <Select value={newCustomer.neighborhood_id} onValueChange={(value) => setNewCustomer(prev => ({ ...prev, neighborhood_id: value }))}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-400">
                    <SelectValue placeholder="Selecione o bairro" />
                  </SelectTrigger>
                  <SelectContent>
                    {neighborhoods?.map((neighborhood) => (
                      <SelectItem key={neighborhood.id} value={neighborhood.id}>
                        {neighborhood.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                disabled={createCustomerMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
              >
                {createCustomerMutation.isPending ? "Cadastrando..." : "Cadastrar Cliente"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-purple-700">Lista de Clientes</CardTitle>
              <CardDescription>
                {customers?.length || 0} clientes cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Bairro</TableHead>
                    <TableHead>Último Pedido</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers?.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{(customer as any).neighborhoods?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {customer.last_order_date ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(customer.last_order_date).toLocaleDateString('pt-BR')}
                          </div>
                        ) : (
                          <span className="text-gray-400">Nenhum pedido</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(customer)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(customer.id)}
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

      {/* Dialog para editar cliente */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Altere as informações do cliente
            </DialogDescription>
          </DialogHeader>
          {editingCustomer && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Nome *
                </Label>
                <Input
                  placeholder="Nome do cliente"
                  value={editingCustomer.name}
                  onChange={(e) => setEditingCustomer(prev => ({ ...prev, name: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone *
                </Label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Bairro
                </Label>
                <Select 
                  value={editingCustomer.neighborhood_id || ""} 
                  onValueChange={(value) => setEditingCustomer(prev => ({ ...prev, neighborhood_id: value }))}
                >
                  <SelectTrigger className="border-purple-200 focus:border-purple-400">
                    <SelectValue placeholder="Selecione o bairro" />
                  </SelectTrigger>
                  <SelectContent>
                    {neighborhoods?.map((neighborhood) => (
                      <SelectItem key={neighborhood.id} value={neighborhood.id}>
                        {neighborhood.name}
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
                  disabled={updateCustomerMutation.isPending}
                  className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
                >
                  {updateCustomerMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
