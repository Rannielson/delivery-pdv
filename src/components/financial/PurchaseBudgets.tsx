
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

  const handleExportPDF = async () => {
    if (!selectedBudget || !budgetItems) return;

    const budget = budgets?.find(b => b.id === selectedBudget);
    if (!budget) return;

    try {
      // Dinamically import jsPDF
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Dialog open={budgetDialog} onOpenChange={setBudgetDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Orçamento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
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
                <Button type="submit" className="w-full">
                  {editingBudget ? "Atualizar" : "Criar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {selectedBudget && (
            <>
              <Dialog open={itemDialog} onOpenChange={setItemDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Item ao Orçamento</DialogTitle>
                  </DialogHeader>
                  <BudgetItemForm
                    budgetId={selectedBudget}
                    availableItems={availableItems || []}
                    onSuccess={() => {
                      setItemDialog(false);
                      queryClient.invalidateQueries({ queryKey: ["budget-items", selectedBudget] });
                      queryClient.invalidateQueries({ queryKey: ["purchase-budgets"] });
                    }}
                  />
                </DialogContent>
              </Dialog>

              <Button onClick={handleExportPDF} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de orçamentos */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Orçamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budgets?.map((budget) => (
                <div
                  key={budget.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedBudget === budget.id 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedBudget(budget.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{budget.name}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(budget.budget_date).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-sm font-semibold text-green-600">
                        R$ {Number(budget.total_amount).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={getStatusColor(budget.status)}>
                        {getStatusLabel(budget.status)}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingBudget(budget);
                            setBudgetDialog(true);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Tem certeza que deseja excluir este orçamento?")) {
                              deleteBudgetMutation.mutate(budget.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detalhes do orçamento */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              {selectedBudget ? "Detalhes do Orçamento" : "Selecione um Orçamento"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedBudget && budgetItems ? (
              <div className="space-y-4">
                {/* Ações do orçamento */}
                <div className="flex gap-2">
                  {budgets?.find(b => b.id === selectedBudget)?.status === 'draft' && (
                    <Button 
                      size="sm"
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

                {/* Tabela de itens */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.description}</p>
                            {item.items && (
                              <p className="text-sm text-gray-500">
                                {item.items.category} - {item.items.name}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-xs text-gray-400">{item.notes}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {Number(item.quantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {Number(item.unit_price).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          R$ {Number(item.subtotal).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // Implementar exclusão de item
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        Total: R$ {Number(budgets?.find(b => b.id === selectedBudget)?.total_amount || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                Selecione um orçamento para ver os detalhes
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
