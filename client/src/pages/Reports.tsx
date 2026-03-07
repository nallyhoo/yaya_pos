import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select2 } from "@/components/ui/select2";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, DollarSign, ShoppingCart, Package, BarChart3 } from "lucide-react";

const COLORS = ["oklch(0.50 0.22 264)", "oklch(0.60 0.18 200)", "oklch(0.65 0.20 145)", "oklch(0.72 0.18 65)", "oklch(0.60 0.22 25)"];

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

type Period = "7d" | "30d" | "90d";

export default function Reports() {
  const [period, setPeriod] = useState<Period>("30d");

  const { from, to } = useMemo(() => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date();
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }, [period]);

  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;

  const { data: summary } = trpc.reports.summary.useQuery({ from, to });
  const { data: dailyData } = trpc.reports.daily.useQuery({ days });
  const { data: topProducts } = trpc.reports.topProducts.useQuery({ limit: 10 });
  const { data: paymentBreakdown } = trpc.reports.paymentBreakdown.useQuery({ from, to });
  const { data: employees } = trpc.employees.list.useQuery();
  const { data: employeeStats } = trpc.reports.employeeStats.useQuery({ from, to });

  const chartData = useMemo(() =>
    (dailyData ?? []).map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: Number(d.revenue),
      orders: Number(d.orderCount),
    })),
    [dailyData]
  );

  const pieData = useMemo(() =>
    (paymentBreakdown ?? []).map((p) => ({
      name: p.paymentMethod.charAt(0).toUpperCase() + p.paymentMethod.slice(1),
      value: Number(p.total),
      count: Number(p.count),
    })),
    [paymentBreakdown]
  );

  const topProductsData = useMemo(() =>
    (topProducts ?? []).slice(0, 8).map((p) => ({
      name: p.productName.length > 15 ? p.productName.slice(0, 15) + "…" : p.productName,
      fullName: p.productName,
      qty: Number(p.totalQuantity),
      revenue: Number(p.totalRevenue),
    })),
    [topProducts]
  );

  const empStatsWithNames = useMemo(() =>
    (employeeStats ?? []).map((s) => ({
      name: employees?.find((e) => e.id === s.employeeId)?.name ?? `Emp #${s.employeeId}`,
      sales: Number(s.totalSales),
      orders: Number(s.orderCount),
    })),
    [employeeStats, employees]
  );

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>Reports</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Sales analytics and performance metrics</p>
        </div>
        <Select2
          options={[
            { value: "7d", label: "Last 7 days" },
            { value: "30d", label: "Last 30 days" },
            { value: "90d", label: "Last 90 days" },
          ]}
          value={period}
          onChange={(v) => setPeriod(v as Period)}
          className="w-40"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Revenue", value: formatCurrency(summary?.totalRevenue ?? 0), icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
          { title: "Total Orders", value: (summary?.totalOrders ?? 0).toString(), icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Avg. Order Value", value: formatCurrency(summary?.avgOrderValue ?? 0), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { title: "Tax Collected", value: formatCurrency(summary?.totalTax ?? 0), icon: BarChart3, color: "text-violet-600", bg: "bg-violet-50" },
        ].map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title} className="border border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
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

      {/* Revenue trend */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.005 240)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v: number, name: string) => [name === "revenue" ? formatCurrency(v) : v, name === "revenue" ? "Revenue" : "Orders"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid oklch(0.90 0.005 240)", fontSize: "12px" }} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="oklch(0.50 0.22 264)" strokeWidth={2.5} dot={false} name="Revenue" />
                <Line type="monotone" dataKey="orders" stroke="oklch(0.60 0.18 200)" strokeWidth={2} dot={false} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No data for this period</div>
          )}
        </CardContent>
      </Card>

      {/* Two column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Products by Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProductsData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.005 240)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={90} />
                  <Tooltip formatter={(v: number) => [v, "Units Sold"]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="qty" fill="oklch(0.50 0.22 264)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No sales data</div>
            )}
          </CardContent>
        </Card>

        {/* Payment methods */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Payment Method Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {pieData.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{p.name}</span>
                      <span className="font-medium ml-auto">{formatCurrency(p.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No payment data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Employee performance */}
      {empStatsWithNames.length > 0 && (
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Employee Sales Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-medium text-muted-foreground">Employee</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Total Sales</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Orders</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Avg. Order</th>
                  </tr>
                </thead>
                <tbody>
                  {empStatsWithNames.map((e) => (
                    <tr key={e.name} className="border-b border-border hover:bg-muted/30">
                      <td className="py-2.5 font-medium">{e.name}</td>
                      <td className="py-2.5 text-right font-semibold">{formatCurrency(e.sales)}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{e.orders}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{e.orders > 0 ? formatCurrency(e.sales / e.orders) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
