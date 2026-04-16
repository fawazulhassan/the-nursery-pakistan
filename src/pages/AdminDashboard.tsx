import { useState, useEffect } from 'react';
import { Upload, Leaf, Package, AlertTriangle, Edit, Eye, EyeOff, Tag, ArrowUp, ArrowDown, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORIES } from '@/lib/constants';
import { MAX_PRODUCT_IMAGES, deleteProductImagesFromStorage, resolvePrimaryProductImage, resolveProductImageUrls, uploadProductImage, validateProductImageFile } from '@/lib/productImages';
import AdminLayout from '@/components/admin/AdminLayout';

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock_quantity: number;
  in_stock: boolean;
  image_url: string;
  image_urls?: string[] | null;
  category: string;
  plant_type?: string;
  sale_percentage?: number | null;
  sale_start_at?: string | null;
  sale_end_at?: string | null;
  sale_quantity_limit?: number | null;
  is_visible?: boolean;
}

interface DraftImage {
  id: string;
  source: 'existing' | 'file' | 'url';
  url: string;
  file?: File;
  error?: string | null;
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
  const [draftImages, setDraftImages] = useState<DraftImage[]>([]);
  const [manualImageUrlInput, setManualImageUrlInput] = useState('');
  const [imageFormError, setImageFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingStockProductId, setEditingStockProductId] = useState<string | null>(null);
  const [editStockQuantity, setEditStockQuantity] = useState('');
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, description, price, stock_quantity, in_stock, image_url, image_urls, category, plant_type, sale_percentage, sale_start_at, sale_end_at, sale_quantity_limit, is_visible')
      .order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const hasImageErrors = draftImages.some((item) => !!item.error);

  const addFilesToDraftImages = (files: File[]) => {
    if (!files.length) return;

    setDraftImages((prev) => {
      const next = [...prev];
      for (const file of files) {
        if (next.length >= MAX_PRODUCT_IMAGES) break;
        next.push({
          id: `${crypto.randomUUID()}-${Date.now()}`,
          source: 'file',
          file,
          url: URL.createObjectURL(file),
          error: validateProductImageFile(file),
        });
      }
      return next;
    });
  };

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    addFilesToDraftImages(files);
    e.target.value = '';
  };

  const handleAddManualImage = () => {
    const trimmed = manualImageUrlInput.trim();
    if (!trimmed) return;

    if (draftImages.length >= MAX_PRODUCT_IMAGES) {
      setImageFormError('Maximum 5 images allowed');
      return;
    }

    setDraftImages((prev) => [
      ...prev,
      {
        id: `${crypto.randomUUID()}-${Date.now()}`,
        source: 'url',
        url: trimmed,
        error: null,
      },
    ]);
    setManualImageUrlInput('');
    setImageFormError('');
  };

  const handleRemoveDraftImage = (id: string) => {
    setDraftImages((prev) => prev.filter((item) => item.id !== id));
    setImageFormError('');
  };

  const moveDraftImage = (index: number, direction: 'up' | 'down') => {
    setDraftImages((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
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
    setManualImageUrlInput('');
    setImageFormError('');
    setDraftImages(
      resolveProductImageUrls(product).map((url) => ({
        id: `${crypto.randomUUID()}-${Date.now()}`,
        source: 'existing' as const,
        url,
        error: null,
      }))
    );
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
    setDraftImages([]);
    setManualImageUrlInput('');
    setImageFormError('');
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

  const toProductSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = window.confirm(`Delete "${product.name}" permanently? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingProductId(product.id);
    try {
      const [{ count: orderItemCount, error: orderItemsError }, { count: reviewCount, error: reviewsError }] = await Promise.all([
        supabase
          .from('order_items')
          .select('id', { head: true, count: 'exact' })
          .eq('product_id', product.id),
        supabase
          .from('reviews')
          .select('id', { head: true, count: 'exact' })
          .in('product_slug', [product.id, toProductSlug(product.name)]),
      ]);

      if (orderItemsError) throw orderItemsError;
      if (reviewsError) throw reviewsError;

      if ((orderItemCount ?? 0) > 0 || (reviewCount ?? 0) > 0) {
        toast({
          title: 'Cannot delete product',
          description: 'Cannot delete product with existing orders or reviews.',
          variant: 'destructive',
        });
        return;
      }

      await deleteProductImagesFromStorage(product);

      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);

      if (deleteError) throw deleteError;

      if (editingProduct?.id === product.id) {
        cancelEdit();
      }

      toast({
        title: 'Product deleted',
        description: 'Product and its images were deleted successfully.',
      });
      fetchProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeletingProductId(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (draftImages.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one product image',
        variant: 'destructive',
      });
      return;
    }

    if (hasImageErrors) {
      setImageFormError('Fix image errors before saving.');
      return;
    }

    const isEditMode = !!editingProduct;
    setIsLoading(true);

    try {
      const uploadedImageUrls = await Promise.all(
        draftImages.map(async (item) => {
          if (item.source === 'file' && item.file) return uploadProductImage(item.file);
          return item.url;
        })
      );

      const primaryImage = uploadedImageUrls[0] ?? '';

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
          image_url: primaryImage,
          image_urls: uploadedImageUrls,
        };

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
          image_url: primaryImage,
          image_urls: uploadedImageUrls,
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

  return (
    <AdminLayout
      title="Admin Dashboard"
      icon={Leaf}
      contentClassName="max-w-4xl"
      desktopMenuMode="hamburger"
    >
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

            <div className="space-y-3">
              <Label htmlFor="images">Product Images *</Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFilesChange}
                className="cursor-pointer"
                disabled={draftImages.length >= MAX_PRODUCT_IMAGES}
              />

              <div className="flex gap-2">
                <Input
                  id="manualImage"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={manualImageUrlInput}
                  onChange={(e) => setManualImageUrlInput(e.target.value)}
                  disabled={draftImages.length >= MAX_PRODUCT_IMAGES}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddManualImage}
                  disabled={draftImages.length >= MAX_PRODUCT_IMAGES}
                >
                  Add Image
                </Button>
              </div>

              {draftImages.length >= MAX_PRODUCT_IMAGES && (
                <p className="text-sm text-muted-foreground">Maximum 5 images allowed</p>
              )}

              {imageFormError && (
                <p className="text-sm text-destructive">{imageFormError}</p>
              )}

              {draftImages.length > 0 && (
                <div className="space-y-2">
                  {draftImages.map((item, index) => (
                    <div key={item.id} className="flex gap-3 items-center border border-border rounded-md p-2">
                      <img
                        src={item.url}
                        alt={`Product preview ${index + 1}`}
                        className="w-16 h-16 rounded object-cover object-center border border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.url}</p>
                        {index === 0 && <p className="text-xs text-muted-foreground">Primary image</p>}
                        {item.error && <p className="text-xs text-destructive">{item.error}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => moveDraftImage(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => moveDraftImage(index, 'down')}
                          disabled={index === draftImages.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          onClick={() => handleRemoveDraftImage(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
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
                    <img src={resolvePrimaryProductImage(product)} alt={product.name} className="w-10 h-10 object-cover object-center rounded flex-shrink-0" />
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
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteProduct(product)}
                      disabled={deletingProductId === product.id}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {deletingProductId === product.id ? 'Deleting...' : 'Delete'}
                    </Button>
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
                        <img src={resolvePrimaryProductImage(product)} alt={product.name} className="w-10 h-10 object-cover object-center rounded" />
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
                        <img src={resolvePrimaryProductImage(product)} alt={product.name} className="w-10 h-10 object-cover object-center rounded" />
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
    </AdminLayout>
  );
};

export default AdminDashboard;
