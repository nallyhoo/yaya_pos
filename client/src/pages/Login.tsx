import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShoppingCart, Loader2, Lock } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [openId, setOpenId] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      login(data.token);
      toast.success("Login successful");
      setLocation("/");
    },
    onError: (error) => {
      toast.error(error.message || "Invalid credentials");
    },
  });

  if (isAuthenticated) {
    setLocation("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openId || !password) {
      toast.error("Please enter both username and password");
      return;
    }
    loginMutation.mutate({ openId, password });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <ShoppingCart className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-black tracking-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
          YaYa Mart <span className="text-primary">POS</span>
        </span>
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="space-y-1 pb-8 pt-8 text-center bg-gradient-to-b from-primary/5 to-transparent">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black tracking-tight" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            Welcome Back
          </CardTitle>
          <CardDescription className="text-base font-medium">
            Enter your credentials to access the POS system
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="openId" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Username</Label>
              <Input
                id="openId"
                placeholder="admin"
                value={openId}
                onChange={(e) => setOpenId(e.target.value)}
                className="h-12 rounded-xl border-2 focus-visible:ring-primary/20 transition-all"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-2 focus-visible:ring-primary/20 transition-all"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-black rounded-xl mt-4 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                "LOGIN TO SYSTEM"
              )}
            </Button>
          </form>
          <div className="mt-8 pt-6 border-t border-dashed border-muted-foreground/20 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Demo Access Accounts</p>
            
            <div className="flex justify-between items-center bg-muted/50 p-2 rounded-lg">
              <div className="text-left">
                <p className="text-[10px] font-bold text-primary">ADMINISTRATOR</p>
                <p className="text-xs font-mono">user: <strong>admin</strong></p>
              </div>
              <p className="text-xs font-mono">pwd: <strong>admin123</strong></p>
            </div>

            <div className="flex justify-between items-center bg-muted/50 p-2 rounded-lg">
              <div className="text-left">
                <p className="text-[10px] font-bold text-blue-600">MANAGER</p>
                <p className="text-xs font-mono">user: <strong>sarah</strong></p>
              </div>
              <p className="text-xs font-mono">pwd: <strong>pos123</strong></p>
            </div>

            <div className="flex justify-between items-center bg-muted/50 p-2 rounded-lg">
              <div className="text-left">
                <p className="text-[10px] font-bold text-emerald-600">CASHIER</p>
                <p className="text-xs font-mono">user: <strong>mike</strong></p>
              </div>
              <p className="text-xs font-mono">pwd: <strong>pos123</strong></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
