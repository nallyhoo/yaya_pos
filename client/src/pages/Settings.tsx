import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Store, Receipt, Percent, Shield, Bell, Languages } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: settings } = trpc.settings.getAll.useQuery();
  const utils = trpc.useUtils();

  const [storeForm, setStoreForm] = useState({
    storeName: "", storeAddress: "", storePhone: "", storeEmail: "",
    storeCurrency: "USD", storeTimezone: "UTC",
  });
  const [taxForm, setTaxForm] = useState({ defaultTaxRate: "0", taxName: "Tax", taxEnabled: true });
  const [receiptForm, setReceiptForm] = useState({
    receiptHeader: "", receiptFooter: "", showLogo: true,
    showTaxBreakdown: true, receiptWidth: "80",
  });
  const [notifForm, setNotifForm] = useState({ lowStockThreshold: "10", enableLowStockAlerts: true });
  const [locForm, setLocForm] = useState({ usdToKhrRate: "4100" });

  useEffect(() => {
    if (settings) {
      setStoreForm({
        storeName: settings.storeName ?? "YaYa Mart",
        storeAddress: settings.storeAddress ?? "",
        storePhone: settings.storePhone ?? "",
        storeEmail: settings.storeEmail ?? "",
        storeCurrency: settings.storeCurrency ?? "USD",
        storeTimezone: settings.storeTimezone ?? "UTC",
      });
      setTaxForm({
        defaultTaxRate: settings.defaultTaxRate ?? "0",
        taxName: settings.taxName ?? "Tax",
        taxEnabled: settings.taxEnabled === "false" ? false : true,
      });
      setReceiptForm({
        receiptHeader: settings.receiptHeader ?? "",
        receiptFooter: settings.receiptFooter ?? "Thank you for shopping at YaYa Mart!",
        showLogo: settings.showLogo === "false" ? false : true,
        showTaxBreakdown: settings.showTaxBreakdown === "false" ? false : true,
        receiptWidth: settings.receiptWidth ?? "80",
      });
      setNotifForm({
        lowStockThreshold: settings.lowStockThreshold ?? "10",
        enableLowStockAlerts: settings.enableLowStockAlerts === "false" ? false : true,
      });
      setLocForm({
        usdToKhrRate: settings.usdToKhrRate ?? "4100",
      });
    }
  }, [settings]);

  const updateSettings = trpc.settings.update.useMutation({
    onSuccess: () => { toast.success("Settings saved"); utils.settings.getAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSaveStore = () => updateSettings.mutate({ ...storeForm });
  const handleSaveTax = () => updateSettings.mutate({ ...taxForm });
  const handleSaveReceipt = () => updateSettings.mutate({ ...receiptForm });
  const handleSaveNotif = () => updateSettings.mutate({ lowStockThreshold: parseInt(notifForm.lowStockThreshold) });
  const handleSaveLoc = () => updateSettings.mutate({ ...locForm });

  if (!isAdmin) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[400px] text-muted-foreground gap-3">
        <Shield className="w-12 h-12 opacity-30" />
        <p className="font-medium">Admin access required</p>
        <p className="text-sm">Only administrators can access settings.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Configure your store and system preferences</p>
      </div>

      <Tabs defaultValue="store">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="store" className="gap-1.5 text-xs">
            <Store className="w-3.5 h-3.5" /> Store
          </TabsTrigger>
          <TabsTrigger value="localization" className="gap-1.5 text-xs">
            <Languages className="w-3.5 h-3.5" /> Locale
          </TabsTrigger>
          <TabsTrigger value="tax" className="gap-1.5 text-xs">
            <Percent className="w-3.5 h-3.5" /> Tax
          </TabsTrigger>
          <TabsTrigger value="receipt" className="gap-1.5 text-xs">
            <Receipt className="w-3.5 h-3.5" /> Receipt
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs">
            <Bell className="w-3.5 h-3.5" /> Alerts
          </TabsTrigger>
        </TabsList>

        {/* Store Info */}
        <TabsContent value="store" className="mt-4">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Store Information</CardTitle>
              <CardDescription>Basic information about your store displayed on receipts and reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Store Name</Label>
                  <Input className="mt-1" value={storeForm.storeName} onChange={(e) => setStoreForm((p) => ({ ...p, storeName: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input className="mt-1" value={storeForm.storeAddress} onChange={(e) => setStoreForm((p) => ({ ...p, storeAddress: e.target.value }))} placeholder="123 Main St, City, State" />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input className="mt-1" value={storeForm.storePhone} onChange={(e) => setStoreForm((p) => ({ ...p, storePhone: e.target.value }))} placeholder="+1 234 567 8900" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input className="mt-1" type="email" value={storeForm.storeEmail} onChange={(e) => setStoreForm((p) => ({ ...p, storeEmail: e.target.value }))} placeholder="store@example.com" />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input className="mt-1" value={storeForm.storeCurrency} onChange={(e) => setStoreForm((p) => ({ ...p, storeCurrency: e.target.value }))} placeholder="USD" />
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Input className="mt-1" value={storeForm.storeTimezone} onChange={(e) => setStoreForm((p) => ({ ...p, storeTimezone: e.target.value }))} placeholder="UTC" />
                </div>
              </div>
              <Button onClick={handleSaveStore} disabled={updateSettings.isPending} className="gap-2">
                <Save className="w-4 h-4" /> Save Store Info
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Localization */}
        <TabsContent value="localization" className="mt-4">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Localization & Currency</CardTitle>
              <CardDescription>Configure currency exchange rates and regional settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>USD to KHR Exchange Rate</Label>
                  <Input 
                    className="mt-1 font-mono" 
                    type="number" 
                    value={locForm.usdToKhrRate} 
                    onChange={(e) => setLocForm((p) => ({ ...p, usdToKhrRate: e.target.value }))} 
                    placeholder="4100" 
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider font-bold">Standard rate is usually 4000-4200 KHR</p>
                </div>
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex flex-col justify-center">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Conversion Preview</p>
                  <p className="text-xl font-black text-primary">
                    $1.00 = {new Intl.NumberFormat("km-KH", { style: "currency", currency: "KHR" }).format(parseFloat(locForm.usdToKhrRate || "0"))}
                  </p>
                </div>
              </div>
              <Button onClick={handleSaveLoc} disabled={updateSettings.isPending} className="gap-2">
                <Save className="w-4 h-4" /> Save Localization
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax */}
        <TabsContent value="tax" className="mt-4">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Tax Configuration</CardTitle>
              <CardDescription>Configure default tax rates applied to products at checkout.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                <div>
                  <p className="font-medium text-sm">Enable Tax Collection</p>
                  <p className="text-xs text-muted-foreground">Apply tax to all sales transactions</p>
                </div>
                <Switch checked={taxForm.taxEnabled} onCheckedChange={(v) => setTaxForm((p) => ({ ...p, taxEnabled: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tax Name</Label>
                  <Input className="mt-1" value={taxForm.taxName} onChange={(e) => setTaxForm((p) => ({ ...p, taxName: e.target.value }))} placeholder="Sales Tax, VAT, GST..." />
                </div>
                <div>
                  <Label>Default Tax Rate (%)</Label>
                  <Input className="mt-1" type="number" step="0.01" min="0" max="100" value={taxForm.defaultTaxRate} onChange={(e) => setTaxForm((p) => ({ ...p, defaultTaxRate: e.target.value }))} />
                </div>
              </div>
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm">
                <p className="font-medium text-primary">Current Rate Preview</p>
                <p className="text-muted-foreground mt-1">
                  On a $100.0 sale: <strong>{taxForm.taxName} = ${(100 * parseFloat(taxForm.defaultTaxRate || "0") / 100).toFixed(2)}</strong>
                  {" "}→ Total: <strong>${(100 + 100 * parseFloat(taxForm.defaultTaxRate || "0") / 100).toFixed(2)}</strong>
                </p>
              </div>
              <Button onClick={handleSaveTax} disabled={updateSettings.isPending} className="gap-2">
                <Save className="w-4 h-4" /> Save Tax Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipt */}
        <TabsContent value="receipt" className="mt-4">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Receipt Customization</CardTitle>
              <CardDescription>Customize how receipts look when printed or emailed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Receipt Header Text</Label>
                <Input className="mt-1" value={receiptForm.receiptHeader} onChange={(e) => setReceiptForm((p) => ({ ...p, receiptHeader: e.target.value }))} placeholder="Welcome to YaYa Mart!" />
              </div>
              <div>
                <Label>Receipt Footer Text</Label>
                <Input className="mt-1" value={receiptForm.receiptFooter} onChange={(e) => setReceiptForm((p) => ({ ...p, receiptFooter: e.target.value }))} placeholder="Thank you for your purchase!" />
              </div>
              <div>
                <Label>Receipt Width (mm)</Label>
                <Input className="mt-1" type="number" value={receiptForm.receiptWidth} onChange={(e) => setReceiptForm((p) => ({ ...p, receiptWidth: e.target.value }))} placeholder="80" />
              </div>
              <div className="space-y-3">
                {[
                  { key: "showLogo", label: "Show Store Logo", desc: "Display store logo at top of receipt" },
                  { key: "showTaxBreakdown", label: "Show Tax Breakdown", desc: "Display itemized tax on receipt" },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      checked={receiptForm[key as keyof typeof receiptForm] as boolean}
                      onCheckedChange={(v) => setReceiptForm((p) => ({ ...p, [key]: v }))}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveReceipt} disabled={updateSettings.isPending} className="gap-2">
                <Save className="w-4 h-4" /> Save Receipt Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Alerts & Notifications</CardTitle>
              <CardDescription>Configure system alerts and notification thresholds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                <div>
                  <p className="font-medium text-sm">Low Stock Alerts</p>
                  <p className="text-xs text-muted-foreground">Get notified when products fall below threshold</p>
                </div>
                <Switch checked={notifForm.enableLowStockAlerts} onCheckedChange={(v) => setNotifForm((p) => ({ ...p, enableLowStockAlerts: v }))} />
              </div>
              <div>
                <Label>Low Stock Threshold (units)</Label>
                <Input className="mt-1" type="number" min="1" value={notifForm.lowStockThreshold} onChange={(e) => setNotifForm((p) => ({ ...p, lowStockThreshold: e.target.value }))} />
                <p className="text-xs text-muted-foreground mt-1">Products with stock below this number will trigger alerts</p>
              </div>
              <Button onClick={handleSaveNotif} disabled={updateSettings.isPending} className="gap-2">
                <Save className="w-4 h-4" /> Save Alert Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Info */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "System", value: "YaYa Mart POS v1.0.0" },
              { label: "Logged in as", value: user?.name ?? "—" },
              { label: "Role", value: user?.role ?? "—" },
              { label: "Database", value: "Connected" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-secondary rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
