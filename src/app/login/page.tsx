"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/presentation/state/auth.context";
import { ApiError } from "@/domain/entities/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Lock, Loader2, KeyRound } from "lucide-react";
import { PasswordInput } from "@/presentation/components/shared/PasswordInput";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [isRecovering, setIsRecovering] = useState(false);

  const { login, recoverPassword, isAuthenticated, role, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Redireciona automaticamente se já estiver autenticado
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && role) {
      if (role.key === "admin-user") {
        router.replace("/admin/accounts");
      } else {
        router.replace("/user/account");
      }
    }
  }, [isAuthenticated, role, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const resolvedRole = await login({ username, password });
      toast.success("Login realizado com sucesso!");

      if (resolvedRole.key === "admin-user") {
        router.push("/admin/accounts");
      } else {
        router.push("/user/account");
      }
    } catch (error: unknown) {
      toast.error((error as ApiError).error || "Credenciais inválidas ou erro no servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecovering(true);
    try {
      await recoverPassword({ identifier: recoveryIdentifier, recovery_email: recoveryEmail });
      toast.success("Se os dados estiverem corretos, você receberá um e-mail em breve!");
      setIsRecoveryOpen(false);
    } catch (error: unknown) {
      toast.error((error as ApiError).error || "Erro ao solicitar recuperação.");
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-light/5 blur-[120px] rounded-full"></div>
      </div>

      <Card className="w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/5 bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="space-y-1 pt-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-brand-gold/10 rounded-3xl border border-brand-gold/20 shadow-xl shadow-brand-gold/5">
              <Mail className="w-12 h-12 text-brand-light" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black text-center text-white tracking-tighter">E-Mail</CardTitle>
          <CardDescription className="text-center text-slate-500 font-medium">
            Gerenciamento Seguro de Identidade
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6 px-10">
            <div className="space-y-3">
              <Label htmlFor="username" className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Usuário / Email</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-brand-light transition-colors" />
                <Input
                  id="username"
                  placeholder="exemplo@dominio.com"
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-12 bg-slate-950/50 border-slate-800 h-14 rounded-2xl text-white placeholder:text-slate-700 transition-all focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold/40"
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-500">Senha</Label>
                <button
                  type="button"
                  onClick={() => setIsRecoveryOpen(true)}
                  className="text-[10px] font-black uppercase tracking-wider text-brand-gold hover:text-brand-light transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-brand-light transition-colors z-10" />
                <PasswordInput
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 bg-slate-950/50 border-slate-800 h-14 rounded-2xl text-white placeholder:text-slate-700 transition-all focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold/40"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-10 pt-4">
            <Button
              className="w-full h-14 bg-gradient-to-r from-brand-gold to-brand-gold/80 hover:from-brand-gold/90 hover:to-brand-gold hover:opacity-90 text-white transition-all font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl shadow-brand-gold/20 active:scale-[0.98]"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Autenticando...</span>
                </div>
              ) : (
                "Acessar Sistema"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Recovery Dialog */}
      <Dialog open={isRecoveryOpen} onOpenChange={setIsRecoveryOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 rounded-[2rem] max-w-md p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
              <KeyRound className="w-6 h-6 text-brand-light" />
              Recuperar Acesso
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">
              Informe seu identificador e o e-mail de recuperação cadastrado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecover} className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Identificador (Login)</Label>
                <Input
                  placeholder="Nome do usuário ou email"
                  className="bg-slate-950 border-slate-800 h-12 rounded-xl text-white"
                  value={recoveryIdentifier}
                  onChange={(e) => setRecoveryIdentifier(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Email de Recuperação</Label>
                <Input
                  placeholder="Email extra inserido no cadastro"
                  type="email"
                  className="bg-slate-950 border-slate-800 h-12 rounded-xl text-white"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                className="text-slate-400 hover:text-white"
                onClick={() => setIsRecoveryOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="brand"
                disabled={isRecovering}
                className="font-bold text-xs uppercase tracking-widest px-8 rounded-xl"
              >
                {isRecovering ? "Enviando..." : "Enviar Nova Senha"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
