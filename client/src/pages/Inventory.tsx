import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select2 } from "@/components/ui/select2";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertTriangle, Package, Plus, RotateCcw, TrendingDown, History } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DataTable } from "@/components/DataTable";
import { trpc } from "@/lib/trpc";

export default function Inventory() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ productId: "", type: "restock" as const, quantity: "", note: "" });

  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery({});
  const { data: lowStock } = trpc.inventory.lowStock.useQuery();
  const { data: adjustments, isLoading: adjustmentsLoading } = trpc.inventory.adjustments.useQuery({});
  const { data: allProducts } = trpc.products.list.useQuery({});
  const utils = trpc.useUtils();

  const adjust = trpc.inventory.adjust.useMutation({
    onSuccess: () => {
      toast.success("Stock adjusted successfully");
      setAdjustOpen(false);
      setAdjustForm({ productId: "", type: "restock", quantity: "", note: "" });
      utils.products.list.invalidate();
      utils.inventory.adjustments.invalidate();
      utils.inventory.lowStock.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAdjust = () => {
    if (!adjustForm.productId || !adjustForm.quantity) { toast.error("Please fill all required fields"); return; }
    const qty = parseInt(adjustForm.quantity);
    const change = adjustForm.type === "restock" || adjustForm.type === "return" ? Math.abs(qty) : -Math.abs(qty);
    adjust.mutate({ productId: parseInt(adjustForm.productId), type: adjustForm.type, quantityChange: change, note: adjustForm.note || undefined });
  };

  const getProductName = (id: number) => allProducts?.find((p) => p.id === id)?.name ?? `Product #${id}`;

  const typeColors: Record<string, string> = {
    restock: "badge-success",
    sale: "badge-neutral",
    adjustment: "badge-warning",
    return: "badge-success",
    damage: "badge-error",
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Inventory</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Stock management and adjustment logs</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setAdjustOpen(true)} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Adjust Stock
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: products?.length ?? 0, icon: Package, color: "text-primary", bg: "bg-primary/10" },
          { label: "Low Stock", value: lowStock?.length ?? 0, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Out of Stock", value: products?.filter((p) => p.stockQuantity === 0).length ?? 0, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Adjustments Today", value: adjustments?.filter((a) => new Date(a.createdAt).toDateString() === new Date().toDateString()).length ?? 0, icon: History, color: "text-blue-600", bg: "bg-blue-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
          <TabsTrigger value="alerts">
            Low Stock Alerts
            {lowStock && lowStock.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-xs">{lowStock.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Adjustment History</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-4">
          <DataTable
            data={products ?? []}
            isLoading={productsLoading}
            columns={[
              {
                key: "name" as const,
                label: "Product",
                width: "40%",
              },
              {
                key: "sku" as const,
                label: "SKU",
                width: "15%",
              },
              {
                key: "stockQuantity" as const,
                label: "In Stock",
                width: "15%",
                align: "right",
                render: (_: any, p: any) => {
                  const isLow = p.stockQuantity <= p.reorderPoint;
                  const isOut = p.stockQuantity === 0;
                  return (
                    <span className={`font-semibold ${isOut ? "text-destructive" : isLow ? "text-amber-600" : "text-foreground"}`}>
                      {p.stockQuantity} {p.unit}
                    </span>
                  );
                },
              },
              {
                key: "reorderPoint" as const,
                label: "Reorder Point",
                width: "15%",
                align: "right",
                render: (v: any) => <span className="text-muted-foreground">{v}</span>,
              },
              {
                key: "unit" as const,
                label: "Status",
                width: "15%",
                align: "center",
                render: (_: any, p: any) => {
                  const isLow = p.stockQuantity <= p.reorderPoint;
                  const isOut = p.stockQuantity === 0;
                  return (
                    <span className={isOut ? "badge-error" : isLow ? "badge-warning" : "badge-success"}>
                      {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                    </span>
                  );
                },
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          {lowStock && lowStock.length > 0 ? (
            <div className="space-y-3">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900">{p.name}</p>
                    <p className="text-sm text-amber-700">
                      Current stock: <strong>{p.stockQuantity} {p.unit}</strong> — Reorder point: {p.reorderPoint}
                    </p>
                  </div>
                  {isAdmin && (
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100"
                      onClick={() => { setAdjustForm({ productId: p.id.toString(), type: "restock", quantity: "", note: "" }); setAdjustOpen(true); }}>
                      <Plus className="w-3 h-3 mr-1" /> Restock
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Package className="w-12 h-12 opacity-30" />
              <p className="text-sm font-medium">All stock levels are healthy</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <DataTable
            data={adjustments ?? []}
            isLoading={adjustmentsLoading}
            columns={[
              {
                key: "productId" as const,
                label: "Product",
                width: "25%",
                render: (v: any) => <span>{getProductName(v)}</span>,
              },
              {
                key: "type" as const,
                label: "Type",
                width: "15%",
                render: (v: any) => <span className={typeColors[v] ?? "badge-neutral"}>{v}</span>,
              },
              {
                key: "quantityBefore" as const,
                label: "Before",
                width: "12%",
                render: (v: any) => <div className="text-right text-muted-foreground">{v}</div>,
              },
              {
                key: "quantityChange" as const,
                label: "Change",
                width: "12%",
                render: (v: any) => (
                  <div className="text-right">
                    <span className={v > 0 ? "text-emerald-600 font-medium" : "text-destructive font-medium"}>
                      {v > 0 ? "+" : ""}{v}
                    </span>
                  </div>
                ),
              },
              {
                key: "quantityAfter" as const,
                label: "After",
                width: "12%",
                render: (v: any) => <div className="text-right font-medium">{v}</div>,
              },
              {
                key: "note" as const,
                label: "Note",
                width: "16%",
                render: (v: any) => <span className="text-muted-foreground text-xs">{v ?? "—"}</span>,
              },
              {
                key: "createdAt" as const,
                label: "Date",
                width: "8%",
                render: (v: any) => <div className="text-right text-muted-foreground text-xs">{new Date(v).toLocaleString()}</div>,
              },
            ]}
          />
        </TabsContent>
      </Tabs>

      {/* Adjust Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="pb-2">Adjust Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="pb-2">Product *</Label>
              <Select2
                options={allProducts?.map((p) => ({ value: p.id.toString(), label: p.name })) ?? []}
                value={adjustForm.productId}
                onChange={(v) => setAdjustForm((p) => ({ ...p, productId: v }))}
                placeholder="Select product"
              />
            </div>
            <div>
              <Label className="pb-2">Adjustment Type *</Label>
              <Select2
                options={[
                  { value: "restock", label: "Restock" },
                  { value: "adjustment", label: "Adjustment" },
                  { value: "return", label: "Return" },
                  { value: "damage", label: "Damage" },
                ]}
                value={adjustForm.type}
                onChange={(v) => setAdjustForm((p) => ({ ...p, type: v as any }))}
              />
            </div>
            <div>
              <Label className="pb-2">Quantity *</Label>
              <Input type="number" value={adjustForm.quantity} onChange={(e) => setAdjustForm((p) => ({ ...p, quantity: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <Label className="pb-2">Note</Label>
              <Input value={adjustForm.note} onChange={(e) => setAdjustForm((p) => ({ ...p, note: e.target.value }))} placeholder="Optional note..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
            <Button onClick={handleAdjust} disabled={adjust.isPending}>Adjust</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
