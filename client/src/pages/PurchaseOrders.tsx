import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select2 } from "@/components/ui/select2";
import { toast } from "sonner";
import { Plus, Search, Eye, FileText, ShoppingBag, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DataTable } from "@/components/DataTable";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/contexts/I18nContext";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  ordered: "bg-blue-500 text-white",
  received: "bg-emerald-500 text-white",
  cancelled: "bg-destructive text-white",
};

export default function PurchaseOrders() {
  const { user } = useAuth();
  const { formatCurrency } = useI18n();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);

  // New PO State
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [poItems, setPoItems] = useState<any[]>([]);
  const [poNotes, setPoNotes] = useState("");

  const { data: pos, isLoading } = trpc.purchaseOrders.list.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery();
  const { data: products } = trpc.products.list.useQuery({});
  const utils = trpc.useUtils();

  const createPO = trpc.purchaseOrders.create.useMutation({
    onSuccess: () => {
      toast.success("Purchase order created");
      setDialogOpen(false);
      resetForm();
      utils.purchaseOrders.list.invalidate();
      utils.products.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.purchaseOrders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      utils.purchaseOrders.list.invalidate();
      utils.products.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setSelectedSupplier("");
    setPoItems([]);
    setPoNotes("");
  };

  const addItem = () => {
    setPoItems([...poItems, { productId: "", quantity: 1, costPrice: "0.00" }]);
  };

  const removeItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const next = [...poItems];
    next[index][field] = value;
    setPoItems(next);
  };

  const subtotal = useMemo(() => {
    return poItems.reduce((acc, item) => acc + (item.quantity * parseFloat(item.costPrice || "0")), 0);
  }, [poItems]);

  const handleSubmit = (status: "draft" | "received") => {
    if (!selectedSupplier || poItems.length === 0) {
      toast.error("Supplier and items are required");
      return;
    }

    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    
    createPO.mutate({
      poNumber,
      supplierId: parseInt(selectedSupplier),
      status,
      subtotal: subtotal.toFixed(2),
      totalAmount: subtotal.toFixed(2),
      notes: poNotes,
      items: poItems.map(item => {
        const p = products?.find(x => x.id === parseInt(item.productId));
        return {
          productId: parseInt(item.productId),
          productName: p?.name || "Unknown",
          quantity: parseInt(item.quantity),
          costPrice: item.costPrice,
          lineTotal: (parseInt(item.quantity) * parseFloat(item.costPrice)).toFixed(2)
        };
      })
    });
  };

  const filteredPOs = pos?.filter(p => p.poNumber.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Purchase Orders</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Stock replenishment from suppliers</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Create Purchase Order
          </Button>
        )}
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search PO number..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable
        data={filteredPOs}
        isLoading={isLoading}
        columns={[
          {
            key: "poNumber" as const,
            label: "PO Number",
            width: "20%",
            render: (v: any) => <span className="font-mono font-bold">{v}</span>,
          },
          {
            key: "supplierId" as const,
            label: "Supplier",
            width: "25%",
            render: (v: any) => <span>{suppliers?.find(s => s.id === v)?.name || "Unknown"}</span>,
          },
          {
            key: "status" as const,
            label: "Status",
            width: "15%",
            render: (v: any) => (
              <Badge className={`${statusColors[v as string]} border-none px-2 py-0.5 text-[10px] uppercase font-black tracking-wider`}>
                {v}
              </Badge>
            ),
          },
          {
            key: "totalAmount" as const,
            label: "Total",
            width: "15%",
            render: (v: any) => <span className="font-bold">{formatCurrency(v)}</span>,
          },
          {
            key: "createdAt" as const,
            label: "Date",
            width: "15%",
            render: (v: any) => <span className="text-xs text-muted-foreground">{format(new Date(v), "MMM dd, yyyy")}</span>,
          },
          {
            key: "id" as const,
            label: "Actions",
            width: "10%",
            align: "right",
            render: (_: any, po: any) => (
              <div className="flex items-center justify-end gap-2">
                {po.status === 'ordered' && isAdmin && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] font-bold px-2 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                    onClick={() => updateStatus.mutate({ id: po.id, status: 'received' })}
                  >
                    Mark Received
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* Create PO Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if(!o) resetForm(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>New Purchase Order</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select2
                  options={suppliers?.map(s => ({ value: s.id.toString(), label: s.name })) ?? []}
                  value={selectedSupplier}
                  onChange={setSelectedSupplier}
                  placeholder="Select vendor"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={poNotes} onChange={(e) => setPoNotes(e.target.value)} placeholder="Internal remarks..." />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Order Items</h3>
                <Button variant="outline" size="sm" onClick={addItem} className="h-8 gap-1.5 font-bold text-xs">
                  <Plus className="w-3.5 h-3.5" /> Add Product
                </Button>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-3 font-bold text-xs uppercase tracking-wider">Product</th>
                      <th className="text-center p-3 font-bold text-xs uppercase tracking-wider w-24">Qty</th>
                      <th className="text-right p-3 font-bold text-xs uppercase tracking-wider w-32">Unit Cost</th>
                      <th className="text-right p-3 font-bold text-xs uppercase tracking-wider w-32">Line Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {poItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <Select2
                            options={products?.map(p => ({ value: p.id.toString(), label: p.name })) ?? []}
                            value={item.productId}
                            onChange={(v) => {
                              const p = products?.find(x => x.id === parseInt(v));
                              updateItem(idx, "productId", v);
                              if (p) updateItem(idx, "costPrice", p.costPrice || "0.00");
                            }}
                            placeholder="Select product"
                            className="h-9"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                            className="h-9 text-center font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.costPrice}
                              onChange={(e) => updateItem(idx, "costPrice", e.target.value)}
                              className="h-9 pl-5 text-right font-mono"
                            />
                          </div>
                        </td>
                        <td className="p-2 text-right font-bold pr-4">
                          {formatCurrency(item.quantity * parseFloat(item.costPrice || "0"))}
                        </td>
                        <td className="p-2">
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive" onClick={() => removeItem(idx)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {poItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground italic">
                          No items added yet. Click "Add Product" to begin.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="p-6 bg-muted/30 border-t flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Cost</p>
              <p className="text-2xl font-black text-primary">{formatCurrency(subtotal)}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={createPO.isPending}>
                Save as Draft
              </Button>
              <Button onClick={() => handleSubmit("received")} disabled={createPO.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                Receive Stock Immediately
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
