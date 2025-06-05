
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";

interface BulkActionsHeaderProps {
  selectedOrders: string[];
  onBulkFinalize: () => void;
  isLoading: boolean;
}

export function BulkActionsHeader({ 
  selectedOrders, 
  onBulkFinalize, 
  isLoading 
}: BulkActionsHeaderProps) {
  if (selectedOrders.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">
        {selectedOrders.length} pedido(s) selecionado(s)
      </span>
      <Button 
        onClick={onBulkFinalize}
        variant="outline"
        className="flex items-center gap-2"
        disabled={isLoading}
      >
        <Archive className="w-4 h-4" />
        Finalizar Selecionados
      </Button>
    </div>
  );
}
