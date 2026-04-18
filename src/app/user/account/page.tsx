"use client";

import { useEffect, useState } from "react";
import { AccountRepositoryImpl } from "@/data/repositories/account.repository.impl";
import { Account } from "@/domain/entities/account";
import { formatBytes } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Key, Mail, RefreshCw, User, Save, AtSign } from "lucide-react";
import { PasswordInput } from "@/presentation/components/shared/PasswordInput";

const accountRepo = new AccountRepositoryImpl();

export default function UserAccountPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Campos editáveis de perfil
  const [description, setDescription] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");

  // Campo de senha
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Estados de submissão
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const data = await accountRepo.getUserAccount();
        setAccount(data);
        setDescription(data.description || "");
        setRecoveryEmail(data.recovery_email || "");
      } catch {
        toast.error("Erro ao carregar dados da conta.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccount();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const updated = await accountRepo.updateUserAccount({
        description,
        recovery_email: recoveryEmail,
      });
      setAccount(updated);
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error(error.error || "Erro ao atualizar perfil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setIsSavingPassword(true);
    try {
      await accountRepo.updateUserAccount({ password: newPassword });
      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.error || "Erro ao alterar senha.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-500 opacity-50" />
        <span className="text-slate-500 font-medium">Carregando seu perfil...</span>
      </div>
    );
  }

  if (!account) return null;

  const usedPercent = Math.min((account.usedQuota / (account.quota || 1)) * 100, 100);

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row gap-10">

        {/* ── Coluna esquerda: Info + roles ── */}
        <div className="w-full lg:w-[340px] space-y-6 shrink-0">
          {/* Avatar + identidade */}
          <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden border">
            <CardContent className="pt-12 flex flex-col items-center pb-12 px-8">
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-5xl font-black text-white shadow-[0_20px_50px_rgba(59,130,246,0.3)] mb-8 transition-transform hover:scale-105 duration-500">
                {account.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-black text-white text-center tracking-tight leading-tight">
                {account.description || "Usuário de e-mail"}
              </h2>
              <p className="text-slate-500 text-sm font-bold mt-2 uppercase tracking-widest bg-slate-950/50 px-4 py-1.5 rounded-full border border-white/5">
                {account.name.split("@")[0]}
              </p>

              {/* Barra de armazenamento */}
              <div className="w-full mt-10 space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Armazenamento</span>
                  <span className="text-sm font-black text-blue-400">{usedPercent ? Math.round(usedPercent) : 0}%</span>
                </div>
                <div className="w-full h-4 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden p-1">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-1000"
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
                <div className="flex justify-center flex-col items-center gap-1 opacity-60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {account.usedQuota ? formatBytes(account.usedQuota) + ' em uso' : 'Sem uso'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    Limite total: {formatBytes(account.quota)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissões */}
          <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl rounded-[2rem] border overflow-hidden p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Permissões</h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              {account.roles?.map((role) => (
                <span
                  key={typeof role === "string" ? role : role.key}
                  className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg"
                >
                  {typeof role === "string" ? role : role.label}
                </span>
              ))}
            </div>
          </Card>

          {/* Aliases de e-mail */}
          <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl rounded-[2rem] border p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-300">Endereços</h3>
            </div>
            <div className="flex flex-col gap-2">
              {account.emails.map((email) => (
                <span
                  key={email}
                  className="bg-slate-950/50 border border-slate-800/60 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-default"
                >
                  {email}
                </span>
              ))}
              {account.emails.length === 0 && (
                <span className="text-slate-600 italic text-xs font-medium">Nenhum alias configurado</span>
              )}
            </div>
          </Card>
        </div>

        {/* ── Coluna direita: formulários ── */}
        <div className="flex-1 space-y-8 min-w-0">

          {/* Formulário de perfil */}
          <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl shadow-2xl rounded-[2.5rem] border overflow-hidden">
            <CardHeader className="p-10 pb-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-white tracking-tighter">Dados do Perfil</CardTitle>
                  <CardDescription className="text-slate-500 font-bold text-sm mt-1">
                    Nome de exibição e e-mail de recuperação de conta.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="p-10 space-y-6">
                {/* Username (readonly) */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                    Usuário (Login)
                  </Label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <Input
                      value={account.name}
                      readOnly
                      className="pl-12 bg-slate-950/30 border-slate-800/40 h-14 rounded-2xl text-slate-500 cursor-not-allowed select-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest ml-1">
                    O e-mail de login não pode ser alterado por aqui.
                  </p>
                </div>

                {/* Nome de exibição */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                    Nome de Exibição
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      placeholder="Seu nome completo"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="pl-12 bg-slate-950/50 border-slate-800 h-14 rounded-2xl text-white placeholder:text-slate-700 transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40"
                    />
                  </div>
                </div>

                {/* E-mail de recuperação */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                    E-mail de Recuperação
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                      type="email"
                      placeholder="seguranca@outro-dominio.com"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      className="pl-12 bg-slate-950/50 border-slate-800 h-14 rounded-2xl text-white placeholder:text-slate-700 transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40"
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest ml-1">
                    Usado para resetar a senha caso perca o acesso.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="p-10 pt-0">
                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl px-12 font-black uppercase tracking-[0.2em] text-xs shadow-[0_20px_40px_rgba(59,130,246,0.2)] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                >
                  {isSavingProfile ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Salvando...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Salvar Perfil</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Formulário de senha */}
          <Card className="bg-slate-900/40 border-slate-800/60 backdrop-blur-xl shadow-2xl rounded-[2.5rem] border overflow-hidden">
            <CardHeader className="p-10 pb-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-2xl">
                  <Key className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-white tracking-tighter">Segurança</CardTitle>
                  <CardDescription className="text-slate-500 font-bold text-sm mt-1 italic">
                    Altere sua senha de acesso ao sistema.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <form onSubmit={handleSavePassword}>
              <CardContent className="p-10 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                    Nova Senha
                  </Label>
                  <div className="relative group">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-amber-500 transition-colors z-10" />
                    <PasswordInput
                      placeholder="Digite uma senha forte e única"
                      className="bg-slate-950/80 border-slate-800 h-16 pl-14 rounded-2xl transition-all focus:ring-4 focus:ring-amber-500/10 text-white font-medium placeholder:text-slate-700"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 ml-1">
                    Confirmar Nova Senha
                  </Label>
                  <div className="relative group">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-amber-500 transition-colors z-10" />
                    <PasswordInput
                      placeholder="Repita a nova senha"
                      className="bg-slate-950/80 border-slate-800 h-16 pl-14 rounded-2xl transition-all focus:ring-4 focus:ring-amber-500/10 text-white font-medium placeholder:text-slate-700"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-400 font-bold ml-1">As senhas não coincidem.</p>
                  )}
                </div>

                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest ml-1">
                  Recomendamos: mínimo 12 caracteres, com símbolos e números.
                </p>
              </CardContent>
              <CardFooter className="p-10 pt-0">
                <Button
                  type="submit"
                  disabled={isSavingPassword || !newPassword || !confirmPassword}
                  className="h-14 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-2xl px-12 font-black uppercase tracking-[0.2em] text-xs shadow-[0_20px_40px_rgba(217,119,6,0.2)] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                >
                  {isSavingPassword ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Atualizando...</>
                  ) : (
                    <><Key className="w-4 h-4" /> Alterar Senha</>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>

        </div>
      </div>
    </div>
  );
}
