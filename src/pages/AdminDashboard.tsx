import { useState, useEffect, useRef } from 'react';
import { Upload, Leaf, Package, AlertTriangle, Edit, Eye, EyeOff, Tag, ArrowUp, ArrowDown, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORIES } from '@/lib/constants';
import { MAX_PRODUCT_IMAGES, MAX_PRODUCT_IMAGE_BYTES, deleteProductImagesFromStorage, resolvePrimaryProductImage, resolveProductImageUrls, uploadProductImage, validateProductImageFile } from '@/lib/productImages';
import { deleteReviewsForProductBySlugCandidates } from '@/lib/reviews';
import AdminLayout from '@/components/admin/AdminLayout';
import { ProductImageCropDialog } from '@/components/admin/ProductImageCropDialog';

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

  const [cropFlowOpen, setCropFlowOpen] = useState(false);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropImageFile, setCropImageFile] = useState<File | null>(null);
  const [recropDraftId, setRecropDraftId] = useState<string | null>(null);
  const programmaticCropCloseRef = useRef(false);

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

  const handleCropFlowOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && programmaticCropCloseRef.current) {
      programmaticCropCloseRef.current = false;
      setCropFlowOpen(false);
      return;
    }
    setCropFlowOpen(nextOpen);
    if (!nextOpen) {
      setCropImageSrc((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return null;
      });
      setCropImageFile(null);
      setCropQueue([]);
      setRecropDraftId(null);
    }
  };

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const slots = MAX_PRODUCT_IMAGES - draftImages.length;
    if (slots <= 0 || files.length === 0) {
      e.target.value = '';
      return;
    }
    const batch = files.slice(0, slots);
    e.target.value = '';

    setRecropDraftId(null);
    setCropQueue(batch);
    setCropImageFile(batch[0] ?? null);
    setCropImageSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(batch[0]);
    });
    setCropFlowOpen(true);
  };

  const handleCropConfirmed = async (croppedFile: File) => {
    if (croppedFile.size > MAX_PRODUCT_IMAGE_BYTES) {
      toast({
        title: 'Error',
        description: 'Cropped image exceeds 5MB — try a smaller selection',
        variant: 'destructive',
      });
      return;
    }

    const validationErr = validateProductImageFile(croppedFile);
    if (validationErr) {
      toast({ title: 'Error', description: validationErr, variant: 'destructive' });
      return;
    }

    if (recropDraftId != null) {
      const previewUrl = URL.createObjectURL(croppedFile);
      setDraftImages((prev) =>
        prev.map((d) => {
          if (d.id !== recropDraftId) return d;
          if (d.url.startsWith('blob:')) URL.revokeObjectURL(d.url);
          return { ...d, source: 'file' as const, file: croppedFile, url: previewUrl, error: null };
        }),
      );
      setCropImageSrc((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return null;
      });
      setRecropDraftId(null);
      programmaticCropCloseRef.current = true;
      setCropFlowOpen(false);
      setCropQueue([]);
      return;
    }

    const newDraftUrl = URL.createObjectURL(croppedFile);
    setDraftImages((prev) => [
      ...prev,
      {
        id: `${crypto.randomUUID()}-${Date.now()}`,
        source: 'file',
        file: croppedFile,
        url: newDraftUrl,
        error: validateProductImageFile(croppedFile),
      },
    ]);

    const rest = cropQueue.slice(1);
    setCropQueue(rest);
    setCropImageFile(rest[0] ?? null);
    setCropImageSrc((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      if (rest.length === 0) return null;
      return URL.createObjectURL(rest[0]);
    });
    if (rest.length === 0) {
      programmaticCropCloseRef.current = true;
      setCropFlowOpen(false);
    }
  };

  const startRecropDraft = async (draft: DraftImage) => {
    if (cropFlowOpen) return;
    try {
      let sourceFile: File;
      let objectUrl: string;
      if (draft.source === 'file' && draft.file) {
        sourceFile = draft.file;
        objectUrl = URL.createObjectURL(draft.file);
      } else {
        const res = await fetch(draft.url, { mode: 'cors' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const urlPath = draft.url.split("?")[0] ?? "";
        const rawName = urlPath.split("/").pop() ?? "recrop-image";
        const cleanName = rawName.trim() || "recrop-image";
        sourceFile = new File([blob], cleanName, { type: blob.type || "image/jpeg" });
        objectUrl = URL.createObjectURL(blob);
      }
      setCropQueue([]);
      setCropImageFile(sourceFile);
      setRecropDraftId(draft.id);
      setCropImageSrc((prevUrl) => {
        if (prevUrl) URL.revokeObjectURL(prevUrl);
        return objectUrl;
      });
      setCropFlowOpen(true);
    } catch {
      toast({
        title: 'Cannot re-crop',
        description: 'Could not load this image for editing. Replace it with an upload instead.',
        variant: 'destructive',
      });
    }
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
    if (!window.confirm(`Delete "${product.name}" permanently? This action cannot be undone.`)) return;

    const [{ count: orderItemCount, error: orderItemsError }, { count: reviewCount, error: reviewsError }] =
      await Promise.all([
        supabase
          .from('order_items')
          .select('id', { head: true, count: 'exact' })
          .eq('product_id', product.id),
        supabase
          .from('reviews')
          .select('id', { head: true, count: 'exact' })
          .in('product_slug', [product.id, toProductSlug(product.name)]),
      ]);

    if (orderItemsError) {
      toast({ title: 'Error', description: orderItemsError.message, variant: 'destructive' });
      return;
    }
    if (reviewsError) {
      toast({ title: 'Error', description: reviewsError.message, variant: 'destructive' });
      return;
    }

    const orderLines = orderItemCount ?? 0;
    const reviewTotal = reviewCount ?? 0;

    if (orderLines + reviewTotal > 0) {
      const secondMessage =
        `"${product.name}" has ${orderLines} order line(s) and ${reviewTotal} review(s).\n\n` +
        'Deleting will remove those order line rows from the database, delete all matching reviews, and remove the product and its catalog images. This cannot be undone.\n\n' +
        'Continue with permanent delete?';
      if (!window.confirm(secondMessage)) return;
    }

    setDeletingProductId(product.id);
    let reviewsRemoved = false;
    let imagesRemoved = false;
    try {
      await deleteReviewsForProductBySlugCandidates(product.id, product.name);
      reviewsRemoved = true;

      await deleteProductImagesFromStorage(product);
      imagesRemoved = true;

      const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id);
      if (deleteError) throw deleteError;

      if (editingProduct?.id === product.id) {
        cancelEdit();
      }

      toast({
        title: 'Product deleted',
        description: 'Product, related reviews, images, and order line items were removed successfully.',
      });
      fetchProducts();
    } catch (error: any) {
      const baseMessage = error?.message ?? 'Unknown error';
      const lines = [
        baseMessage,
        '',
        reviewsRemoved
          ? 'Completed: matching reviews were removed.'
          : 'Not completed: matching reviews were not removed.',
        imagesRemoved
          ? 'Completed: product catalog images were removed from storage.'
          : 'Not completed: product catalog images were not removed from storage.',
        reviewsRemoved && imagesRemoved
          ? 'Not completed: the product database row may still exist. Order line items are only removed when that row is deleted.'
          : 'Not completed: the product database row was not removed; order line items are unchanged.',
      ];
      toast({
        title: 'Delete failed',
        description: lines.join('\n'),
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
                disabled={draftImages.length >= MAX_PRODUCT_IMAGES || cropFlowOpen}
              />

              <div className="flex gap-2">
                <Input
                  id="manualImage"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={manualImageUrlInput}
                  onChange={(e) => setManualImageUrlInput(e.target.value)}
                  disabled={draftImages.length >= MAX_PRODUCT_IMAGES || cropFlowOpen}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddManualImage}
                  disabled={draftImages.length >= MAX_PRODUCT_IMAGES || cropFlowOpen}
                >
                  Add Image
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Uploaded files are cropped here before saving. Images added by URL are not cropped (browser limitation).
              </p>

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
                          variant="outline"
                          size="sm"
                          className="h-9 px-2"
                          onClick={() => startRecropDraft(item)}
                          disabled={cropFlowOpen}
                          title="Square crop again"
                        >
                          Re-crop
                        </Button>
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

      <ProductImageCropDialog
        open={cropFlowOpen && !!cropImageSrc}
        onOpenChange={handleCropFlowOpenChange}
        imageSrc={cropImageSrc}
        imageFile={cropImageFile}
        displayLabel={
          recropDraftId != null ? 'Adjust square crop for this image' : cropQueue[0]?.name ?? 'Image'
        }
        onConfirm={handleCropConfirmed}
      />
    </AdminLayout>
  );
};

export default AdminDashboard;
