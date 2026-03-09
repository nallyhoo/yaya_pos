import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Users, Eye } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DataTable } from "@/components/DataTable";
import { trpc } from "@/lib/trpc";
import { formatCambodianPhone } from "@/lib/utils";

type CustomerForm = { name: string; email: string; phone: string; address: string; notes: string };
const emptyForm: CustomerForm = { name: "", email: "", phone: "", address: "", notes: "" };

export default function Customers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);

  const { data: customers, isLoading } = trpc.customers.list.useQuery({ search: search || undefined });
  const { data: viewCustomer } = trpc.customers.getById.useQuery({ id: viewId! }, { enabled: !!viewId });
  const { data: customerOrders } = trpc.customers.orders.useQuery({ customerId: viewId! }, { enabled: !!viewId });
  const utils = trpc.useUtils();

  const createCustomer = trpc.customers.create.useMutation({
    onSuccess: () => { toast.success("Customer added"); setDialogOpen(false); utils.customers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateCustomer = trpc.customers.update.useMutation({
    onSuccess: () => { toast.success("Customer updated"); setDialogOpen(false); utils.customers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCustomer = trpc.customers.delete.useMutation({
    onSuccess: () => { toast.success("Customer deleted"); setDeleteId(null); utils.customers.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => { setForm(emptyForm); setEditId(null); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", address: c.address ?? "", notes: c.notes ?? "" });
    setEditId(c.id); setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    const payload = { name: form.name, email: form.email || undefined, phone: form.phone || undefined, address: form.address || undefined, notes: form.notes || undefined };
    if (editId) updateCustomer.mutate({ id: editId, ...payload });
    else createCustomer.mutate(payload);
  };

  const f = (k: keyof CustomerForm, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Customers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage customer relationships and loyalty</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name, phone, or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Customer table with DataTable */}
      <DataTable
        data={customers ?? []}
        isLoading={isLoading}
        columns={[
          {
            key: "name" as const,
            label: "Customer",
            width: "25%",
          },
            {
              key: "email" as const,
              label: "Contact",
              width: "25%",
              render: (_: any, c: any) => (
                <div className="text-sm">
                  {c.email && <p className="text-foreground">{c.email}</p>}
                  {c.phone && <p className="text-muted-foreground text-xs">{formatCambodianPhone(c.phone)}</p>}
                </div>
              ),
            },
            {
              key: "totalSpent" as const,
              label: "Total Spent",
              width: "15%",
              align: "right",
              render: (v: any) => <span className="font-semibold">${parseFloat(v || 0).toFixed(2)}</span>,
            },
            {
              key: "visitCount" as const,
              label: "Visits",
              width: "10%",
              align: "right",
              render: (v: any) => <span>{v ?? 0}</span>,
            },
            {
              key: "loyaltyPoints" as const,
              label: "Loyalty Points",
              width: "15%",
              align: "right",
              render: (v: any) => <span className="font-medium text-emerald-600">{v ?? 0}</span>,
            },
            {
              key: "id" as const,
              label: "Actions",
              width: "10%",
              align: "right",
              render: (_: any, c: any) => (
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => setViewId(c.id)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-primary hover:text-primary hover:bg-primary/10" onClick={() => openEdit(c)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(c.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ),
            },
          ]}
        />

      {/* View Customer Dialog */}
      {viewId && viewCustomer && (
        <Dialog open={!!viewId} onOpenChange={() => setViewId(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewCustomer.name}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="orders">Orders ({customerOrders?.length ?? 0})</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Email</p>
                  <p className="font-medium">{viewCustomer.email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Phone</p>
                  <p className="font-medium">{viewCustomer.phone ? formatCambodianPhone(viewCustomer.phone) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Address</p>
                  <p className="font-medium">{viewCustomer.address ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Spent</p>
                  <p className="text-lg font-bold text-primary">${parseFloat(String(viewCustomer.totalSpent || 0)).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Loyalty Points</p>
                  <p className="text-lg font-bold">{viewCustomer.loyaltyPoints ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm text-muted-foreground">{viewCustomer.notes ?? "—"}</p>
                </div>
              </TabsContent>
              <TabsContent value="orders" className="mt-4">
                {customerOrders && customerOrders.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {customerOrders.map((o) => (
                      <div key={o.id} className="p-3 border border-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Order #{o.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${parseFloat(o.totalAmount).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground capitalize">{o.status}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No orders yet</p>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="pb-2">Name *</Label>
              <Input value={form.name} onChange={(e) => f("name", e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <Label className="pb-2">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => f("email", e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <Label className="pb-2">Phone</Label>
              <Input value={form.phone} onChange={(e) => f("phone", formatCambodianPhone(e.target.value))} placeholder="012 345 6789" />
            </div>
            <div>
              <Label className="pb-2">Address</Label>
              <Input value={form.address} onChange={(e) => f("address", e.target.value)} placeholder="Street address" />
            </div>
            <div>
              <Label className="pb-2">Notes</Label>
              <Input value={form.notes} onChange={(e) => f("notes", e.target.value)} placeholder="Internal notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createCustomer.isPending || updateCustomer.isPending}>
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
              <DialogTitle>Delete Customer?</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">This action cannot be undone.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteCustomer.mutate({ id: deleteId })} disabled={deleteCustomer.isPending}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
