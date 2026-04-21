import { useCallback, useEffect, useState } from "react";
import { BriefcaseBusiness, Edit, Trash2, Upload, X } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  createCompletedProject,
  deleteCompletedProject,
  getCompletedProjects,
  getNextCompletedProjectOrder,
  updateCompletedProject,
  uploadLandscapingMedia,
  type CompletedProjectRow,
} from "@/lib/landscapingProjects";

const MAX_GALLERY_IMAGES = 6;
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi"];

const isVideoUrl = (url: string): boolean => {
  const normalized = url.split("?")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((extension) => normalized.endsWith(extension));
};

const AdminLandscapingProjectsPage = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<CompletedProjectRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const [editingProject, setEditingProject] = useState<CompletedProjectRow | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
  const [displayOrder, setDisplayOrder] = useState("1");

  const isGalleryAtLimit = galleryImageUrls.length >= MAX_GALLERY_IMAGES;

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getCompletedProjects();
      setProjects(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Failed to load projects", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const setupNewFormOrder = async () => {
    try {
      const nextOrder = await getNextCompletedProjectOrder();
      setDisplayOrder(String(nextOrder));
    } catch {
      setDisplayOrder("1");
    }
  };

  useEffect(() => {
    loadProjects();
    setupNewFormOrder();
  }, [loadProjects]);

  const resetForm = () => {
    setEditingProject(null);
    setTitle("");
    setDescription("");
    setCoverImageUrl("");
    setGalleryImageUrls([]);
    setupNewFormOrder();
  };

  const handleEdit = (project: CompletedProjectRow) => {
    setEditingProject(project);
    setTitle(project.title ?? "");
    setDescription(project.description ?? "");
    setCoverImageUrl(project.cover_image_url ?? "");
    setGalleryImageUrls((project.gallery_image_urls as string[] | null) ?? []);
    setDisplayOrder(String(project.display_order ?? 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCoverUpload = async (file: File) => {
    setIsUploadingCover(true);
    try {
      const imageUrl = await uploadLandscapingMedia(file);
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
      toast({ title: "Uploading media...", description: "Please wait while your files upload." });
      const uploaded = await Promise.all(allowed.map((file) => uploadLandscapingMedia(file)));
      setGalleryImageUrls((prev) => [...prev, ...uploaded]);
      toast({ title: "Gallery updated", description: "Media uploaded successfully." });
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

    setIsSaving(true);
    try {
      const payload = {
        title,
        description,
        cover_image_url: coverImageUrl,
        gallery_image_urls: galleryImageUrls,
        display_order: Number.parseInt(displayOrder, 10) || 1,
      };

      if (editingProject) {
        await updateCompletedProject(editingProject.id, payload);
        toast({ title: "Project updated", description: "Changes saved successfully." });
      } else {
        await createCompletedProject(payload);
        toast({ title: "Project created", description: "Project added successfully." });
      }

      resetForm();
      await loadProjects();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (project: CompletedProjectRow) => {
    const confirmed = window.confirm(`Delete "${project.title}" permanently?`);
    if (!confirmed) return;
    try {
      await deleteCompletedProject(project.id);
      toast({ title: "Project deleted", description: "Project removed successfully." });
      if (editingProject?.id === project.id) {
        resetForm();
      }
      await loadProjects();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout title="Landscaping Projects" icon={BriefcaseBusiness} desktopMenuMode="hamburger">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingProject ? "Edit Project" : "Add Project"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
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
              <Label htmlFor="projectSlug">Project Slug</Label>
              <Input
                id="projectSlug"
                value={editingProject?.slug ?? "Generated on create"}
                readOnly
                className="bg-muted/40"
              />
              <p className="text-xs text-muted-foreground">
                Slug is read-only after creation to avoid breaking project URLs.
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
                <img src={coverImageUrl} alt="Cover preview" className="w-40 h-28 rounded-md border object-cover" />
              ) : null}
            </div>

            <div className="space-y-3">
              <Label>Gallery Images (Max 6)</Label>
              <Input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => {
                  handleGalleryUpload(e.target.files);
                  e.target.value = "";
                }}
                disabled={isUploadingGallery || isGalleryAtLimit}
              />
              <p className="text-xs text-muted-foreground">
                Accepted: JPG, PNG, MP4, WebM · Images up to 5 MB · Videos up to 50 MB
              </p>
              {isGalleryAtLimit ? <p className="text-sm text-muted-foreground">Maximum 6 media files allowed</p> : null}
              {galleryImageUrls.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {galleryImageUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative">
                      {isVideoUrl(url) ? (
                        <video
                          src={url}
                          controls
                          muted
                          playsInline
                          aria-label={`Gallery video ${index + 1}`}
                          className="w-full h-24 rounded-md border object-cover bg-black"
                        />
                      ) : (
                        <img
                          src={url}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-24 rounded-md border object-cover"
                        />
                      )}
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
                {isSaving ? "Saving..." : editingProject ? "Update Project" : "Create Project"}
              </Button>
              {editingProject ? (
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
          <CardTitle>Existing Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : projects.length === 0 ? (
            <p className="text-muted-foreground">No projects yet.</p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div key={project.id} className="border rounded-lg p-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={project.cover_image_url}
                      alt={project.title}
                      className="w-16 h-12 rounded object-cover border"
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{project.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Order: {project.display_order} • Gallery: {((project.gallery_image_urls as string[] | null) ?? []).length}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">/{project.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(project)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(project)}>
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

export default AdminLandscapingProjectsPage;
