import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Edit, Trash2, Upload, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createWorkshop,
  deleteWorkshop,
  getAdminWorkshops,
  getNextWorkshopOrder,
  updateWorkshop,
  uploadWorkshopImage,
  type WorkshopRow,
} from "@/lib/workshops";

const MAX_GALLERY_IMAGES = 6;

const formatLocalDateTime = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

const toIsoDateTime = (localDateTime: string) => new Date(localDateTime).toISOString();

const AdminWorkshopsPage = () => {
  const { toast } = useToast();
  const [workshops, setWorkshops] = useState<WorkshopRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const [editingWorkshop, setEditingWorkshop] = useState<WorkshopRow | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workshopDate, setWorkshopDate] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
  const [displayOrder, setDisplayOrder] = useState("1");
  const [isActive, setIsActive] = useState(true);

  const isGalleryAtLimit = galleryImageUrls.length >= MAX_GALLERY_IMAGES;

  const loadWorkshops = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminWorkshops();
      setWorkshops(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Failed to load workshops", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const setupNewFormOrder = async () => {
    try {
      const nextOrder = await getNextWorkshopOrder();
      setDisplayOrder(String(nextOrder));
    } catch {
      setDisplayOrder("1");
    }
  };

  useEffect(() => {
    loadWorkshops();
    setupNewFormOrder();
  }, [loadWorkshops]);

  const resetForm = () => {
    setEditingWorkshop(null);
    setTitle("");
    setDescription("");
    setWorkshopDate("");
    setCoverImageUrl("");
    setGalleryImageUrls([]);
    setIsActive(true);
    setupNewFormOrder();
  };

  const handleEdit = (workshop: WorkshopRow) => {
    setEditingWorkshop(workshop);
    setTitle(workshop.title ?? "");
    setDescription(workshop.description ?? "");
    setWorkshopDate(formatLocalDateTime(workshop.workshop_date));
    setCoverImageUrl(workshop.cover_image_url ?? "");
    setGalleryImageUrls((workshop.gallery_image_urls as string[] | null) ?? []);
    setDisplayOrder(String(workshop.display_order ?? 1));
    setIsActive(workshop.is_active ?? true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCoverUpload = async (file: File) => {
    setIsUploadingCover(true);
    try {
      const imageUrl = await uploadWorkshopImage(file);
      setCoverImageUrl(imageUrl);
      toast({ title: "Cover uploaded", description: "Image uploaded successfully." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (galleryImageUrls.length >= MAX_GALLERY_IMAGES) return;

    const allowed = Array.from(files).slice(0, MAX_GALLERY_IMAGES - galleryImageUrls.length);
    setIsUploadingGallery(true);
    try {
      const uploaded = await Promise.all(allowed.map((file) => uploadWorkshopImage(file)));
      setGalleryImageUrls((prev) => [...prev, ...uploaded]);
      toast({ title: "Gallery updated", description: "Images uploaded successfully." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!coverImageUrl) {
      toast({ title: "Cover image required", description: "Upload a cover image first.", variant: "destructive" });
      return;
    }
    if (!workshopDate) {
      toast({ title: "Date required", description: "Select a workshop date first.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        description,
        workshop_date: toIsoDateTime(workshopDate),
        cover_image_url: coverImageUrl,
        gallery_image_urls: galleryImageUrls,
        display_order: Number.parseInt(displayOrder, 10) || 1,
        is_active: isActive,
      };

      if (editingWorkshop) {
        await updateWorkshop(editingWorkshop.id, payload);
        toast({ title: "Workshop updated", description: "Changes saved successfully." });
      } else {
        await createWorkshop(payload);
        toast({ title: "Workshop created", description: "Workshop added successfully." });
      }

      resetForm();
      await loadWorkshops();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (workshop: WorkshopRow) => {
    const confirmed = window.confirm(`Delete "${workshop.title}" permanently?`);
    if (!confirmed) return;
    try {
      await deleteWorkshop(workshop.id);
      toast({ title: "Workshop deleted", description: "Workshop removed successfully." });
      if (editingWorkshop?.id === workshop.id) {
        resetForm();
      }
      await loadWorkshops();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout title="Workshops" icon={CalendarDays} desktopMenuMode="hamburger">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingWorkshop ? "Edit Workshop" : "Add Workshop"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Workshop Title *</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order *</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="1"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workshopDate">Workshop Date *</Label>
              <Input
                id="workshopDate"
                type="datetime-local"
                value={workshopDate}
                onChange={(e) => setWorkshopDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workshopSlug">Workshop Slug</Label>
              <Input
                id="workshopSlug"
                value={editingWorkshop?.slug ?? "Generated on create"}
                readOnly
                className="bg-muted/40"
              />
              <p className="text-xs text-muted-foreground">
                Slug is read-only after creation to avoid breaking workshop URLs.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="isActive">Workshop active</Label>
                <p className="text-xs text-muted-foreground">Only active workshops appear on public pages.</p>
              </div>
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="space-y-3">
              <Label>Cover Image *</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCoverUpload(file);
                  e.target.value = "";
                }}
                disabled={isUploadingCover}
              />
              {coverImageUrl ? (
                <img
                  src={coverImageUrl}
                  alt="Cover preview"
                  className="w-40 h-28 rounded-md border object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>

            <div className="space-y-3">
              <Label>Previous Workshop Images (Max 6)</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  handleGalleryUpload(e.target.files);
                  e.target.value = "";
                }}
                disabled={isUploadingGallery || isGalleryAtLimit}
              />
              {isGalleryAtLimit ? <p className="text-sm text-muted-foreground">Maximum 6 images allowed</p> : null}
              {galleryImageUrls.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {galleryImageUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative">
                      <img
                        src={url}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-24 rounded-md border object-cover"
                        loading="lazy"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => handleRemoveGalleryImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSaving || isUploadingCover || isUploadingGallery}>
                <Upload className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : editingWorkshop ? "Update Workshop" : "Create Workshop"}
              </Button>
              {editingWorkshop ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel Edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Workshops</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : workshops.length === 0 ? (
            <p className="text-muted-foreground">No workshops yet.</p>
          ) : (
            <div className="space-y-3">
              {workshops.map((workshop) => (
                <div key={workshop.id} className="border rounded-lg p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={workshop.cover_image_url}
                      alt={workshop.title}
                      className="w-16 h-12 rounded object-cover border"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{workshop.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Order: {workshop.display_order} • Active: {workshop.is_active ? "Yes" : "No"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">/{workshop.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(workshop)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(workshop)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminWorkshopsPage;
