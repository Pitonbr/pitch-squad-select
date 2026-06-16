import { NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Tag,
  BarChart3,
  Image,
  LogOut,
  ShieldCheck,
  TrendingUp,
  Menu,
  X,
  Crown,
} from "lucide-react";
import { useState } from "react";

const nav = [
  { to: "/admin",           label: "Dashboard",    icon: LayoutDashboard, end: true },
  { to: "/admin/users",     label: "Usuários",     icon: Users },
  { to: "/admin/announcements", label: "Comunicados", icon: Megaphone },
  { to: "/admin/coupons",   label: "Cupons",       icon: Tag },
  { to: "/admin/campaigns", label: "Campanhas",    icon: TrendingUp },
  { to: "/admin/banners",   label: "Banners",      icon: Image },
  { to: "/admin/financial", label: "Financeiro",   icon: BarChart3 },
  { to: "/admin/managers",  label: "Gestores",     icon: Crown },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { signOut } = useAdminAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-none">Admin Panel</p>
          <p className="text-slate-500 text-xs mt-0.5">Soccer Squad</p>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <Separator className="bg-slate-800 mb-4" />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full justify-start gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="h-4 w-4" />
          Sair do painel
        </Button>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-slate-900 border-r border-slate-800">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-slate-900 border-r border-slate-800">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-slate-800 flex items-center px-4 lg:px-6 gap-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(true)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex-1" />
          <span className="text-xs text-slate-500 font-mono">alexpiton@gmail.com</span>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
