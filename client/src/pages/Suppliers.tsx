import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Truck, Search, Phone, Mail, MapPin } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DataTable } from "@/components/DataTable";
import { trpc } from "@/lib/trpc";
import { formatCambodianPhone } from "@/lib/utils";

type SupplierForm = {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  tin: string;
};

const emptyForm: SupplierForm = {
  name: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  tin: "",
};

export default function Suppliers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: suppliers, isLoading } = trpc.suppliers.list.useQuery();
  const utils = trpc.useUtils();

  const createSupplier = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      toast.success("Supplier added");
      setDialogOpen(false);
      utils.suppliers.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateSupplier = trpc.suppliers.update.useMutation({
    onSuccess: () => {
      toast.success("Supplier updated");
      setDialogOpen(false);
      utils.suppliers.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteSupplier = trpc.suppliers.delete.useMutation({
    onSuccess: () => {
      toast.success("Supplier deleted");
      setDeleteId(null);
      utils.suppliers.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (s: any) => {
    setForm({
      name: s.name,
      contactName: s.contactName ?? "",
      email: s.email ?? "",
      phone: s.phone ?? "",
      address: s.address ?? "",
      tin: s.tin ?? "",
    });
    setEditId(s.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name) {
      toast.error("Supplier name is required");
      return;
    }
    if (editId) {
      updateSupplier.mutate({ id: editId, ...form });
    } else {
      createSupplier.mutate(form);
    }
  };

  const filteredSuppliers = suppliers?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contactName?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Suppliers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your product suppliers and vendors</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Add Supplier
          </Button>
        )}
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search suppliers..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        data={filteredSuppliers}
        isLoading={isLoading}
        columns={[
          {
            key: "name" as const,
            label: "Supplier Name",
            width: "30%",
            render: (_: any, s: any) => (
              <div className="flex flex-col">
                <span className="font-bold">{s.name}</span>
                <span className="text-xs text-muted-foreground">{s.contactName || "No contact person"}</span>
              </div>
            ),
          },
          {
            key: "phone" as const,
            label: "Contact Info",
            width: "30%",
            render: (_: any, s: any) => (
              <div className="space-y-1">
                {s.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" /> {formatCambodianPhone(s.phone)}
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" /> {s.email}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "address" as const,
            label: "Address",
            width: "30%",
            render: (v: any) => (
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground line-clamp-2">
                <MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {v || "—"}
              </div>
            ),
          },
          {
            key: "id" as const,
            label: "Actions",
            width: "10%",
            align: "right",
            render: (_: any, s: any) => (
              <div className="flex items-center justify-end gap-1">
                {isAdmin && (
                  <>
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEdit(s)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(s.id)}>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Supplier Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Coca-Cola Cambodia" />
            </div>
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="e.g., John Doe" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: formatCambodianPhone(e.target.value) })} placeholder="012 345 6789" />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vendor@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>TIN (Tax ID)</Label>
              <Input value={form.tin} onChange={(e) => setForm({ ...form, tin: e.target.value })} placeholder="Optional Tax ID" />
            </div>
            <div className="space-y-2">
              <Label>Office Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, City, Province" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createSupplier.isPending || updateSupplier.isPending}>
              {editId ? "Update Supplier" : "Create Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {deleteId && (
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Supplier?</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm py-2">
              Are you sure you want to delete this supplier? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteSupplier.mutate({ id: deleteId })} disabled={deleteSupplier.isPending}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
