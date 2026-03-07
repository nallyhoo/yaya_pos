import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./contexts/I18nContext";
import POSLayout from "./components/POSLayout";
import Dashboard from "./pages/Dashboard";
import POSTerminal from "./pages/POSTerminal";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Inventory from "./pages/Inventory";
import Suppliers from "./pages/Suppliers";
import PurchaseOrders from "./pages/PurchaseOrders";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Reports from "./pages/Reports";
import Employees from "./pages/Employees";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "@/pages/NotFound";
import { useAuth } from "./_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

function ProtectedRoute({ 
  children, 
  fullWidth = false, 
  allowedRoles 
}: { 
  children: React.ReactNode, 
  fullWidth?: boolean,
  allowedRoles?: string[]
}) {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Role check
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    setLocation("/404");
    return null;
  }

  return <POSLayout fullWidth={fullWidth}>{children}</POSLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/pos">
        <ProtectedRoute fullWidth>
          <POSTerminal />
        </ProtectedRoute>
      </Route>

      <Route path="/products">
        <ProtectedRoute>
          <Products />
        </ProtectedRoute>
      </Route>

      <Route path="/categories">
        <ProtectedRoute>
          <Categories />
        </ProtectedRoute>
      </Route>

      <Route path="/inventory">
        <ProtectedRoute allowedRoles={['admin', 'manager']}>
          <Inventory />
        </ProtectedRoute>
      </Route>

      <Route path="/suppliers">
        <ProtectedRoute allowedRoles={['admin', 'manager']}>
          <Suppliers />
        </ProtectedRoute>
      </Route>

      <Route path="/purchase-orders">
        <ProtectedRoute allowedRoles={['admin', 'manager']}>
          <PurchaseOrders />
        </ProtectedRoute>
      </Route>

      <Route path="/customers">
        <ProtectedRoute>
          <Customers />
        </ProtectedRoute>
      </Route>

      <Route path="/orders">
        <ProtectedRoute>
          <Orders />
        </ProtectedRoute>
      </Route>

      <Route path="/reports">
        <ProtectedRoute allowedRoles={['admin', 'manager']}>
          <Reports />
        </ProtectedRoute>
      </Route>

      <Route path="/employees">
        <ProtectedRoute allowedRoles={['admin']}>
          <Employees />
        </ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute allowedRoles={['admin']}>
          <Settings />
        </ProtectedRoute>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <I18nProvider>
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </TooltipProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
