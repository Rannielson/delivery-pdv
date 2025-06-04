
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Item {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface ProductItem {
  itemId: string;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  items: ProductItem[];
  finalPrice: number;
}

const Products = () => {
  const { toast } = useToast();
  
  // Dados simulados dos itens cadastrados
  const availableItems: Item[] = [
    { id: "1", name: "Açaí base", price: 8.00, category: "Base" },
    { id: "2", name: "Granola", price: 2.50, category: "Complemento" },
    { id: "3", name: "Banana", price: 1.50, category: "Fruta" },
    { id: "4", name: "Leite condensado", price: 2.00, category: "Complemento" },
    { id: "5", name: "Morango", price: 3.00, category: "Fruta" },
    { id: "6", name: "Paçoca", price: 2.50, category: "Complemento" },
  ];

  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Açaí Tradicional 300ml",
      description: "Açaí com granola e banana",
      items: [
        { itemId: "1", quantity: 1 },
        { itemId: "2", quantity: 1 },
        { itemId: "3", quantity: 1 },
      ],
      finalPrice: 18.00,
    },
  ]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    finalPrice: "",
  });

  const [selectedItems, setSelectedItems] = useState<ProductItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const calculateItemsTotal = () => {
    return selectedItems.reduce((total, productItem) => {
      const item = availableItems.find(i => i.id === productItem.itemId);
      return total + (item ? item.price * productItem.quantity : 0);
    }, 0);
  };

  const handleItemToggle = (itemId: string) => {
    const exists = selectedItems.find(si => si.itemId === itemId);
    if (exists) {
      setSelectedItems(selectedItems.filter(si => si.itemId !== itemId));
    } else {
      setSelectedItems([...selectedItems, { itemId, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedItems(selectedItems.filter(si => si.itemId !== itemId));
    } else {
      setSelectedItems(selectedItems.map(si => 
        si.itemId === itemId ? { ...si, quantity } : si
      ));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.finalPrice || selectedItems.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos e selecione pelo menos um item",
        variant: "destructive",
      });
      return;
    }

    const newProduct: Product = {
      id: editingId || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      items: selectedItems,
      finalPrice: parseFloat(formData.finalPrice),
    };

    if (editingId) {
      setProducts(products.map(product => product.id === editingId ? newProduct : product));
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso!",
      });
      setEditingId(null);
    } else {
      setProducts([...products, newProduct]);
      toast({
        title: "Sucesso",
        description: "Produto cadastrado com sucesso!",
      });
    }

    setFormData({ name: "", description: "", finalPrice: "" });
    setSelectedItems([]);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      finalPrice: product.finalPrice.toString(),
    });
    setSelectedItems(product.items);
    setEditingId(product.id);
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter(product => product.id !== id));
    toast({
      title: "Sucesso",
      description: "Produto removido com sucesso!",
    });
  };

  const getItemName = (itemId: string) => {
    return availableItems.find(item => item.id === itemId)?.name || "Item não encontrado";
  };

  const getItemPrice = (itemId: string) => {
    return availableItems.find(item => item.id === itemId)?.price || 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight bg-acai-gradient bg-clip-text text-transparent">
          Cadastro de Produtos
        </h2>
        <p className="text-muted-foreground">
          Monte seus produtos combinando os itens cadastrados
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Cadastro */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-acai-500" />
              {editingId ? "Editar Produto" : "Novo Produto"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Produto</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Açaí Tradicional 300ml"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descrição do produto"
                />
              </div>

              <div>
                <Label>Itens do Produto</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {availableItems.map((item) => {
                    const selectedItem = selectedItems.find(si => si.itemId === item.id);
                    const isSelected = !!selectedItem;
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between p-2 rounded bg-slate-50">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={item.id}
                            checked={isSelected}
                            onCheckedChange={() => handleItemToggle(item.id)}
                          />
                          <div>
                            <label htmlFor={item.id} className="text-sm font-medium cursor-pointer">
                              {item.name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              R$ {item.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <Input
                            type="number"
                            min="1"
                            value={selectedItem?.quantity || 1}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 h-8"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {selectedItems.length > 0 && (
                  <div className="mt-2 p-2 bg-acai-50 rounded-md">
                    <p className="text-sm font-medium text-acai-800">
                      Custo dos itens: R$ {calculateItemsTotal().toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="finalPrice">Preço Final (R$)</Label>
                <Input
                  id="finalPrice"
                  type="number"
                  step="0.01"
                  value={formData.finalPrice}
                  onChange={(e) => setFormData({ ...formData, finalPrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-acai-gradient hover:opacity-90">
                  {editingId ? "Atualizar" : "Cadastrar"}
                </Button>
                {editingId && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ name: "", description: "", finalPrice: "" });
                      setSelectedItems([]);
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Produtos */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-acai-500" />
                Produtos Cadastrados ({products.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {products.map((product) => (
                  <div 
                    key={product.id} 
                    className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <p className="text-muted-foreground text-sm mb-2">{product.description}</p>
                        <p className="text-xl font-bold text-fresh-600">
                          R$ {product.finalPrice.toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                          className="hover:bg-acai-100 hover:text-acai-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                          className="hover:bg-red-100 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Itens inclusos:</p>
                      <div className="flex flex-wrap gap-2">
                        {product.items.map((productItem) => (
                          <Badge key={productItem.itemId} variant="secondary" className="text-xs">
                            {productItem.quantity}x {getItemName(productItem.itemId)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                
                {products.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum produto cadastrado ainda
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Products;
