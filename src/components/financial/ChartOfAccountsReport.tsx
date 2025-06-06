
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Building, DollarSign } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

export default function ChartOfAccountsReport() {
  const { data: costCenters } = useQuery({
    queryKey: ["cost-centers-report"],
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

  const { data: expenseCategories } = useQuery({
    queryKey: ["expense-categories-report"],
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

  const { data: financialSummary } = useQuery({
    queryKey: ["financial-summary"],
    queryFn: async () => {
      const { data: entries, error } = await supabase
        .from("financial_entries")
        .select(`
          amount,
          entry_type,
          cost_centers(name),
          expense_categories(name)
        `);
      if (error) throw error;

      const totalIncome = entries
        ?.filter(entry => entry.entry_type === 'income')
        .reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

      const totalExpenses = entries
        ?.filter(entry => entry.entry_type === 'expense')
        .reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

      const expensesByCostCenter: { [key: string]: number } = {};
      const expensesByCategory: { [key: string]: number } = {};

      entries?.filter(entry => entry.entry_type === 'expense').forEach(entry => {
        const costCenter = (entry.cost_centers as any)?.name || "Sem centro de custo";
        const category = (entry.expense_categories as any)?.name || "Sem categoria";
        
        expensesByCostCenter[costCenter] = (expensesByCostCenter[costCenter] || 0) + Number(entry.amount);
        expensesByCategory[category] = (expensesByCategory[category] || 0) + Number(entry.amount);
      });

      return {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        expensesByCostCenter,
        expensesByCategory
      };
    },
  });

  const generatePDF = () => {
    if (!costCenters || !expenseCategories || !financialSummary) {
      toast.error("Dados não carregados completamente");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Título
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO COMPLETO DO PLANO DE CONTAS", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;

    // Data do relatório
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition);
    yPosition += 20;

    // Resumo Financeiro
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO FINANCEIRO", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de Receitas: R$ ${financialSummary.totalIncome.toFixed(2)}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Total de Despesas: R$ ${financialSummary.totalExpenses.toFixed(2)}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Saldo: R$ ${financialSummary.balance.toFixed(2)}`, 20, yPosition);
    yPosition += 20;

    // Centros de Custo
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("CENTROS DE CUSTO", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    costCenters.forEach((center, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      const spent = financialSummary.expensesByCostCenter[center.name] || 0;
      doc.text(`${index + 1}. ${center.name}`, 20, yPosition);
      doc.text(`Gasto: R$ ${spent.toFixed(2)}`, 120, yPosition);
      if (center.description) {
        yPosition += 7;
        doc.setFontSize(10);
        doc.text(`   ${center.description}`, 25, yPosition);
        doc.setFontSize(12);
      }
      yPosition += 10;
    });

    yPosition += 10;

    // Categorias de Despesa
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("CATEGORIAS DE DESPESA", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    expenseCategories.forEach((category, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      const spent = financialSummary.expensesByCategory[category.name] || 0;
      const costCenterName = (category.cost_centers as any)?.name || "Sem centro de custo";
      
      doc.text(`${index + 1}. ${category.name}`, 20, yPosition);
      doc.text(`Gasto: R$ ${spent.toFixed(2)}`, 120, yPosition);
      yPosition += 7;
      doc.setFontSize(10);
      doc.text(`   Centro de Custo: ${costCenterName}`, 25, yPosition);
      if (category.description) {
        yPosition += 5;
        doc.text(`   ${category.description}`, 25, yPosition);
      }
      doc.setFontSize(12);
      yPosition += 10;
    });

    // Rodapé
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 30, doc.internal.pageSize.height - 10);
      doc.text("AçaíPDV - Sistema de Gestão", 20, doc.internal.pageSize.height - 10);
    }

    doc.save(`plano-de-contas-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("Relatório gerado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <FileText className="w-5 h-5" />
            Relatório Completo do Plano de Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Centros de Custo</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{costCenters?.length || 0}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Categorias</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{expenseCategories?.length || 0}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Saldo Total</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                R$ {financialSummary?.balance?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          <Button 
            onClick={generatePDF}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Gerar Relatório Completo em PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
