import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select2 } from "@/components/ui/select2";
import { ClipboardList, Search, Eye, Printer, RefreshCw, CreditCard, Banknote, Smartphone } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusColors: Record<string, string> = {
  completed: "badge-success",
  pending: "badge-warning",
  refunded: "badge-error",
  cancelled: "badge-neutral",
};

const paymentIcons: Record<string, any> = {
  cash: Banknote,
  card: CreditCard,
  wallet: Smartphone,
  mixed: CreditCard,
};

export default function Orders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewId, setViewId] = useState<number | null>(null);

  const { data: orders, isLoading } = trpc.orders.list.useQuery({ limit: 200 });
  const { data: orderDetail } = trpc.orders.getById.useQuery({ id: viewId! }, { enabled: !!viewId });
  const utils = trpc.useUtils();

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => { utils.orders.list.invalidate(); utils.orders.getById.invalidate(); },
  });

  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      const matchSearch = !search || o.orderNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const handlePrint = () => {
    if (!orderDetail) return;
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt - ${orderDetail.orderNumber}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 20px; max-width: 300px; }
        .header { text-align: center; margin-bottom: 16px; }
        .header h2 { font-size: 18px; margin: 0; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 4px 0; }
        .item-name { flex: 1; }
        .total { font-weight: bold; font-size: 14px; }
        .footer { text-align: center; margin-top: 16px; font-size: 11px; }
      </style></head><body>
      <div class="header">
        <h2>YaYa Mart</h2>
        <p>Point of Sale Receipt</p>
        <p>${new Date(orderDetail.createdAt).toLocaleString()}</p>
        <p>Order: ${orderDetail.orderNumber}</p>
      </div>
      <div class="divider"></div>
      ${(orderDetail.items ?? []).map((item: any) => `
        <div class="row">
          <span class="item-name">${item.productName} x${item.quantity}</span>
          <span>$${parseFloat(item.lineTotal).toFixed(2)}</span>
        </div>
      `).join("")}
      <div class="divider"></div>
      <div class="row"><span>Subtotal</span><span>$${parseFloat(orderDetail.subtotal).toFixed(2)}</span></div>
      <div class="row"><span>Tax</span><span>$${parseFloat(orderDetail.taxAmount).toFixed(2)}</span></div>
      ${parseFloat(orderDetail.discountAmount) > 0 ? `<div class="row"><span>Discount</span><span>-$${parseFloat(orderDetail.discountAmount).toFixed(2)}</span></div>` : ""}
      <div class="divider"></div>
      <div class="row total"><span>TOTAL</span><span>$${parseFloat(orderDetail.totalAmount).toFixed(2)}</span></div>
      <div class="row"><span>Paid (${orderDetail.paymentMethod})</span><span>$${parseFloat(orderDetail.amountPaid).toFixed(2)}</span></div>
      ${parseFloat(orderDetail.changeGiven ?? "0") > 0 ? `<div class="row"><span>Change</span><span>$${parseFloat(orderDetail.changeGiven!).toFixed(2)}</span></div>` : ""}
      <div class="footer">
        <p>Thank you for shopping at YaYa Mart!</p>
        <p>Please come again.</p>
      </div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Orders</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{filtered.length} orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by order number..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select2
          options={[
            { value: "all", label: "All Status" },
            { value: "completed", label: "Completed" },
            { value: "pending", label: "Pending" },
            { value: "refunded", label: "Refunded" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-40"
          placeholder="Filter Status"
        />
      </div>

      {/* Orders table with DataTable */}
      <DataTable
        data={filtered}
        isLoading={isLoading}
        columns={[
          {
            key: "orderNumber" as const,
            label: "Order #",
            width: "12%",
            render: (v: any) => <span className="font-medium font-mono">{v}</span>,
          },
            {
              key: "createdAt" as const,
              label: "Date & Time",
              width: "20%",
              render: (v: any) => <span className="text-muted-foreground text-sm">{new Date(v).toLocaleString()}</span>,
            },

            {
              key: "subtotal" as const,
              label: "Subtotal",
              width: "12%",
              align: "right",
              render: (v: any) => <span>${parseFloat(v).toFixed(2)}</span>,
            },
            {
              key: "taxAmount" as const,
              label: "Tax",
              width: "10%",
              align: "right",
              render: (v: any) => <span>${parseFloat(v).toFixed(2)}</span>,
            },
            {
              key: "totalAmount" as const,
              label: "Total",
              width: "12%",
              align: "right",
              render: (v: any) => <span className="font-bold">${parseFloat(v).toFixed(2)}</span>,
            },
            {
              key: "paymentMethod" as const,
              label: "Payment",
              width: "12%",
              render: (v: any) => {
                const Icon = paymentIcons[v] || CreditCard;
                return <div className="flex items-center gap-1"><Icon className="w-3.5 h-3.5" /> <span className="text-xs capitalize">{v}</span></div>;
              },
            },
            {
              key: "status" as const,
              label: "Status",
              width: "10%",
              align: "center",
              render: (v: any) => <span className={statusColors[v] ?? "badge-neutral"}>{v}</span>,
            },
            {
              key: "id" as const,
              label: "Actions",
              width: "4%",
              align: "right",
              render: (_: any, o: any) => (
                <div className="flex items-center justify-end">
                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setViewId(o.id)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ),
            },
          ]}
        />

      {/* Order Detail Dialog */}
      <Dialog open={!!viewId} onOpenChange={(o) => !o && setViewId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Order Details</span>
              {orderDetail && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={handlePrint}>
                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {orderDetail && (
            <div className="space-y-4">
              {/* Header info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Order Number</p>
                  <p className="font-mono font-semibold text-sm">{orderDetail.orderNumber}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-semibold text-sm">{new Date(orderDetail.createdAt).toLocaleString()}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Payment Method</p>
                  <p className="font-semibold text-sm capitalize">{orderDetail.paymentMethod}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className={statusColors[orderDetail.status] ?? "badge-neutral"}>{orderDetail.status}</span>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-sm font-semibold mb-2">Items</p>
                <div className="space-y-1.5">
                  {(orderDetail.items ?? []).map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.productName} × {item.quantity}</span>
                      <span className="font-medium">${parseFloat(item.lineTotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-border pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>${parseFloat(orderDetail.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span><span>${parseFloat(orderDetail.taxAmount).toFixed(2)}</span>
                </div>
                {parseFloat(orderDetail.discountAmount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span><span>-${parseFloat(orderDetail.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t border-border pt-1.5">
                  <span>Total</span><span>${parseFloat(orderDetail.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Amount Paid</span><span>${parseFloat(orderDetail.amountPaid).toFixed(2)}</span>
                </div>
                {parseFloat(orderDetail.changeGiven ?? "0") > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Change</span><span>${parseFloat(orderDetail.changeGiven!).toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              {orderDetail.status === "completed" && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 text-amber-600 border-amber-300"
                    onClick={() => updateStatus.mutate({ id: orderDetail.id, status: "refunded" })}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refund
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
