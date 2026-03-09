import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select2 } from "@/components/ui/select2";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Tag, AlertTriangle, Upload, X, ImageIcon, Sparkles, Eye } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DataTable } from "@/components/DataTable";
import { trpc } from "@/lib/trpc";

type ProductForm = {
  sku: string; barcode: string; name: string; description: string;
  categoryId: string; price: string; costPrice: string; taxRate: string;
  stockQuantity: string; reorderPoint: string; unit: string; isActive: boolean;
  imageUrl: string;
};

const emptyForm: ProductForm = {
  sku: "", barcode: "", name: "", description: "", categoryId: "",
  price: "", costPrice: "0", taxRate: "0", stockQuantity: "0",
  reorderPoint: "10", unit: "pcs", isActive: true, imageUrl: "",
};

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading } = trpc.products.list.useQuery({ search: search || undefined, categoryId: categoryFilter !== "all" ? parseInt(categoryFilter) : undefined });
  const { data: categories } = trpc.categories.list.useQuery();
  const utils = trpc.useUtils();

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => { toast.success("Product created"); setDialogOpen(false); utils.products.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => { toast.success("Product updated"); setDialogOpen(false); utils.products.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => { toast.success("Product deleted"); setDeleteId(null); utils.products.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const uploadImage = trpc.storage.upload.useMutation();

  const openCreate = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const barcode = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    setForm({ ...emptyForm, sku: `PRD-${randomSuffix}`, barcode });
    setEditId(null);
    setDialogOpen(true);
  };
  const openEdit = (p: any) => {
    setForm({
      sku: p.sku, barcode: p.barcode ?? "", name: p.name, description: p.description ?? "",
      categoryId: p.categoryId?.toString() ?? "", price: p.price, costPrice: p.costPrice ?? "0",
      taxRate: p.taxRate ?? "0", stockQuantity: p.stockQuantity.toString(),
      reorderPoint: p.reorderPoint.toString(), unit: p.unit ?? "pcs", isActive: p.isActive,
      imageUrl: p.imageUrl ?? "",
    });
    setEditId(p.id);
    setDialogOpen(true);
  };
  const openDetail = (p: any) => {
    setDetailId(p.id);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await uploadImage.mutateAsync({
          name: `products/${Date.now()}-${file.name}`,
          base64,
          contentType: file.type,
        });
        f("imageUrl", res.url);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to upload image");
      setIsUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!form.name || !form.sku || !form.price) { toast.error("Name, SKU, and price are required"); return; }
    const payload = {
      sku: form.sku, barcode: form.barcode || undefined, name: form.name,
      description: form.description || undefined,
      categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
      price: form.price, costPrice: form.costPrice, taxRate: form.taxRate,
      stockQuantity: parseInt(form.stockQuantity), reorderPoint: parseInt(form.reorderPoint),
      unit: form.unit, isActive: form.isActive,
      imageUrl: form.imageUrl || undefined,
    };
    if (editId) updateProduct.mutate({ id: editId, ...payload });
    else createProduct.mutate(payload);
  };

  const f = (k: keyof ProductForm, v: string | boolean) => {
    setForm((p) => {
      const next = { ...p, [k]: v };
      // Auto-update SKU prefix based on name for new products
      if (k === "name" && !editId && typeof v === "string") {
        const prefix = v.trim().substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') || "PRD";
        const suffix = p.sku.includes('-') ? p.sku.split('-')[1] : Math.floor(1000 + Math.random() * 9000).toString();
        next.sku = `${prefix}-${suffix}`;
      }
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Products</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your product catalog</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select2
          options={[
            { value: "all", label: "All Categories" },
            ...(categories?.map((c) => ({ value: c.id.toString(), label: c.name })) ?? []),
          ]}
          value={categoryFilter}
          onChange={setCategoryFilter}
          className="w-48"
          placeholder="Filter Category"
        />
      </div>

      {/* Product table with DataTable */}
      <DataTable
        data={products ?? []}
        isLoading={isLoading}
        columns={[
          {
            key: "name" as const,
            label: "Product",
            width: "35%",
            render: (_: any, p: any) => (
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 border overflow-hidden">
                    {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Tag className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {p.barcode && <p className="text-xs text-muted-foreground">{p.barcode}</p>}
                  </div>
                </div>
              ),
            },
            {
              key: "sku" as const,
              label: "SKU",
              width: "15%",
            },
            {
              key: "categoryId" as const,
              label: "Category",
              width: "15%",
              align: "center",
              render: (_: any, p: any) => {
                const cat = categories?.find((c) => c.id === p.categoryId);
                return cat ? <Badge variant="outline" className="text-xs">{cat.name}</Badge> : <span className="text-muted-foreground text-xs">—</span>;
              },
            },
            {
              key: "price" as const,
              label: "Price",
              width: "12%",
              align: "right",
              render: (v: any) => <span className="font-semibold">${parseFloat(v).toFixed(2)}</span>,
            },
            {
              key: "stockQuantity" as const,
              label: "Stock",
              width: "12%",
              align: "right",
              render: (_: any, p: any) => {
                const isLow = p.stockQuantity <= p.reorderPoint;
                return (
                  <span className={`font-medium ${isLow ? "text-amber-600" : "text-foreground"}`}>
                    {p.stockQuantity} {p.unit}
                    {isLow && <AlertTriangle className="inline w-3 h-3 ml-1 text-amber-500" />}
                  </span>
                );
              },
            },
            {
              key: "isActive" as const,
              label: "Status",
              width: "11%",
              align: "center",
              render: (v: any) => (
                <span className={v ? "badge-success" : "badge-neutral"}>
                  {v ? "Active" : "Inactive"}
                </span>
              ),
            },
            ...(isAdmin ? [{
              key: "id" as const,
              label: "Actions",
              width: "10%",
              align: "right",
              render: (_: any, p: any) => (
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openDetail(p)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(p)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ),
            }] : []),
          ]}
        />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-6">
            {/* Image Upload Section */}
            <div className="col-span-1 space-y-3">
              <Label>Product Image</Label>
              <div
                className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {form.imageUrl ? (
                  <>
                    <img src={form.imageUrl} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">Change Image</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); f("imageUrl", ""); }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Upload Image</p>
                      <p className="text-[10px] text-muted-foreground">JPG, PNG up to 5MB</p>
                    </div>
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {form.imageUrl && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted p-2 rounded">
                  <ImageIcon className="w-3 h-3" />
                  <span className="truncate flex-1">{form.imageUrl}</span>
                </div>
              )}
            </div>

            {/* Form Fields Section */}
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="pb-2">Product Name *</Label>
                <Input value={form.name} onChange={(e) => f("name", e.target.value)} placeholder="e.g., Organic Milk" />
              </div>
              <div>
                <Label>SKU *</Label>
                <Input value={form.sku} readOnly placeholder="e.g., SKU-001" className="mt-1 bg-muted font-mono" />
              </div>
              <div>
                <Label>Barcode</Label>
                <Input value={form.barcode} readOnly placeholder="e.g., 123456789" className="mt-1 bg-muted font-mono" />
              </div>
              <div>
                <Label className="pb-2">Category</Label>
                <Select2
                  options={categories?.map((c) => ({ value: c.id.toString(), label: c.name })) ?? []}
                  value={form.categoryId}
                  onChange={(v) => f("categoryId", v)}
                  placeholder="Select category"
                />
              </div>
              <div>
                <Label className="pb-2">Unit</Label>
                <Select2
                  options={["pcs", "box", "kg", "liter", "meter"].map((u) => ({ value: u, label: u }))}
                  value={form.unit}
                  onChange={(v) => f("unit", v)}
                />
              </div>
              <div>
                <Label className="pb-2">Price (USD) *</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => f("price", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="pb-2">Cost Price (USD)</Label>
                <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => f("costPrice", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="pb-2">Tax Rate (%)</Label>
                <Input type="number" step="0.01" value={form.taxRate} onChange={(e) => f("taxRate", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="pb-2">Stock Quantity</Label>
                <Input type="number" value={form.stockQuantity} onChange={(e) => f("stockQuantity", e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label className="pb-2">Reorder Point</Label>
                <Input type="number" value={form.reorderPoint} onChange={(e) => f("reorderPoint", e.target.value)} placeholder="10" />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => f("isActive", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active Product</Label>
              </div>
              <div className="col-span-2">
                <Label className="pb-2">Description</Label>
                <Input value={form.description} onChange={(e) => f("description", e.target.value)} placeholder="Product description..." />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createProduct.isPending || updateProduct.isPending || isUploading}>
              {editId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail Dialog */}
      {detailId && (() => {
        const p = products?.find(x => x.id === detailId);
        if (!p) return null;
        const cat = categories?.find(c => c.id === p.categoryId);
        
        return (
          <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
              <div className="flex flex-col sm:flex-row h-auto sm:h-[450px]">
                {/* Left: Image */}
                <div className="w-full sm:w-2/5 bg-muted relative overflow-hidden group min-h-[250px] sm:min-h-0">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-2">
                      <Tag className="w-16 h-16" strokeWidth={1} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge className={p.isActive ? "bg-emerald-500 text-white border-none" : "bg-muted text-muted-foreground"}>
                      {p.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {/* Right: Info */}
                <div className="flex-1 p-8 flex flex-col">
                  <div className="flex-1 space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">
                        {cat?.name || "Uncategorized"}
                      </p>
                      <h2 className="text-3xl font-black tracking-tight leading-none" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                        {p.name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {p.description || "No description provided for this product."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 pt-4 border-t border-border/50">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">SKU</p>
                        <p className="font-mono text-xs font-bold bg-muted px-2 py-1 rounded-lg inline-block truncate max-w-full">{p.sku}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Barcode</p>
                        <p className="font-mono text-sm font-bold truncate">{p.barcode || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Selling Price</p>
                        <p className="text-xl font-black text-primary">${parseFloat(p.price).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Stock Level</p>
                        <div className="flex items-center gap-2">
                          <p className={`text-xl font-black ${p.stockQuantity <= p.reorderPoint ? "text-destructive" : "text-foreground"}`}>
                            {p.stockQuantity} <span className="text-sm font-medium">{p.unit}</span>
                          </p>
                          {p.stockQuantity <= p.reorderPoint && (
                            <Badge variant="destructive" className="h-5 px-1.5 animate-pulse">Low</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="pt-6 mt-auto">
                      <Button className="w-full h-12 rounded-xl font-bold" variant="secondary" onClick={() => { setDetailId(null); openEdit(p); }}>
                        <Edit className="w-4 h-4 mr-2" /> Edit Product
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Delete Confirmation */}
      {deleteId && (
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product?</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteProduct.mutate({ id: deleteId })} disabled={deleteProduct.isPending}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

