import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Tag, Search } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DataTable } from "@/components/DataTable";
import { trpc } from "@/lib/trpc";

type CategoryForm = {
  name: string;
  description: string;
  color: string;
  icon: string;
};

const emptyForm: CategoryForm = {
  name: "",
  description: "",
  color: "#6366f1",
  icon: "tag",
};

export default function Categories() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: categories, isLoading } = trpc.categories.list.useQuery();
  const utils = trpc.useUtils();

  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Category created");
      setDialogOpen(false);
      utils.categories.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateCategory = trpc.categories.update.useMutation({
    onSuccess: () => {
      toast.success("Category updated");
      setDialogOpen(false);
      utils.categories.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteCategory = trpc.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("Category deleted");
      setDeleteId(null);
      utils.categories.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setForm({
      name: c.name,
      description: c.description ?? "",
      color: c.color ?? "#6366f1",
      icon: c.icon ?? "tag",
    });
    setEditId(c.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name) {
      toast.error("Category name is required");
      return;
    }
    if (editId) {
      updateCategory.mutate({ id: editId, ...form });
    } else {
      createCategory.mutate(form);
    }
  };

  const filteredCategories = categories?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Categories</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage product categories</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Category
          </Button>
        )}
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        data={filteredCategories}
        columns={[
          {
            key: "name" as const,
            label: "Category Name",
            width: "30%",
            render: (_: any, c: any) => (
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                  style={{ backgroundColor: c.color || "#6366f1" }}
                >
                  {c.icon || "T"}
                </div>
                <span className="font-medium">{c.name}</span>
              </div>
            ),
          },
          {
            key: "description" as const,
            label: "Description",
            width: "50%",
            render: (v: any) => <span className="text-muted-foreground text-sm">{v || "—"}</span>,
          },
          {
            key: "id" as const,
            label: "Actions",
            width: "20%",
            align: "right",
            render: (_: any, c: any) => (
              <div className="flex items-center justify-end gap-1">
                {isAdmin && (
                  <>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(c)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(c.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Category" : "Add New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Beverages, Bakery"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Brand Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    className="w-12 h-10 p-1"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                  />
                  <Input
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon / Emoji</Label>
                <Input
                  id="icon"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="e.g., 🍞, 🥤, tag"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createCategory.isPending || updateCategory.isPending}>
              {editId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {deleteId && (
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category?</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm py-2">
              Are you sure you want to delete this category? Products in this category will remain but will be uncategorized.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteCategory.mutate({ id: deleteId })} disabled={deleteCategory.isPending}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
