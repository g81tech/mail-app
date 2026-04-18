"use client";

import { useAuth } from "@/presentation/state/auth.context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, logout, isLoading, greetingMessage } = useAuth();
  const router = useRouter();
  // Controla se o guard de role já resolveu — evita flash de conteúdo e chamadas duplicadas
  const [guardPassed, setGuardPassed] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (role?.key === "admin-user") {
      router.replace("/admin/accounts");
      return;
    }

    // Somente aqui é seguro renderizar o children
    setGuardPassed(true);
  }, [isAuthenticated, role, isLoading, router]);

  // Spinner enquanto carrega ou redireciona
  if (!guardPassed) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-blue-400">
        <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/20 blur-[150px] rounded-full"></div>
      </div>

      <header className="h-20 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl flex items-center justify-between px-8 md:px-12 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            {greetingMessage()}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Button variant="ghost" onClick={logout} className="text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest px-6 rounded-xl border border-white/5">
            <LogOut className="w-4 h-4 mr-2" />
            Desconectar
          </Button>
        </div>
      </header>
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}
