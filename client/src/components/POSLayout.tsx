import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Cog,
  Languages,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Truck,
  Users,
  UserSquare2,
  Warehouse,
} from "lucide-react";
import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useAuth } from "@/_core/hooks/useAuth";
import { useI18n } from "@/contexts/I18nContext";

interface POSLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/pos", label: "POS Terminal", icon: ShoppingCart },
  { path: "/products", label: "Products", icon: Package },
  { path: "/categories", label: "Categories", icon: Tag },
  { path: "/inventory", label: "Inventory", icon: Warehouse, allowedRoles: ['admin', 'manager'] },
  { path: "/suppliers", label: "Suppliers", icon: Truck, allowedRoles: ['admin', 'manager'] },
  { path: "/purchase-orders", label: "Purchase Orders", icon: ShoppingBag, allowedRoles: ['admin', 'manager'] },
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/orders", label: "Orders", icon: ClipboardList },
  { path: "/reports", label: "Reports", icon: BarChart3, allowedRoles: ['admin', 'manager'] },
  { path: "/employees", label: "Employees", icon: UserSquare2, allowedRoles: ['admin'] },
  { path: "/settings", label: "Settings", icon: Cog, allowedRoles: ['admin'] },
];

export default function POSLayout({ children, fullWidth }: POSLayoutProps) {
  const { user, loading, logout } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading YaYa Mart POS...</p>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "YM";

  const filteredNavItems = navItems.filter(item => 
    !item.allowedRoles || (user && item.allowedRoles.includes(user.role))
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out flex-shrink-0 ${collapsed ? "w-16" : "w-60"
          }`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-sidebar-border ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-bold text-sm leading-tight text-sidebar-foreground" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                YaYa Mart
              </p>
              <p className="text-xs text-sidebar-foreground/50">POS System</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
          {filteredNavItems.map(({ path, label, icon: Icon }) => {
            const isActive = path === "/" ? location === "/" : location.startsWith(path);
            const localizedLabel = t(`nav.${label.toLowerCase()}`);
            return (
              <Tooltip key={path} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link href={path}>
                    <div
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group ${isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                        } ${collapsed ? "justify-center" : ""}`}
                    >
                      <Icon className={`flex-shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"}`} />
                      {!collapsed && <span className="text-sm truncate">{localizedLabel}</span>}
                      {!collapsed && isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </Link>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">{localizedLabel}</TooltipContent>}
              </Tooltip>
            );
          })}
        </nav>

        {/* User profile + collapse */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg">
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.name ?? "User"}</p>
                <p className="text-xs text-sidebar-foreground/50 capitalize">{user?.role ?? "cashier"}</p>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setLanguage(language === "en" ? "km" : "en")}
            className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg cursor-pointer transition-all duration-150 text-sidebar-foreground/70 hover:bg-primary/10 hover:text-primary ${collapsed ? "justify-center" : ""}`}
          >
            <Languages className={`flex-shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"}`} />
            {!collapsed && <span className="text-sm font-medium">{language === "en" ? "Khmer" : "English"}</span>}
          </button>

          <button
            onClick={logout}
            className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg cursor-pointer transition-all duration-150 text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className={`flex-shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"}`} />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>

          <Button
            variant="ghost"
            size="sm"
            className={`w-full text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent ${collapsed ? "justify-center" : "justify-end"}`}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="text-xs ml-1">Collapse</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 overflow-auto ${fullWidth ? "" : ""}`}>
        {children}
      </main>
    </div>
  );
}
