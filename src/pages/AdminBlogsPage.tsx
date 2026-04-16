import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpenText, ImagePlus, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  BLOG_CATEGORIES,
  createBlog,
  deleteBlog,
  generateBlogSlug,
  getAdminBlogs,
  getHomepageBlogCount,
  setBlogPublished,
  setHomepageBlogCount,
  updateBlog,
  uploadBlogImage,
  type BlogCategory,
  type BlogPublishStatus,
  type BlogRow,
} from "@/lib/blogs";

const RichEditorToolbar = ({
  onInsertImage,
  onSetLink,
}: {
  onInsertImage: () => void;
  onSetLink: () => void;
}) => (
  <div className="flex flex-wrap items-center gap-2 border rounded-md p-2 mb-2">
    <Button type="button" size="sm" variant="outline" onClick={onSetLink}>
      Link
    </Button>
    <Button type="button" size="sm" variant="outline" onClick={onInsertImage}>
      <ImagePlus className="h-4 w-4 mr-1" />
      Image
    </Button>
  </div>
);

const AdminBlogsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const featuredImageInputRef = useRef<HTMLInputElement | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [homepageCount, setHomepageCount] = useState(6);
  const [filters, setFilters] = useState<{
    status: BlogPublishStatus;
    category: string;
    search: string;
  }>({
    status: "all",
    category: "all",
    search: "",
  });

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    category: BLOG_CATEGORIES[0] as BlogCategory,
    author_name: "Admin",
    featured_image_url: "",
    show_on_homepage: true,
    display_order: "",
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        allowBase64: false,
      }),
    ],
    content: "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] border rounded-md px-3 py-2 prose prose-sm max-w-none focus:outline-none",
      },
    },
  });

  const resetForm = () => {
    setEditingBlogId(null);
    setForm({
      title: "",
      slug: "",
      excerpt: "",
      category: BLOG_CATEGORIES[0],
      author_name: "Admin",
      featured_image_url: "",
      show_on_homepage: true,
      display_order: "",
    });
    editor?.commands.setContent("<p></p>");
  };

  const fetchBlogs = useCallback(async () => {
    setIsLoadingBlogs(true);
    try {
      const rows = await getAdminBlogs({
        status: filters.status,
        category: filters.category === "all" ? undefined : filters.category,
        search: filters.search.trim() || undefined,
      });
      setBlogs(rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load blogs.";
      toast({ title: "Failed to load blogs", description: message, variant: "destructive" });
    } finally {
      setIsLoadingBlogs(false);
    }
  }, [filters, toast]);

  const fetchHomepageCount = useCallback(async () => {
    try {
      const count = await getHomepageBlogCount();
      setHomepageCount(count);
    } catch {
      // fallback is fine
      setHomepageCount(6);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  useEffect(() => {
    fetchHomepageCount();
  }, [fetchHomepageCount]);

  const handleInsertImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    setIsUploadingImage(true);
    try {
      const url = await uploadBlogImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      toast({ title: "Image uploaded", description: "Image inserted into the blog content." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload image.";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleFeaturedImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const url = await uploadBlogImage(file);
      setForm((prev) => ({ ...prev, featured_image_url: url }));
      toast({ title: "Featured image uploaded" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload featured image.";
      toast({ title: "Upload failed", description: message, variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSetLink = () => {
    if (!editor) return;
    const existing = editor.getAttributes("link").href as string | undefined;
    const nextUrl = window.prompt("Enter URL", existing ?? "");
    if (nextUrl === null) return;

    if (!nextUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: nextUrl }).run();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;

    const contentHtml = editor.getHTML();
    if (!contentHtml || contentHtml === "<p></p>") {
      toast({ title: "Content required", description: "Please write the blog body.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug || generateBlogSlug(form.title),
        excerpt: form.excerpt,
        content_html: contentHtml,
        category: form.category,
        author_name: form.author_name || "Admin",
        featured_image_url: form.featured_image_url || null,
        show_on_homepage: form.show_on_homepage,
        display_order: form.display_order ? Number.parseInt(form.display_order, 10) : null,
      };

      if (editingBlogId) {
        await updateBlog(editingBlogId, payload);
        toast({ title: "Blog updated", description: "Changes have been saved." });
      } else {
        await createBlog(payload);
        toast({ title: "Blog created", description: "Blog draft has been created." });
      }

      await fetchBlogs();
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save blog.";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (blog: BlogRow) => {
    setEditingBlogId(blog.id);
    setForm({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      category: blog.category as BlogCategory,
      author_name: blog.author_name ?? "Admin",
      featured_image_url: blog.featured_image_url ?? "",
      show_on_homepage: blog.show_on_homepage,
      display_order: blog.display_order?.toString() ?? "",
    });
    editor?.commands.setContent(blog.content_html || "<p></p>");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTogglePublish = async (blog: BlogRow, checked: boolean) => {
    try {
      await setBlogPublished(blog.id, checked);
      await fetchBlogs();
      toast({ title: checked ? "Blog published" : "Blog moved to draft" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update status.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteBlog(deleteTargetId);
      setDeleteTargetId(null);
      await fetchBlogs();
      if (editingBlogId === deleteTargetId) {
        resetForm();
      }
      toast({ title: "Blog deleted" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete blog.";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    }
  };

  const handleHomepageCountSave = async () => {
    try {
      await setHomepageBlogCount(homepageCount);
      toast({ title: "Homepage setting saved" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save homepage count.";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    }
  };

  const filteredCountLabel = useMemo(
    () => `${blogs.length} blog${blogs.length === 1 ? "" : "s"}`,
    [blogs.length]
  );

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpenText className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Blog Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate("/admin")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-6 grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{editingBlogId ? "Edit Blog" : "Create Blog"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSave}>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="blog-title">Title</Label>
                  <Input
                    id="blog-title"
                    value={form.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        title,
                        slug: prev.slug || generateBlogSlug(title),
                      }));
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-slug">Slug (manual override)</Label>
                  <Input
                    id="blog-slug"
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="auto-generated from title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-category">Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, category: value as BlogCategory }))}
                  >
                    <SelectTrigger id="blog-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOG_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-author">Author name (optional)</Label>
                  <Input
                    id="blog-author"
                    value={form.author_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, author_name: e.target.value }))}
                    placeholder="Admin"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-featured">Featured image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="blog-featured"
                      value={form.featured_image_url}
                      onChange={(e) => setForm((prev) => ({ ...prev, featured_image_url: e.target.value }))}
                      placeholder="https://..."
                    />
                    <Button type="button" variant="outline" onClick={() => featuredImageInputRef.current?.click()}>
                      Upload
                    </Button>
                  </div>
                  <input
                    ref={featuredImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFeaturedImageUpload}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blog-display-order">Display order (optional)</Label>
                  <Input
                    id="blog-display-order"
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm((prev) => ({ ...prev, display_order: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="blog-excerpt">Excerpt</Label>
                <Textarea
                  id="blog-excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Content</Label>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {isUploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
                    Upload inline image
                  </div>
                </div>
                <RichEditorToolbar
                  onInsertImage={() => imageInputRef.current?.click()}
                  onSetLink={handleSetLink}
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleInsertImage}
                />
                <div className="rounded-md">
                  <EditorContent editor={editor} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.show_on_homepage}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, show_on_homepage: checked }))}
                />
                <span className="text-sm text-muted-foreground">Show on homepage when published</span>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : editingBlogId ? (
                    <Save className="h-4 w-4 mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {editingBlogId ? "Update Blog" : "Create Blog"}
                </Button>
                {editingBlogId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Homepage Blog Count</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              value={homepageCount}
              onChange={(e) => setHomepageCount(Number.parseInt(e.target.value || "1", 10))}
              className="max-w-32"
            />
            <Button type="button" onClick={handleHomepageCountSave}>
              Save
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Blogs ({filteredCountLabel})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value as BlogPublishStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {BLOG_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Search title, excerpt, author..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
            </div>

            {isLoadingBlogs ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No blogs found.</div>
            ) : (
              <div className="space-y-3">
                {blogs.map((blog) => (
                  <div
                    key={blog.id}
                    className="rounded-md border px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{blog.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {blog.category} · {blog.is_published ? "Published" : "Draft"} · by {blog.author_name || "Admin"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Published</span>
                        <Switch
                          checked={blog.is_published}
                          onCheckedChange={(checked) => handleTogglePublish(blog, checked)}
                        />
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => startEdit(blog)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTargetId(blog.id)}
                      >
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
      </main>

      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete blog post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action permanently deletes the selected blog post. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed}>Delete permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBlogsPage;
