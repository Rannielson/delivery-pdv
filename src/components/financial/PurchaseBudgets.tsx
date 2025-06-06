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
import { Plus, Edit, Download, Trash2, ShoppingCart, Calculator } from "lucide-react";
import { toast } from "sonner";
import BudgetItemForm from "./BudgetItemForm";

export default function PurchaseBudgets() {
  const [budgetDialog, setBudgetDialog] = useState(false);
  const [itemDialog, setItemDialog] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  const queryClient = useQueryClient();

  // Buscar orçamentos
  const { data: budgets } = useQuery({
    queryKey: ["purchase-budgets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_budgets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Buscar itens do orçamento selecionado
  const { data: budgetItems } = useQuery({
    queryKey: ["budget-items", selectedBudget],
    queryFn: async () => {
      if (!selectedBudget) return [];
      const { data, error } = await supabase
        .from("purchase_budget_items")
        .select(`
          *,
          items(name, category)
        `)
        .eq("budget_id", selectedBudget)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBudget,
  });

  // Buscar itens disponíveis
  const { data: availableItems } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Mutations
  const createBudgetMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; budget_date: string }) => {
      const { data: budget, error } = await supabase
        .from("purchase_budgets")
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return budget;
    },
    onSuccess: (budget) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-budgets"] });
      setBudgetDialog(false);
      setEditingBudget(null);
      setSelectedBudget(budget.id);
      toast.success("Orçamento criado com sucesso!");
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from("purchase_budgets")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-budgets"] });
      setBudgetDialog(false);
      setEditingBudget(null);
      toast.success("Orçamento atualizado com sucesso!");
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("purchase_budgets")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-budgets"] });
      if (selectedBudget) {
        setSelectedBudget(null);
      }
      toast.success("Orçamento excluído com sucesso!");
    },
  });

  const updateBudgetStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("purchase_budgets")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-budgets"] });
      toast.success("Status atualizado com sucesso!");
    },
  });

  // Nova mutation para deletar item
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("purchase_budget_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-items", selectedBudget] });
      queryClient.invalidateQueries({ queryKey: ["purchase-budgets"] });
      toast.success("Item removido com sucesso!");
    },
  });

  // Nova mutation para atualizar item
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { error } = await supabase
        .from("purchase_budget_items")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-items", selectedBudget] });
      queryClient.invalidateQueries({ queryKey: ["purchase-budgets"] });
      setEditingItem(null);
      toast.success("Item atualizado com sucesso!");
    },
  });

  const handleBudgetSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      budget_date: formData.get("budget_date") as string,
    };

    if (editingBudget) {
      updateBudgetMutation.mutate({ id: editingBudget.id, ...data });
    } else {
      createBudgetMutation.mutate(data);
    }
  };

  const handleItemEdit = (item: any) => {
    setEditingItem(item);
    setItemDialog(true);
  };

  const handleItemDelete = (itemId: string) => {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      deleteItemMutation.mutate(itemId);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedBudget || !budgetItems) return;

    const budget = budgets?.find(b => b.id === selectedBudget);
    if (!budget) return;

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Header
      doc.setFontSize(20);
      doc.text('Orçamento de Compras', 20, 30);
      
      doc.setFontSize(12);
      doc.text(`Nome: ${budget.name}`, 20, 50);
      doc.text(`Data: ${new Date(budget.budget_date).toLocaleDateString('pt-BR')}`, 20, 60);
      if (budget.description) {
        doc.text(`Descrição: ${budget.description}`, 20, 70);
      }

      // Items table
      let yPosition = 90;
      doc.setFontSize(14);
      doc.text('Itens:', 20, yPosition);
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.text('Descrição', 20, yPosition);
      doc.text('Qtd', 120, yPosition);
      doc.text('Valor Unit.', 140, yPosition);
      doc.text('Subtotal', 170, yPosition);
      
      yPosition += 5;
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;

      budgetItems.forEach((item) => {
        doc.text(item.description.substring(0, 50), 20, yPosition);
        doc.text(item.quantity.toString(), 120, yPosition);
        doc.text(`R$ ${Number(item.unit_price).toFixed(2)}`, 140, yPosition);
        doc.text(`R$ ${Number(item.subtotal).toFixed(2)}`, 170, yPosition);
        yPosition += 10;

        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
      });

      // Total
      yPosition += 10;
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
      doc.setFontSize(12);
      doc.text(`Total: R$ ${Number(budget.total_amount).toFixed(2)}`, 140, yPosition);

      doc.save(`orcamento-${budget.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar PDF: " + error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'executed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Rascunho';
      case 'approved': return 'Aprovado';
      case 'executed': return 'Executado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with improved styling */}
      <div className="flex justify-between items-center bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-xl">
        <div className="flex gap-4">
          <Dialog open={budgetDialog} onOpenChange={(open) => {
            setBudgetDialog(open);
            if (!open) {
              setEditingBudget(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Orçamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-purple-800">
                  {editingBudget ? "Editar" : "Novo"} Orçamento
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleBudgetSubmit} className="space-y-4">
                <Input
                  name="name"
                  placeholder="Nome do orçamento"
                  defaultValue={editingBudget?.name}
                  required
                />
                <Textarea
                  name="description"
                  placeholder="Descrição (opcional)"
                  defaultValue={editingBudget?.description}
                />
                <Input
                  name="budget_date"
                  type="date"
                  defaultValue={editingBudget?.budget_date || new Date().toISOString().split('T')[0]}
                  required
                />
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                  {editingBudget ? "Atualizar" : "Criar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {selectedBudget && (
            <>
              <Dialog open={itemDialog} onOpenChange={(open) => {
                setItemDialog(open);
                if (!open) {
                  setEditingItem(null);
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                    <Plus className="w-4 h-4 mr-2" />
                    {editingItem ? "Editar Item" : "Adicionar Item"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-purple-800">
                      {editingItem ? "Editar" : "Adicionar"} Item ao Orçamento
                    </DialogTitle>
                  </DialogHeader>
                  <BudgetItemForm
                    budgetId={selectedBudget}
                    availableItems={availableItems || []}
                    editingItem={editingItem}
                    onSuccess={() => {
                      setItemDialog(false);
                      setEditingItem(null);
                      queryClient.invalidateQueries({ queryKey: ["budget-items", selectedBudget] });
                      queryClient.invalidateQueries({ queryKey: ["purchase-budgets"] });
                    }}
                  />
                </DialogContent>
              </Dialog>

              <Button onClick={handleExportPDF} variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de orçamentos com melhor visual */}
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <ShoppingCart className="w-5 h-5" />
              Orçamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {budgets?.map((budget) => (
                <div
                  key={budget.id}
                  className={`p-4 border rounded-xl cursor-pointer transition-all hover:shadow-md ${
                    selectedBudget === budget.id 
                      ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-violet-50 shadow-md' 
                      : 'border-gray-200 hover:border-purple-200 bg-white'
                  }`}
                  onClick={() => setSelectedBudget(budget.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{budget.name}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(budget.budget_date).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-sm font-semibold text-purple-600">
                        R$ {Number(budget.total_amount).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={getStatusColor(budget.status)}>
                        {getStatusLabel(budget.status)}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-purple-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBudget(budget);
                            setBudgetDialog(true);
                          }}
                        >
                          <Edit className="w-3 h-3 text-purple-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Tem certeza que deseja excluir este orçamento?")) {
                              deleteBudgetMutation.mutate(budget.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detalhes do orçamento com melhor organização */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Calculator className="w-5 h-5" />
              {selectedBudget ? "Detalhes do Orçamento" : "Selecione um Orçamento"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {selectedBudget && budgetItems ? (
              <div className="space-y-6">
                {/* Ações do orçamento com melhor visual */}
                <div className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                  {budgets?.find(b => b.id === selectedBudget)?.status === 'draft' && (
                    <Button 
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => updateBudgetStatusMutation.mutate({ 
                        id: selectedBudget, 
                        status: 'approved' 
                      })}
                    >
                      Aprovar
                    </Button>
                  )}
                  {budgets?.find(b => b.id === selectedBudget)?.status === 'approved' && (
                    <Button 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateBudgetStatusMutation.mutate({ 
                        id: selectedBudget, 
                        status: 'executed' 
                      })}
                    >
                      Marcar como Executado
                    </Button>
                  )}
                  <Button 
                    size="sm"
                    variant="destructive"
                    onClick={() => updateBudgetStatusMutation.mutate({ 
                      id: selectedBudget, 
                      status: 'cancelled' 
                    })}
                  >
                    Cancelar
                  </Button>
                </div>

                {/* Tabela de itens melhorada */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Descrição</TableHead>
                        <TableHead className="text-center font-semibold">Qtd</TableHead>
                        <TableHead className="text-right font-semibold">Valor Unit.</TableHead>
                        <TableHead className="text-right font-semibold">Subtotal</TableHead>
                        <TableHead className="w-24 text-center font-semibold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budgetItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{item.description}</p>
                              {item.items && (
                                <p className="text-sm text-gray-500">
                                  {item.items.category} - {item.items.name}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-xs text-gray-400 mt-1">{item.notes}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {Number(item.quantity)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            R$ {Number(item.unit_price).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            R$ {Number(item.subtotal).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-blue-100"
                                onClick={() => handleItemEdit(item)}
                              >
                                <Edit className="w-3 h-3 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-red-100"
                                onClick={() => handleItemDelete(item.id)}
                              >
                                <Trash2 className="w-3 h-3 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Total com melhor destaque */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-green-700 font-medium">Total do Orçamento</p>
                      <p className="text-xs text-green-600">
                        {budgetItems.length} {budgetItems.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-700">
                        R$ {Number(budgets?.find(b => b.id === selectedBudget)?.total_amount || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-16">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Selecione um orçamento</p>
                <p className="text-sm">Escolha um orçamento da lista para ver os detalhes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
