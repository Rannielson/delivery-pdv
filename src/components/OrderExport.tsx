
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Eye } from "lucide-react";
import { format } from "date-fns";

interface OrderExportProps {
  order: any;
  customer: any;
  neighborhood: any;
  paymentMethod: any;
  orderItems: any[];
  products: any[];
}

export default function OrderExport({ 
  order, 
  customer, 
  neighborhood, 
  paymentMethod, 
  orderItems, 
  products 
}: OrderExportProps) {
  const exportRef = useRef<HTMLDivElement>(null);

  const exportAsImage = async () => {
    if (!exportRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(exportRef.current, {
        width: 1350,
        height: 1080,
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `pedido-${order.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Erro ao exportar:', error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
          <Eye className="w-4 h-4 mr-2" />
          Visualizar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Checkout do Pedido</DialogTitle>
          <DialogDescription>
            Visualize e exporte o pedido como imagem
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end mb-4">
          <Button onClick={exportAsImage} className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Exportar como Imagem
          </Button>
        </div>

        <div 
          ref={exportRef}
          className="bg-white p-8 rounded-lg shadow-lg"
          style={{ width: '1350px', height: '1080px', margin: '0 auto' }}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-2">
                Pedido Confirmado
              </h1>
              <p className="text-gray-600 text-xl">Obrigado pela sua compra!</p>
            </div>

            {/* Order Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Informações do Pedido</h2>
                <div className="space-y-2 text-lg">
                  <p><span className="font-medium">Pedido:</span> #{order.id.slice(0, 8)}</p>
                  <p><span className="font-medium">Data:</span> {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className="ml-2 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                      Pedido Aberto
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Dados do Cliente</h2>
                <div className="space-y-2 text-lg">
                  <p><span className="font-medium">Nome:</span> {customer?.name}</p>
                  <p><span className="font-medium">Telefone:</span> {customer?.phone}</p>
                  <p><span className="font-medium">Bairro:</span> {neighborhood?.name}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Itens do Pedido</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-4">
                  {orderItems?.map((item, index) => {
                    const product = products?.find(p => p.id === item.product_id);
                    return (
                      <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                        <div className="flex-1">
                          <h3 className="text-xl font-medium text-gray-800">{product?.name}</h3>
                          <p className="text-gray-600">Quantidade: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg text-gray-600">R$ {item.unit_price.toFixed(2)} cada</p>
                          <p className="text-xl font-semibold text-purple-600">R$ {item.total_price.toFixed(2)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-gray-200 pt-6">
              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="space-y-3 text-lg">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>R$ {(order.total_amount - order.delivery_fee).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Entrega:</span>
                    <span>R$ {order.delivery_fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Forma de Pagamento:</span>
                    <span>{paymentMethod?.name}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold text-purple-600 border-t border-purple-200 pt-3">
                    <span>Total:</span>
                    <span>R$ {order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-gray-500">
              <p className="text-lg">Aguarde a confirmação do seu pedido!</p>
              <p className="text-sm mt-2">Este é um comprovante automático do seu pedido.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
