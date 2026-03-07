import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select2 } from "@/components/ui/select2";
import { toast } from "sonner";
import {
  Search, Barcode, Trash2, Plus, Minus, ShoppingCart,
  CreditCard, Banknote, Smartphone, X, Check, User, Tag, Package, Printer, RotateCcw
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Receipt } from "@/components/Receipt";
import { useI18n } from "@/contexts/I18nContext";

interface CartItem {
  productId: number;
  name: string;
  sku: string;
  price: number;
  taxRate: number;
  quantity: number;
  lineTotal: number;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "wallet", label: "Wallet", icon: Smartphone },
];

export default function POSTerminal() {
  const { user } = useAuth();
  const { t, formatCurrency } = useI18n();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("yaya_pos_cart");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "wallet">("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [payments, setPayments] = useState<Array<{ method: "cash" | "card" | "wallet", amount: string, reference?: string }>>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [discount, setDiscount] = useState(0);
  const [orderComplete, setOrderComplete] = useState<any | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: products } = trpc.products.list.useQuery(
    { search: search || undefined, categoryId: selectedCategory ?? undefined },
    { keepPreviousData: true } as any
  );
  const { data: customers } = trpc.customers.list.useQuery({});
  const { data: settings } = trpc.settings.getAll.useQuery();
  const utils = trpc.useUtils();

  const createOrder = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      const orderData = {
        orderNumber: data.orderNumber,
        createdAt: new Date(),
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount: total,
        paymentMethod,
        amountPaid: parseFloat(amountPaid),
        changeGiven: Math.max(0, parseFloat(amountPaid) - total),
        customerName: customers?.find(c => c.id === selectedCustomerId)?.name,
        employeeName: user?.name,
        items: cart.map(i => ({
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
          lineTotal: i.lineTotal
        }))
      };
      setOrderComplete(orderData);
      toast.success("Order processed successfully");
      utils.orders.list.invalidate();
      utils.products.list.invalidate();
      utils.products.lowStock.invalidate();
      utils.reports.summary.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const addToCart = (product: any) => {
    if (product.stockQuantity <= 0) {
      toast.error("Out of stock");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast.error("Insufficient stock");
          return prev;
        }
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1, lineTotal: (i.quantity + 1) * i.price }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          price: parseFloat(product.price),
          taxRate: parseFloat(product.taxRate ?? "0"),
          quantity: 1,
          lineTotal: parseFloat(product.price),
        },
      ];
    });
  };

  const handleBarcodeSearch = useCallback(async (barcode: string) => {
    const product = products?.find((p) => p.barcode === barcode || p.sku === barcode);
    if (product) {
      addToCart(product);
      toast.success(`Added: ${product.name}`);
    } else {
      toast.error(`Product not found: ${barcode}`);
    }
  }, [products]);

  // Barcode scan support
  useEffect(() => {
    let buffer = "";
    let timer: ReturnType<typeof setTimeout>;
    const handleKey = (e: KeyboardEvent) => {
      // Don't capture if we're in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "Enter" && buffer.length > 3) {
        handleBarcodeSearch(buffer);
        buffer = "";
      } else if (e.key.length === 1) {
        buffer += e.key;
        clearTimeout(timer);
        timer = setTimeout(() => { buffer = ""; }, 200);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleBarcodeSearch]);

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId === productId) {
            const product = products?.find(p => p.id === productId);
            if (delta > 0 && product && i.quantity >= product.stockQuantity) {
              toast.error("Insufficient stock");
              return i;
            }
            return { ...i, quantity: i.quantity + delta, lineTotal: (i.quantity + delta) * i.price };
          }
          return i;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId: number) => setCart((prev) => prev.filter((i) => i.productId !== productId));
  const clearCart = () => { 
    setCart([]); 
    setSelectedCustomerId(null); 
    setDiscount(0);
    localStorage.removeItem("yaya_pos_cart");
  };

  // Persist cart
  useEffect(() => {
    localStorage.setItem("yaya_pos_cart", JSON.stringify(cart));
  }, [cart]);

  const subtotal = cart.reduce((s, i) => s + i.lineTotal, 0);
  const taxAmount = cart.reduce((s, i) => s + i.lineTotal * (i.taxRate / 100), 0);
  const discountAmount = discount;
  const total = Math.max(0, subtotal + taxAmount - discountAmount);

  const handleCheckout = () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    setPayments([]);
    setAmountPaid("");
    setPaymentMethod("cash");
    setCheckoutOpen(true);
  };

  const addPayment = () => {
    const amount = parseFloat(amountPaid || "0");
    if (amount <= 0) return;
    
    setPayments([...payments, { method: paymentMethod, amount: amount.toFixed(2) }]);
    setAmountPaid("");
  };

  const removePayment = (idx: number) => {
    setPayments(payments.filter((_, i) => i !== idx));
  };

  const totalPaid = useMemo(() => {
    return payments.reduce((acc, p) => acc + parseFloat(p.amount), 0) + parseFloat(amountPaid || "0");
  }, [payments, amountPaid]);

  const handleProcessPayment = () => {
    const finalPayments = [...payments];
    if (parseFloat(amountPaid || "0") > 0) {
      finalPayments.push({ method: paymentMethod, amount: parseFloat(amountPaid).toFixed(2) });
    }

    if (finalPayments.length === 0) {
      toast.error("Please add at least one payment");
      return;
    }

    if (totalPaid < total - 0.01) {
      toast.error("Insufficient total payment");
      return;
    }

    const loyaltyEarned = Math.floor(total);
    createOrder.mutate({
      customerId: selectedCustomerId ?? undefined,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      totalAmount: total.toFixed(2),
      paymentMethod: finalPayments.length > 1 ? "mixed" : finalPayments[0].method,
      amountPaid: totalPaid.toFixed(2),
      changeGiven: Math.max(0, totalPaid - total).toFixed(2),
      loyaltyPointsEarned: loyaltyEarned,
      payments: finalPayments,
      items: cart.map((i) => ({
        productId: i.productId,
        productName: i.name,
        productSku: i.sku,
        quantity: i.quantity,
        unitPrice: i.price.toFixed(2),
        taxRate: i.taxRate.toFixed(2),
        taxAmount: (i.lineTotal * i.taxRate / 100).toFixed(2),
        lineTotal: i.lineTotal.toFixed(2),
      })),
    });
  };

  const handleNewSale = () => {
    clearCart();
    setCheckoutOpen(false);
    setOrderComplete(null);
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  const handlePrint = () => {
    window.print();
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      // F1: Focus Search
      if (e.key === "F1") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      // F2: Checkout
      if (e.key === "F2" && cart.length > 0 && !checkoutOpen) {
        e.preventDefault();
        handleCheckout();
      }
      // F3: Print (only when order complete)
      if (e.key === "F3" && orderComplete) {
        e.preventDefault();
        handlePrint();
      }
      // F4: New Sale (only when order complete)
      if (e.key === "F4" && orderComplete) {
        e.preventDefault();
        handleNewSale();
      }
      // Esc: Close checkout
      if (e.key === "Escape" && checkoutOpen && !createOrder.isPending) {
        setCheckoutOpen(false);
        setOrderComplete(null);
      }
    };
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [cart.length, checkoutOpen, orderComplete, createOrder.isPending]);

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Hidden Receipt for Printing */}
      <div className="hidden">
        {orderComplete && <Receipt ref={receiptRef} order={orderComplete} settings={settings} />}
      </div>

      {/* Left: Product grid */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border">
        {/* Search bar */}
        <div className="p-4 border-b border-border bg-card shadow-sm z-10">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder={t("pos.search")}
                className="pl-9 h-11 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11 flex-shrink-0" title="Barcode scanner active">
              <Barcode className="w-5 h-5" />
            </Button>
          </div>
          {/* Category filter */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === null ? "bg-primary text-primary-foreground shadow-sm scale-105" : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
            >
              {t("pos.all")}
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat.id ? "bg-primary text-primary-foreground shadow-sm scale-105" : "bg-secondary text-secondary-foreground hover:bg-accent"
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-background/50">
          {products && products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {products.filter((p) => p.isActive).map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stockQuantity <= 0}
                  className={`group relative flex flex-col p-3 rounded-2xl border text-left transition-all duration-200 ${product.stockQuantity <= 0
                      ? "opacity-50 cursor-not-allowed border-border bg-muted/50"
                      : "border-border/50 bg-card hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 active:scale-95 cursor-pointer"
                    }`}
                >
                  <div className="w-full aspect-square rounded-xl bg-muted flex items-center justify-center mb-3 overflow-hidden group-hover:bg-primary/5 transition-colors">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <Tag className="w-10 h-10 text-muted-foreground/30" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-foreground line-clamp-2 leading-snug h-8 mb-1">{product.name}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-sm font-black text-primary">${parseFloat(product.price).toFixed(2)}</p>
                    <Badge variant={product.stockQuantity <= product.reorderPoint ? "destructive" : "secondary"} className="text-[10px] h-5 px-1.5">
                      {product.stockQuantity}
                    </Badge>
                  </div>
                  {product.stockQuantity <= 0 && (
                    <div className="absolute inset-0 rounded-2xl bg-background/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                      <Badge variant="destructive" className="font-bold">Out of Stock</Badge>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 gap-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <Package className="w-10 h-10" />
              </div>
              <p className="text-sm font-medium">{search ? "No matching products" : "Product catalog is empty"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-96 flex flex-col bg-card border-l border-border flex-shrink-0 shadow-2xl z-20">
        {/* Cart header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">{t("pos.cart")}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {cart.reduce((s, i) => s + i.quantity, 0)} {t("pos.items")}
              </p>
            </div>
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full" onClick={clearCart}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Customer selector */}
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <Select2
            options={[
              { value: "none", label: "Walk-in Customer" },
              ...(customers?.map((c) => ({
                value: c.id.toString(),
                label: `${c.name} (${c.phone || c.email || "No contact"})`,
              })) ?? []),
            ]}
            value={selectedCustomerId?.toString() ?? "none"}
            onChange={(v) => setSelectedCustomerId(v === "none" ? null : parseInt(v))}
            placeholder="Select Customer"
          />
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 gap-4 py-12">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-current flex items-center justify-center">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold">Cart is empty</p>
                <p className="text-xs max-w-[180px] mx-auto mt-1">Add products to start a new sale transaction</p>
              </div>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 group border border-transparent hover:border-primary/20 hover:bg-secondary/50 transition-all">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate leading-tight">{item.name}</p>
                  <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">${item.price.toFixed(2)} / unit</p>
                </div>
                <div className="flex items-center bg-background rounded-full p-1 border shadow-sm">
                  <button
                    onClick={() => updateQty(item.productId, -1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.productId, 1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="w-16 text-right">
                  <p className="text-xs font-black">${item.lineTotal.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Order summary */}
        <div className="p-6 border-t border-border bg-card shadow-[0_-4px_20px_rgba(0,0,0,0.03)] rounded-t-3xl">
          <div className="space-y-2.5 text-sm mb-6">
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>{t("pos.subtotal")}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>{t("pos.tax")}</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-success font-bold bg-success/5 p-2 rounded-lg">
                <span>{t("pos.discount")}</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-3 border-t border-border mt-3">
              <div>
                <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">{t("pos.total")}</span>
                <p className="text-xs font-bold text-muted-foreground mt-1">{formatCurrency(total, "KHR")}</p>
              </div>
              <span className="text-3xl font-black text-primary leading-none">{formatCurrency(total)}</span>
            </div>
          </div>
          <Button
            className="w-full h-14 text-lg font-black gap-3 rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all"
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            <CreditCard className="w-6 h-6" />
            {t("pos.checkout")}
          </Button>
        </div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={checkoutOpen} onOpenChange={(o) => { if (!o && !createOrder.isPending) { setCheckoutOpen(false); setOrderComplete(null); } }}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          {orderComplete ? (
            <div className="p-8 text-center space-y-6 bg-gradient-to-b from-success/10 to-background">
              <div className="w-20 h-20 rounded-full bg-success flex items-center justify-center mx-auto shadow-xl shadow-success/30 animate-in zoom-in duration-500">
                <Check className="w-10 h-10 text-success-foreground" strokeWidth={3} />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Payment Complete!</h3>
                <p className="text-muted-foreground text-sm font-medium">Order {orderComplete.orderNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border rounded-2xl p-4 shadow-sm">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Paid Amount</p>
                  <p className="text-xl font-black">${orderComplete.amountPaid.toFixed(2)}</p>
                </div>
                <div className="bg-card border rounded-2xl p-4 shadow-sm">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Change Due</p>
                  <p className="text-xl font-black text-success">${orderComplete.changeGiven.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button size="lg" className="h-12 text-base font-bold gap-2 rounded-xl" onClick={handlePrint}>
                  <Printer className="w-5 h-5" /> Print Receipt (F3)
                </Button>
                <Button size="lg" variant="outline" className="h-12 text-base font-bold rounded-xl" onClick={handleNewSale}>
                  Start New Sale (F4)
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-0">
              <div className="p-6 pb-0">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-2xl font-black tracking-tight">Checkout</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pb-8">
                  {/* Total display */}
                  <div className="bg-primary/5 rounded-3xl p-6 text-center border border-primary/10">
                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-1">Total Payable</p>
                    <p className="text-5xl font-black text-primary tracking-tight">${total.toFixed(2)}</p>
                  </div>

                  {/* Payment method */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Payment Method</p>
                      <Badge variant="outline" className="text-[10px] font-bold bg-muted/50 border-none capitalize">{paymentMethod}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => {
                            setPaymentMethod(value as any);
                            if (value !== "cash") setAmountPaid(total.toFixed(2));
                          }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${paymentMethod === value
                              ? "border-primary bg-primary/5 text-primary scale-105 shadow-md"
                              : "border-border hover:border-primary/30 bg-card"
                            }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount entry */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Add Payment</p>
                      <p className="text-xs font-bold text-primary">Remaining: {formatCurrency(Math.max(0, total - totalPaid))}</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-muted-foreground/50">$</span>
                        <Input
                          type="number"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          className="pl-9 h-12 text-xl font-black rounded-xl border-2 focus-visible:ring-primary/20"
                          placeholder={Math.max(0, total - payments.reduce((acc, p) => acc + parseFloat(p.amount), 0)).toFixed(2)}
                        />
                      </div>
                      <Button onClick={addPayment} className="h-12 px-6 rounded-xl font-bold">Add</Button>
                    </div>

                    {/* Payment list */}
                    {payments.length > 0 && (
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                        {payments.map((p, i) => (
                          <div key={i} className="flex items-center justify-between bg-muted/50 p-2.5 rounded-xl border border-dashed">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="capitalize">{p.method}</Badge>
                              <span className="text-sm font-bold">{formatCurrency(p.amount)}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removePayment(i)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick cash buttons */}
                    {paymentMethod === "cash" && (
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {[Math.ceil(total), 10, 20, 50, 100].filter(v => v >= (total - totalPaid + parseFloat(amountPaid || "0"))).slice(0, 4).map((v) => (
                          <Button key={v} variant="secondary" size="sm" className="h-10 rounded-xl font-bold text-xs" onClick={() => setAmountPaid(v.toFixed(2))}>
                            ${v}
                          </Button>
                        ))}
                        <Button variant="secondary" size="sm" className="h-10 rounded-xl font-bold text-xs" onClick={() => setAmountPaid(Math.max(0, total - payments.reduce((acc, p) => acc + parseFloat(p.amount), 0)).toFixed(2))}>
                          Exact
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-muted/30 border-t flex flex-col gap-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-muted-foreground">Total Paid:</span>
                  <span className="text-xl font-black text-primary">{formatCurrency(totalPaid)}</span>
                </div>
                <Button
                  className="w-full h-16 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  onClick={handleProcessPayment}
                  disabled={createOrder.isPending || (totalPaid < total - 0.01)}
                >
                  {createOrder.isPending ? "PROCESSING..." : `CONFIRM PAYMENT`}
                </Button>
                <Button variant="ghost" className="h-10 font-bold text-muted-foreground" onClick={() => { setCheckoutOpen(false); setOrderComplete(null); }} disabled={createOrder.isPending}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
