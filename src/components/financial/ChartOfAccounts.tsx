
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, DollarSign, Building, Tag } from "lucide-react";
import { toast } from "sonner";
import FinancialEntryForm from "./FinancialEntryForm";

export default function ChartOfAccounts() {
  const [costCenterDialog, setCostCenterDialog] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [entryDialog, setEntryDialog] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  const queryClient = useQueryClient();

  // Buscar centros de custo
  const { data: costCenters } = useQuery({
    queryKey: ["cost-centers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_centers")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Buscar categorias de despesas
  const { data: categories } = useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select(`
          *,
          cost_centers(name)
        `)
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Buscar lançamentos financeiros
  const { data: entries } = useQuery({
    queryKey: ["financial-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_entries")
        .select(`
          *,
          expense_categories(name),
          cost_centers(name)
        `)
        .order("entry_date", { ascending: false })
        .order("entry_time", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  // Mutations
  const createCostCenterMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { error } = await supabase.from("cost_centers").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] });
      setCostCenterDialog(false);
      setEditingCostCenter(null);
      toast.success("Centro de custo criado com sucesso!");
    },
  });

  const updateCostCenterMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; description?: string }) => {
      const { error } = await supabase
        .from("cost_centers")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] });
      setCostCenterDialog(false);
      setEditingCostCenter(null);
      toast.success("Centro de custo atualizado com sucesso!");
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; cost_center_id?: string }) => {
      const { error } = await supabase.from("expense_categories").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      setCategoryDialog(false);
      setEditingCategory(null);
      toast.success("Categoria criada com sucesso!");
    },
  });

  const handleCostCenterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
    };

    if (editingCostCenter) {
      updateCostCenterMutation.mutate({ id: editingCostCenter.id, ...data });
    } else {
      createCostCenterMutation.mutate(data);
    }
  };

  const handleCategorySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      cost_center_id: formData.get("cost_center_id") as string || undefined,
    };

    createCategoryMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-lg">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Centros de Custo</p>
                <p className="text-2xl font-bold text-blue-700">{costCenters?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500 rounded-lg">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Categorias</p>
                <p className="text-2xl font-bold text-purple-700">{categories?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lançamentos Hoje</p>
                <p className="text-2xl font-bold text-green-700">
                  {entries?.filter(e => e.entry_date === new Date().toISOString().split('T')[0]).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações principais */}
      <div className="flex gap-4">
        <Dialog open={costCenterDialog} onOpenChange={setCostCenterDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Centro de Custo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCostCenter ? "Editar" : "Novo"} Centro de Custo
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCostCenterSubmit} className="space-y-4">
              <Input
                name="name"
                placeholder="Nome do centro de custo"
                defaultValue={editingCostCenter?.name}
                required
              />
              <Textarea
                name="description"
                placeholder="Descrição (opcional)"
                defaultValue={editingCostCenter?.description}
              />
              <Button type="submit" className="w-full">
                {editingCostCenter ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Categoria de Despesa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Categoria de Despesa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <Input name="name" placeholder="Nome da categoria" required />
              <Textarea name="description" placeholder="Descrição (opcional)" />
              <Select name="cost_center_id">
                <SelectTrigger>
                  <SelectValue placeholder="Centro de custo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {costCenters?.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" className="w-full">Criar</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={entryDialog} onOpenChange={setEntryDialog}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <DollarSign className="w-4 h-4 mr-2" />
              Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Lançamento Financeiro</DialogTitle>
            </DialogHeader>
            <FinancialEntryForm
              costCenters={costCenters || []}
              categories={categories || []}
              onSuccess={() => {
                setEntryDialog(false);
                queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Centros de Custo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costCenters?.map((center) => (
                  <TableRow key={center.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{center.name}</p>
                        {center.description && (
                          <p className="text-sm text-gray-500">{center.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCostCenter(center);
                          setCostCenterDialog(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Categorias de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-gray-500">{category.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(category as any).cost_centers?.name && (
                        <Badge variant="outline">
                          {(category as any).cost_centers.name}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Últimos lançamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Últimos Lançamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries?.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="text-sm">
                      <p>{new Date(entry.entry_date).toLocaleDateString('pt-BR')}</p>
                      <p className="text-gray-500">{entry.entry_time}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{entry.description}</p>
                    {entry.notes && (
                      <p className="text-sm text-gray-500">{entry.notes}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={entry.entry_type === 'income' ? 'default' : 'destructive'}>
                      {entry.entry_type === 'income' ? 'Receita' : 'Despesa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(entry as any).expense_categories?.name && (
                      <Badge variant="outline">
                        {(entry as any).expense_categories.name}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={entry.entry_type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {entry.entry_type === 'income' ? '+' : '-'}R$ {entry.amount.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
