import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, FileText, ClipboardCheck, Users, BarChart3 } from "lucide-react";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { role, signOut, user } = useAuth();
  const location = useLocation();

  const navItems = (() => {
    switch (role) {
      case "student":
        return [
          { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ];
      case "coordinator":
      case "admin":
        return [
          { to: "/dashboard", label: "Applications", icon: ClipboardCheck },
          { to: "/dashboard/reports", label: "Reports", icon: FileText },
          { to: "/dashboard/evaluations", label: "Evaluations", icon: Users },
          { to: "/dashboard/overview", label: "Overview", icon: BarChart3 },
        ];
      case "supervisor":
        return [
          { to: "/dashboard", label: "Evaluations", icon: ClipboardCheck },
        ];
      default:
        return [];
    }
  })();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              CSA
            </div>
            <span className="hidden sm:block text-lg font-semibold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Co-op Support
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-muted-foreground">
              {user?.email}
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
              {role}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
