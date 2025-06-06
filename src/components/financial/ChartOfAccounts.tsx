import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Plus, Edit, Trash, FileText } from "lucide-react";
import { toast } from "sonner";
import ChartOfAccountsReport from "./ChartOfAccountsReport";

export default function ChartOfAccounts() {
  const [costCenterForm, setCostCenterForm] = useState({
    name: "",
    description: ""
  });
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    cost_center_id: ""
  });

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
  const { data: expenseCategories } = useQuery({
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

  // Mutations
  const createCostCenterMutation = useMutation({
    mutationFn: async (data: typeof costCenterForm) => {
      const { error } = await supabase
        .from("cost_centers")
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-centers"] });
      setCostCenterForm({ name: "", description: "" });
      toast.success("Centro de custo criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar centro de custo: " + error.message);
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryForm) => {
      const { error } = await supabase
        .from("expense_categories")
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      setCategoryForm({ name: "", description: "", cost_center_id: "" });
      toast.success("Categoria de despesa criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar categoria: " + error.message);
    },
  });

  const handleCostCenterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!costCenterForm.name.trim()) {
      toast.error("Nome do centro de custo é obrigatório");
      return;
    }
    createCostCenterMutation.mutate(costCenterForm);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("Nome da categoria é obrigatório");
      return;
    }
    createCategoryMutation.mutate(categoryForm);
  };

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="cost-centers">Centros de Custo</TabsTrigger>
        <TabsTrigger value="categories">Categorias</TabsTrigger>
        <TabsTrigger value="report">Relatório</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Centros de Custo ({costCenters?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {costCenters?.slice(0, 5).map((center) => (
                  <div key={center.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{center.name}</p>
                    {center.description && (
                      <p className="text-sm text-gray-600">{center.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Categorias de Despesa ({expenseCategories?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expenseCategories?.slice(0, 5).map((category) => (
                  <div key={category.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-blue-600">
                      {(category.cost_centers as any)?.name || "Sem centro de custo"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="cost-centers" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Centro de Custo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCostCenterSubmit} className="space-y-4">
              <Input
                placeholder="Nome do centro de custo"
                value={costCenterForm.name}
                onChange={(e) => setCostCenterForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={costCenterForm.description}
                onChange={(e) => setCostCenterForm(prev => ({ ...prev, description: e.target.value }))}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={createCostCenterMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                {createCostCenterMutation.isPending ? "Criando..." : "Criar Centro de Custo"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Centros de Custo Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {costCenters?.map((center) => (
                <div key={center.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{center.name}</p>
                    {center.description && (
                      <p className="text-sm text-gray-600">{center.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="categories" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Categoria de Despesa</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <Input
                placeholder="Nome da categoria"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
              <Select 
                value={categoryForm.cost_center_id} 
                onValueChange={(value) => setCategoryForm(prev => ({ ...prev, cost_center_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um centro de custo" />
                </SelectTrigger>
                <SelectContent>
                  {costCenters?.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Descrição (opcional)"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={createCategoryMutation.isPending}
              >
                <Plus className="w-4 h-4 mr-2" />
                {createCategoryMutation.isPending ? "Criando..." : "Criar Categoria"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorias Cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenseCategories?.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-blue-600">
                      {(category.cost_centers as any)?.name || "Sem centro de custo"}
                    </p>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="report" className="space-y-6">
        <ChartOfAccountsReport />
      </TabsContent>
    </Tabs>
  );
}
