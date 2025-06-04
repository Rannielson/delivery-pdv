import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Package, DollarSign, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ProductItem {
  item_id: string;
  quantity: number;
}

export default function Products() {
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    items: [] as ProductItem[]
  });
  const [selectedItem, setSelectedItem] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);

  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_items(
            quantity,
            items(name, price)
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("items").select("*");
      if (error) throw error;
      return data;
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (product: any) => {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .insert({
          name: product.name,
          description: product.description,
          price: parseFloat(product.price)
        })
        .select()
        .single();

      if (productError) throw productError;

      if (product.items.length > 0) {
        const { error: itemsError } = await supabase
          .from("product_items")
          .insert(
            product.items.map((item: ProductItem) => ({
              product_id: productData.id,
              item_id: item.item_id,
              quantity: item.quantity
            }))
          );

        if (itemsError) throw itemsError;
      }

      return productData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setNewProduct({ name: "", description: "", price: "", items: [] });
      setSelectedItem("");
      setItemQuantity(1);
      toast.success("Produto cadastrado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar produto: " + error.message);
    },
  });

  const addItemToProduct = () => {
    if (!selectedItem) return;
    
    const productItem: ProductItem = {
      item_id: selectedItem,
      quantity: itemQuantity
    };

    setNewProduct(prev => ({
      ...prev,
      items: [...prev.items, productItem]
    }));

    setSelectedItem("");
    setItemQuantity(1);
  };

  const removeItemFromProduct = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createProductMutation.mutate(newProduct);
  };

  const calculateItemsCost = () => {
    return newProduct.items.reduce((total, productItem) => {
      const item = items?.find(i => i.id === productItem.item_id);
      return total + (item ? item.price * productItem.quantity : 0);
    }, 0);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            Produtos
          </h1>
          <p className="text-gray-600 mt-2">Monte produtos combinando itens cadastrados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Plus className="w-5 h-5" />
              Novo Produto
            </CardTitle>
            <CardDescription>
              Crie um produto combinando itens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Nome do Produto
                </Label>
                <Input
                  placeholder="Ex: Açaí Tradicional 300ml"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Descrição
                </Label>
                <Textarea
                  placeholder="Descrição do produto..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Preço de Venda (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-purple-700 mb-3">Adicionar Itens</h3>
                <div className="space-y-3">
                  <Select value={selectedItem} onValueChange={setSelectedItem}>
                    <SelectTrigger className="border-purple-200 focus:border-purple-400">
                      <SelectValue placeholder="Selecione um item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items?.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - R$ {item.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-20 border-purple-200 focus:border-purple-400"
                      placeholder="Qtd"
                    />
                    <Button 
                      type="button" 
                      onClick={addItemToProduct}
                      variant="outline"
                      className="border-purple-200 text-purple-600 hover:bg-purple-50"
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>

              {newProduct.items.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-purple-700 mb-3">Itens do Produto</h3>
                  <div className="space-y-2">
                    {newProduct.items.map((productItem, index) => {
                      const item = items?.find(i => i.id === productItem.item_id);
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                          <div className="text-sm">
                            <span className="font-medium">{item?.name}</span>
                            <span className="text-gray-600 ml-2">x{productItem.quantity}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemFromProduct(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            ×
                          </Button>
                        </div>
                      );
                    })}
                    <div className="text-xs text-gray-600 pt-2 border-t">
                      Custo dos itens: R$ {calculateItemsCost().toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={createProductMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700"
              >
                {createProductMutation.isPending ? "Cadastrando..." : "Cadastrar Produto"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-purple-700">Lista de Produtos</CardTitle>
              <CardDescription>
                {products?.length || 0} produtos cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-600">{product.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-purple-600">
                        R$ {product.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {(product as any).product_items?.length || 0} itens
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(product.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
