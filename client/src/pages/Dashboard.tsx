import { trpc } from "@/lib/trpc";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, ShoppingCart, Users, Package, AlertTriangle, ArrowUpRight, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import DashboardLayoutSkeleton from "@/components/DashboardLayoutSkeleton";

const CHART_COLORS = ["oklch(0.62 0.22 264)", "oklch(0.60 0.18 200)", "oklch(0.65 0.20 145)", "oklch(0.72 0.18 65)"];

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
}

export default function Dashboard() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayEnd = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);
  const monthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { data: todaySummary, isLoading: todayLoading } = trpc.reports.summary.useQuery({ from: today, to: todayEnd });
  const { data: monthSummary, isLoading: monthLoading } = trpc.reports.summary.useQuery({ from: monthStart, to: todayEnd });
  const { data: dailyData, isLoading: dailyLoading } = trpc.reports.daily.useQuery({ days: 14 });
  const { data: topProducts } = trpc.reports.topProducts.useQuery({ limit: 5 });
  const { data: paymentBreakdown } = trpc.reports.paymentBreakdown.useQuery({ from: monthStart, to: todayEnd });
  const { data: lowStock } = trpc.products.lowStock.useQuery();
  const { data: recentOrders } = trpc.orders.list.useQuery({ limit: 5 });

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
    })),
    [paymentBreakdown]
  );

  if (todayLoading || monthLoading || dailyLoading) {
    return <DashboardLayoutSkeleton />;
  }

  return (
    <div className="p-6 space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/pos">
          <Button className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Open POS Terminal
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Today's Revenue",
            value: formatCurrency(todaySummary?.totalRevenue ?? 0),
            sub: `${todaySummary?.totalOrders ?? 0} transactions`,
            icon: DollarSign,
            color: "text-primary",
            bg: "bg-primary/10",
          },
          {
            title: "Monthly Revenue",
            value: formatCurrency(monthSummary?.totalRevenue ?? 0),
            sub: `${monthSummary?.totalOrders ?? 0} orders`,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            title: "Avg. Order Value",
            value: formatCurrency(todaySummary?.avgOrderValue ?? 0),
            sub: "Today's average",
            icon: ShoppingCart,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            title: "Low Stock Items",
            value: String(lowStock?.length ?? 0),
            sub: "Need reorder",
            icon: AlertTriangle,
            color: lowStock && lowStock.length > 0 ? "text-amber-600" : "text-muted-foreground",
            bg: lowStock && lowStock.length > 0 ? "bg-amber-50" : "bg-muted",
          },
        ].map(({ title, value, sub, icon: Icon, color, bg }) => (
          <Card key={title} className="border border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <Card className="lg:col-span-2 border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Revenue (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.005 240)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid oklch(0.90 0.005 240)", fontSize: "12px" }}
                />
                <Bar dataKey="revenue" fill="oklch(0.50 0.22 264)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment breakdown */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieData.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-muted-foreground">{p.name}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(p.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Top Products</CardTitle>
            <Link href="/products">
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {topProducts && topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.productName}</p>
                      <p className="text-xs text-muted-foreground">{Number(p.totalQuantity)} units sold</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(p.totalRevenue))}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">No sales data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Orders</CardTitle>
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(Number(order.totalAmount))}</p>
                      <span className={order.status === "completed" ? "badge-success" : "badge-neutral"}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">No orders yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low stock alert */}
      {lowStock && lowStock.length > 0 && (
        <Card className="border border-amber-200 bg-amber-50/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Low Stock Alert ({lowStock.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStock.slice(0, 8).map((p) => (
                <Badge key={p.id} variant="outline" className="border-amber-300 text-amber-700 bg-white">
                  {p.name} — {p.stockQuantity} left
                </Badge>
              ))}
              {lowStock.length > 8 && (
                <Link href="/inventory">
                  <Badge variant="outline" className="border-amber-300 text-amber-700 bg-white cursor-pointer">
                    +{lowStock.length - 8} more
                  </Badge>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
