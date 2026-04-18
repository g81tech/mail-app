"use client";

import { useAuth } from "@/presentation/state/auth.context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Users,
  LayoutDashboard,
  LogOut,
  Mail,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
  { icon: Users, label: "Contas", href: "/admin/accounts" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, logout, isLoading, greetingMessage } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [guardPassed, setGuardPassed] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || role?.key !== "admin-user") {
      router.replace("/login");
      return;
    }

    setGuardPassed(true);
  }, [isAuthenticated, role, isLoading, router]);

  if (!guardPassed) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-blue-400 font-semibold text-lg">Carregando permissões...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-md hidden md:flex flex-col">
        <div className="p-6">
          <Link href="/admin/accounts" className="flex items-center gap-2 mb-8 px-2 transition-transform hover:scale-[1.02]">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/30">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              {greetingMessage()} Admin
            </span>
          </Link>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                    isActive
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-100")} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-slate-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-400/10 gap-3 rounded-xl"
            onClick={logout}
          >
            <LogOut className="w-5 h-5" />
            Sair do Painel
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-sm flex items-center justify-between px-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
            {menuItems.find(m => m.href === pathname)?.label || "Administração"}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center p-[1px]">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-300 pr-1 tracking-wide">ADMINISTRADOR</span>
            </div>
          </div>
        </header>

        {/* Scrollable area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto animate-in fade-in duration-700 slide-in-from-bottom-2">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
