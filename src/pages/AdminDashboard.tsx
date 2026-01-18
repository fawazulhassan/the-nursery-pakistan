import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Leaf, Users, Package, AlertTriangle, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  in_stock: boolean;
  image_url: string;
  category: string;
}

const AdminDashboard = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [plantType, setPlantType] = useState('');
  const [salePercentage, setSalePercentage] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editStockQuantity, setEditStockQuantity] = useState('');
  
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, stock_quantity, in_stock, image_url, category')
      .order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const lowStockProducts = products.filter(p => p.stock_quantity < 5 && p.stock_quantity > 0);
  const outOfStockProducts = products.filter(p => p.stock_quantity === 0);

  const handleUpdateStock = async (productId: string, newQuantity: number) => {
    if (newQuantity < 0) {
      toast({
        title: 'Error',
        description: 'Stock quantity cannot be negative',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('products')
      .update({ 
        stock_quantity: newQuantity,
        in_stock: newQuantity > 0
      })
      .eq('id', productId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Stock updated successfully',
      });
      fetchProducts();
      setEditingProduct(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      toast({
        title: 'Error',
        description: 'Please select an image',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Upload image to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const stockQty = parseInt(stockQuantity) || 0;
      
      // Insert product with image URL
      const { error } = await supabase.from('products').insert({
        name,
        price: parseFloat(price),
        description,
        category,
        plant_type: plantType,
        image_url: publicUrl,
        in_stock: stockQty > 0,
        stock_quantity: stockQty,
        sale_percentage: salePercentage ? parseFloat(salePercentage) : null,
      });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Product has been added successfully.',
      });

      // Reset form
      setName('');
      setPrice('');
      setDescription('');
      setCategory('');
      setPlantType('');
      setSalePercentage('');
      setStockQuantity('10');
      setImageFile(null);
      setImagePreview('');
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Leaf className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => navigate('/admin/orders')}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              View Orders
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/admin/users')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Manage Users
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-card rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Upload className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Add New Product</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Monstera Deliciosa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (PKR) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 1500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Indoor Plants">Indoor Plants</SelectItem>
                    <SelectItem value="Outdoor Plants">Outdoor Plants</SelectItem>
                    <SelectItem value="Pots & Accessories">Pots & Accessories</SelectItem>
                    <SelectItem value="Fertilizers & Soil">Fertilizers & Soil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plantType">Plant Type *</Label>
                <Select value={plantType} onValueChange={setPlantType} required>
                  <SelectTrigger id="plantType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Indoor">Indoor</SelectItem>
                    <SelectItem value="Outdoor">Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salePercentage">Sale Percentage (Optional)</Label>
                <Input
                  id="salePercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="e.g., 20 for 20% off"
                  value={salePercentage}
                  onChange={(e) => setSalePercentage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g., 10"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Product Image *</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
                className="cursor-pointer"
              />
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg border border-border"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Enter product description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Adding Product...' : 'Add Product'}
            </Button>
          </form>
        </div>

        {/* Inventory Warnings Section */}
        {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
          <div className="bg-card rounded-lg shadow-lg p-8 mt-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">Inventory Alerts</h2>
            </div>

            {outOfStockProducts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-destructive mb-3">Out of Stock ({outOfStockProducts.length})</h3>
                <div className="space-y-2">
                  {outOfStockProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <div className="flex items-center gap-3">
                        <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">Stock: 0</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingProduct?.id === product.id ? (
                          <>
                            <Input
                              type="number"
                              min="0"
                              className="w-20"
                              value={editStockQuantity}
                              onChange={(e) => setEditStockQuantity(e.target.value)}
                            />
                            <Button size="sm" onClick={() => handleUpdateStock(product.id, parseInt(editStockQuantity) || 0)}>
                              Save
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingProduct(product);
                            setEditStockQuantity(product.stock_quantity.toString());
                          }}>
                            <Edit className="h-4 w-4 mr-1" />
                            Restock
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lowStockProducts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-yellow-600 mb-3">Low Stock ({lowStockProducts.length})</h3>
                <div className="space-y-2">
                  {lowStockProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <div className="flex items-center gap-3">
                        <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-yellow-600">Stock: {product.stock_quantity}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingProduct?.id === product.id ? (
                          <>
                            <Input
                              type="number"
                              min="0"
                              className="w-20"
                              value={editStockQuantity}
                              onChange={(e) => setEditStockQuantity(e.target.value)}
                            />
                            <Button size="sm" onClick={() => handleUpdateStock(product.id, parseInt(editStockQuantity) || 0)}>
                              Save
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingProduct(product);
                            setEditStockQuantity(product.stock_quantity.toString());
                          }}>
                            <Edit className="h-4 w-4 mr-1" />
                            Update Stock
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
