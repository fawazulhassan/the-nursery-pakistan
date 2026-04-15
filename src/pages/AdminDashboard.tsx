import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Leaf, Users, Package, AlertTriangle, Edit, Eye, EyeOff, Tag, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORIES } from '@/lib/constants';

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
  in_stock: boolean;
  image_url: string;
  category: string;
  plant_type?: string;
  sale_percentage?: number | null;
  sale_start_at?: string | null;
  sale_end_at?: string | null;
  sale_quantity_limit?: number | null;
  is_visible?: boolean;
}

const AdminDashboard = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [plantType, setPlantType] = useState('');
  const [salePercentage, setSalePercentage] = useState('');
  const [saleStartAt, setSaleStartAt] = useState('');
  const [saleEndAt, setSaleEndAt] = useState('');
  const [saleQuantityLimit, setSaleQuantityLimit] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingStockProductId, setEditingStockProductId] = useState<string | null>(null);
  const [editStockQuantity, setEditStockQuantity] = useState('');
  const [manualImageUrl, setManualImageUrl] = useState('');
  
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, description, price, stock_quantity, in_stock, image_url, category, plant_type, sale_percentage, sale_start_at, sale_end_at, sale_quantity_limit, is_visible')
      .order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setDescription(product.description || '');
    setCategory(product.category);
    setPlantType(product.plant_type || '');
    setSalePercentage(product.sale_percentage?.toString() || '');
    setSaleStartAt(product.sale_start_at ? product.sale_start_at.slice(0, 16) : '');
    setSaleEndAt(product.sale_end_at ? product.sale_end_at.slice(0, 16) : '');
    setSaleQuantityLimit(product.sale_quantity_limit?.toString() || '');
    setStockQuantity(product.stock_quantity.toString());
    setImageFile(null);
    setImagePreview(product.image_url || '');
    setManualImageUrl(product.image_url || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setName('');
    setPrice('');
    setDescription('');
    setCategory('');
    setPlantType('');
    setSalePercentage('');
    setSaleStartAt('');
    setSaleEndAt('');
    setSaleQuantityLimit('');
    setStockQuantity('10');
    setImageFile(null);
    setImagePreview('');
    setManualImageUrl('');
  };

  const handleEndSale = async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .update({
        sale_percentage: null,
        sale_start_at: null,
        sale_end_at: null,
        sale_quantity_limit: null,
      })
      .eq('id', productId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sale ended', description: 'Product is no longer on sale.' });
      fetchProducts();
    }
  };

  const handleToggleVisibility = async (productId: string, currentVisible: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_visible: !currentVisible })
      .eq('id', productId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: currentVisible ? 'Product hidden' : 'Product visible',
        description: currentVisible ? 'Product is hidden from the storefront.' : 'Product is now visible.',
      });
      fetchProducts();
    }
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
      setEditingStockProductId(null);
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
    
    const isEditMode = !!editingProduct;
    if (!isEditMode && !imageFile && !manualImageUrl) {
      toast({
        title: 'Error',
        description: 'Please select an image or enter an image URL',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = editingProduct?.image_url;
      
      if (manualImageUrl) {
        imageUrl = manualImageUrl;
      }

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      const stockQty = parseInt(stockQuantity) || 0;
      const salePct = salePercentage ? parseFloat(salePercentage) : null;

      if (isEditMode && editingProduct) {
        const updateData: Record<string, unknown> = {
          name,
          price: parseFloat(price),
          description,
          category,
          plant_type: plantType || "N/A",
          in_stock: stockQty > 0,
          stock_quantity: stockQty,
          sale_percentage: salePct,
          sale_start_at: saleStartAt ? new Date(saleStartAt).toISOString() : null,
          sale_end_at: saleEndAt ? new Date(saleEndAt).toISOString() : null,
          sale_quantity_limit: saleQuantityLimit ? parseInt(saleQuantityLimit, 10) : null,
        };
        if (imageUrl) updateData.image_url = imageUrl;

        const { error } = await supabase.from('products').update(updateData).eq('id', editingProduct.id);
        if (error) throw error;
        toast({ title: 'Success!', description: 'Product has been updated.' });
      } else {
        const { error } = await supabase.from('products').insert({
          name,
          price: parseFloat(price),
          description,
          category,
          plant_type: plantType || "N/A",
          image_url: imageUrl,
          in_stock: stockQty > 0,
          stock_quantity: stockQty,
          sale_percentage: salePct,
          sale_start_at: saleStartAt ? new Date(saleStartAt).toISOString() : null,
          sale_end_at: saleEndAt ? new Date(saleEndAt).toISOString() : null,
          sale_quantity_limit: saleQuantityLimit ? parseInt(saleQuantityLimit, 10) : null,
        });
        if (error) throw error;
        toast({ title: 'Success!', description: 'Product has been added successfully.' });
      }

      cancelEdit();
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
              onClick={() => navigate('/admin/reviews')}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Manage Reviews
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Upload className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            </div>
            {editingProduct && (
              <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
            )}
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
                <Select
                  value={category}
                  onValueChange={(val) => {
                    setCategory(val);
                    if (val === "Fertilizers & Soil" || val === "Pots & Accessories") {
                      setPlantType("N/A");
                    }
                  }}
                  required
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.slug} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plantType">
                  Plant Type {(category === "Fertilizers & Soil" || category === "Pots & Accessories") ? "(Optional)" : "*"}
                </Label>
                <Select
                  value={plantType}
                  onValueChange={(val) => {
                    setPlantType(val);
                  }}
                  required={category !== "Fertilizers & Soil" && category !== "Pots & Accessories"}
                >
                  <SelectTrigger id="plantType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Indoor">Indoor</SelectItem>
                    <SelectItem value="Outdoor">Outdoor</SelectItem>
                    <SelectItem value="N/A">N/A</SelectItem>
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

              {salePercentage && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="saleStartAt">Sale Start (Optional)</Label>
                    <Input
                      id="saleStartAt"
                      type="datetime-local"
                      value={saleStartAt}
                      onChange={(e) => setSaleStartAt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saleEndAt">Sale End (Optional)</Label>
                    <Input
                      id="saleEndAt"
                      type="datetime-local"
                      value={saleEndAt}
                      onChange={(e) => setSaleEndAt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saleQuantityLimit">Max items at sale price per order (Optional)</Label>
                    <Input
                      id="saleQuantityLimit"
                      type="number"
                      min="1"
                      placeholder="e.g., 3"
                      value={saleQuantityLimit}
                      onChange={(e) => setSaleQuantityLimit(e.target.value)}
                    />
                  </div>
                </>
              )}

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
              <Label htmlFor="image">Product Image {editingProduct ? '(Optional - keep current)' : '*'}</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required={!editingProduct && !manualImageUrl}
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
              <Label htmlFor="manualImage">Or Image URL</Label>
              <Input
                id="manualImage"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={manualImageUrl}
                onChange={(e) => {
                  setManualImageUrl(e.target.value);
                  if (!imageFile) {
                    setImagePreview(e.target.value);
                  }
                }}
              />
              <p className="text-sm text-muted-foreground">Useful if you want to reuse an image from another product.</p>
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
              {isLoading ? (editingProduct ? 'Updating...' : 'Adding Product...') : (editingProduct ? 'Update Product' : 'Add Product')}
            </Button>
          </form>
        </div>

        {/* All Products - Manage visibility, End Sale */}
        <div className="bg-card rounded-lg shadow-lg p-8 mt-8">
          <div className="flex items-center gap-3 mb-6">
            <Package className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">All Products</h2>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {products.map((product) => {
              const isVisible = product.is_visible !== false;
              const isOnSale = product.sale_percentage != null && product.sale_percentage > 0;
              return (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${!isVisible ? 'bg-muted/50 border-muted' : 'border-border'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.category} {!isVisible && '(Hidden)'} {isOnSale && `• ${product.sale_percentage}% OFF`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditProduct(product)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleVisibility(product.id, isVisible)}
                      title={isVisible ? 'Hide from store' : 'Show on store'}
                    >
                      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {isVisible ? 'Hide' : 'Show'}
                    </Button>
                    {isOnSale && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleEndSale(product.id)}
                      >
                        <Tag className="h-4 w-4 mr-1" />
                        End Sale
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
                        {editingStockProductId === product.id ? (
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
                            setEditingStockProductId(product.id);
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
                        {editingStockProductId === product.id ? (
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
                            setEditingStockProductId(product.id);
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
