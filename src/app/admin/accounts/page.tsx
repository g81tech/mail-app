"use client";

import { useEffect, useState, useCallback } from "react";
import { AccountRepositoryImpl } from "@/data/repositories/account.repository.impl";
import { Account, CreateAccountPayload, Role, UpdateAccountPayload } from "@/domain/entities/account";
import { formatBytes, cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  Plus,
  Search,
  UserPlus,
  Mail,
  HardDrive,
  Trash2,
  Edit2,
  RefreshCw,
  Lock,
  Users,
  Eye,
  Shuffle,
  ShieldCheck,
  UserX,
  UserCheck,
  AlertTriangle,
  KeyRound
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PasswordInput } from "@/presentation/components/shared/PasswordInput";
import { Checkbox } from "@/components/ui/checkbox";

const accountRepo = new AccountRepositoryImpl();

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState({ page: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Create Form State
  const [newAccount, setNewAccount] = useState<CreateAccountPayload>({
    name: "",
    password: "",
    description: "",
    quota: 1024 * 1024 * 1024, // 1GB default
    emails: [],
    recovery_email: "",
    status: "active"
  });

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await accountRepo.listAccounts(page.page, 10);
      setAccounts(data.items);
      setTotal(data.total);
    } catch (error: any) {
      toast.error(error.error || "Erro ao carregar contas.");
    } finally {
      setIsLoading(false);
    }
  }, [page.page]);

  const fetchRoles = useCallback(async () => {
    try {
      const roles = await accountRepo.getRoles();
      setAvailableRoles(roles);
    } catch (error) {
      console.error("Erro ao carregar roles", error);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    fetchRoles();
  }, [fetchAccounts, fetchRoles]);

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let pass = "";
    for (let i = 0; i < 16; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (editingAccount) {
      // Logic for editing handled in its own state update
    } else {
      setNewAccount({ ...newAccount, password: pass });
    }
    toast.info("Senha aleatória gerada!");
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountRepo.createAccount(newAccount);
      toast.success("Conta criada com sucesso!");
      setIsCreateModalOpen(false);
      setNewAccount({
        name: "",
        password: "",
        description: "",
        quota: 1024 * 1024 * 1024,
        emails: [],
        recovery_email: "",
        status: "active"
      });
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.error || "Erro ao criar conta.");
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    try {
      const payload: UpdateAccountPayload = {
        description: editingAccount.description,
        quota: editingAccount.quota,
        emails: editingAccount.emails,
        status: editingAccount.status as any,
        recovery_email: editingAccount.recovery_email
      };

      await accountRepo.updateAccount(editingAccount.id, payload);
      toast.success("Conta atualizada com sucesso!");
      setIsEditModalOpen(false);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.error || "Erro ao atualizar conta.");
    }
  };

  const toggleStatus = async (account: Account) => {
    const newStatus = account.status === "active" ? "suspended" : "active";
    try {
      await accountRepo.updateAccount(account.id, { status: newStatus });
      toast.success(`Conta ${newStatus === "active" ? "reativada" : "desativada"} com sucesso!`);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.error || "Erro ao alterar status.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    try {
      await accountRepo.deleteAccount(accountToDelete.id);
      toast.success("Conta excluída permanentemente.");
      setIsDeleteModalOpen(false);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.error || "Erro ao excluir conta.");
    }
  };

  const handleResetPassword = async () => {
    if (!editingAccount) return;
    setIsResettingPassword(true);
    try {
      await accountRepo.resetPassword(editingAccount.id);
      toast.success("Senha resetada! O usuário receberá a nova senha no e-mail de recuperação.");
    } catch (error: any) {
      if (error.status === 422 || error.error?.includes("422") || error.error?.toLowerCase().includes("recupera")) {
        toast.error("Este usuário não possui e-mail de recuperação cadastrado.");
      } else {
        toast.error(error.error || "Erro ao resetar senha.");
      }
    } finally {
      setIsResettingPassword(false);
    }
  };

  const filteredAccounts = accounts.filter(acc =>
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-brand-gold/10 rounded-3xl border border-brand-gold/20 shadow-xl shadow-brand-gold/5">
            <Users className="w-10 h-10 text-brand-light" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Gestão de Identidades</h1>
            <p className="text-slate-500 mt-1 font-bold text-sm uppercase tracking-widest">{accounts[0]?.name.split('@')[1] || "Administração do Domínio"}</p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-brand-gold hover:bg-brand-gold/90 text-white shadow-[0_15px_30px_rgba(122,86,13,0.3)] h-16 px-10 rounded-2xl transition-all active:scale-95 font-black uppercase tracking-widest text-xs"
        >
          <UserPlus className="w-5 h-5 mr-3" />
          Novo Usuário
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-slate-900/40 border-white/5 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden border">
          <CardHeader className="border-b border-white/5 pb-10 pt-10 px-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-white tracking-tight">Base de Usuários</CardTitle>
                <CardDescription className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                  {total} contas registradas no cluster atual.
                </CardDescription>
              </div>
              <div className="relative w-full md:w-[400px] group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-brand-light transition-colors" />
                <Input
                  placeholder="Pesquisar por email ou nome..."
                  className="pl-14 h-14 bg-slate-950/80 border-slate-800 text-slate-200 focus:ring-4 focus:ring-brand-gold/10 focus:border-brand-gold/40 rounded-2xl transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/[0.02]">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-slate-500 py-6 px-10 font-black uppercase tracking-[0.2em] text-[10px]">Identidade</TableHead>
                  <TableHead className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Status</TableHead>
                  <TableHead className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Armazenamento</TableHead>
                  <TableHead className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Permissões</TableHead>
                  <TableHead className="text-slate-500 text-right pr-10 font-black uppercase tracking-[0.2em] text-[10px]">Gerenciar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-96 text-center">
                      <div className="flex flex-col items-center justify-center gap-6">
                        <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-slate-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Sincronizando com Servidor...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-96 text-center">
                      <div className="flex flex-col items-center justify-center gap-4 opacity-20">
                        <Users className="w-16 h-16 text-slate-100" />
                        <span className="text-slate-100 font-bold uppercase tracking-widest text-xs">Nenhum registro ativo</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id} className="border-white/5 hover:bg-white/[0.03] transition-all duration-500 group">
                      <TableCell className="py-8 px-10">
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-14 h-14 rounded-3xl bg-gradient-to-br border flex items-center justify-center font-black text-xl transition-all duration-500 shadow-2xl",
                            account.status === "active"
                              ? "from-slate-800 to-slate-900 border-white/10 text-brand-light group-hover:border-brand-gold/40 group-hover:scale-105"
                              : "from-red-950/20 to-red-900/10 border-red-500/10 text-red-500 grayscale"
                          )}>
                            {account.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col space-y-1">
                            <span className={cn("font-black tracking-tight transition-colors", account.status === "active" ? "text-white group-hover:text-brand-light" : "text-slate-600 line-through")}>
                              {account.name}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                              {account.description || "Sem descrição"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "px-4 py-1.5 rounded-xl font-black uppercase tracking-[0.15em] text-[8px] border",
                          account.status === "active"
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}>
                          {account.status === "active" ? "ATIVO" : "SUSPENSO"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-3 min-w-[220px]">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{account.usedQuota ? formatBytes(account.usedQuota) : 'Sem uso'}</span>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Limite {formatBytes(account.quota)}</span>
                          </div>
                          <div className="w-full h-3 bg-slate-950/50 rounded-full overflow-hidden p-[2px] border border-white/5">
                            <div
                              className={cn(
                                "h-full transition-all duration-1000 rounded-full",
                                (account.usedQuota / (account.quota || 1)) > 0.9
                                  ? "bg-gradient-to-r from-red-600 to-orange-500"
                                  : "bg-gradient-to-r from-brand-gold via-brand-light to-brand-gold shadow-[0_0_10px_rgba(122,86,13,0.3)] opacity-80"
                              )}
                              style={{ width: `${Math.min((account.usedQuota / (account.quota || 1)) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {account?.roles?.map(role => (
                            <Badge key={role.key} className="bg-slate-950/50 text-slate-400 border-white/5 px-3 py-1 text-[8px] uppercase font-black tracking-widest rounded-lg">
                              {role.label}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                className="h-12 w-12 p-0 hover:bg-white/5 rounded-2xl text-slate-500 hover:text-brand-light transition-all"
                              />
                            }
                          >
                            <MoreHorizontal className="h-6 w-6" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-slate-300 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] p-3 rounded-3xl min-w-[200px] border">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="px-3 py-3 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Acionáveis</DropdownMenuLabel>
                              <DropdownMenuItem className="rounded-2xl focus:bg-brand-gold focus:text-white px-4 py-3 cursor-pointer transition-all font-bold gap-3" onClick={() => { setEditingAccount(account); setIsEditModalOpen(true); }}>
                                <Edit2 className="w-4 h-4" /> <span>Editar Perfil</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-2xl focus:bg-slate-800 focus:text-white px-4 py-3 cursor-pointer transition-all font-bold gap-3" onClick={() => toggleStatus(account)}>
                                {account.status === "active" ? (
                                  <><UserX className="w-4 h-4" /> <span>Desativar</span></>
                                ) : (
                                  <><UserCheck className="w-4 h-4" /> <span>Ativar</span></>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator className="bg-white/5 my-3" />
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                className="rounded-2xl focus:bg-red-600 focus:text-white px-4 py-3 cursor-pointer transition-all text-red-500 font-bold gap-3"
                                onClick={() => { setAccountToDelete(account); setIsDeleteModalOpen(true); }}
                              >
                                <Trash2 className="w-4 h-4" /> <span>Remover</span>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-slate-950 border-white/5 text-slate-200 sm:max-w-xl backdrop-blur-3xl rounded-[2.5rem] shadow-2xl p-10">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black text-white px-1 tracking-tight">Expandir Rede</DialogTitle>
            <DialogDescription className="text-slate-500 font-bold text-sm tracking-tight px-1 italic">
              Configure uma nova identidade digital no servidor.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAccount} className="space-y-8 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">E-mail Principal</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-brand-light transition-colors" />
                    <Input
                      placeholder="usuario@dominio.com"
                      className="bg-slate-900 border-white/5 h-14 pl-12 rounded-2xl text-white font-medium"
                      required
                      value={newAccount.name}
                      onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Senha de Acesso</Label>
                  <div className="flex gap-2">
                    <PasswordInput
                      className="bg-slate-900 border-white/5 h-14 rounded-2xl flex-1 font-medium"
                      required
                      value={newAccount.password}
                      onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-14 w-14 rounded-2xl border border-white/5 text-brand-gold hover:bg-brand-gold/10"
                      onClick={generateRandomPassword}
                    >
                      <Shuffle className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">E-mail de Recuperação</Label>
                  <Input
                    placeholder="seguranca@backup.com"
                    type="email"
                    className="bg-slate-900 border-white/5 h-14 rounded-2xl text-white font-medium"
                    value={newAccount.recovery_email}
                    onChange={(e) => setNewAccount({ ...newAccount, recovery_email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Quota (GB)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder="1"
                        className="bg-slate-900 border-white/5 h-14 rounded-2xl text-white font-medium pr-16"
                        onChange={(e) => setNewAccount({ ...newAccount, quota: Math.round((parseFloat(e.target.value) || 1) * 1024 * 1024 * 1024) })}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-black uppercase">GB</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Nome Completo</Label>
                    <Input
                      placeholder="João Silva"
                      className="bg-slate-900 border-white/5 h-14 rounded-2xl text-white font-medium"
                      value={newAccount.description}
                      onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-8 flex-col sm:flex-row gap-4 border-t border-white/5">
              <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)} className="rounded-2xl h-14 flex-1 font-black uppercase tracking-widest text-xs text-slate-500">Descartar</Button>
              <Button type="submit" variant="brandStrong" className="h-14 flex-1 font-black uppercase tracking-widest text-xs">Finalizar Registro</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-slate-950 border-white/5 text-slate-200 sm:max-w-2xl backdrop-blur-3xl rounded-[2.5rem] p-0 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header fixo */}
          <DialogHeader className="px-10 pt-10 pb-6 border-b border-white/5 shrink-0">
            <DialogTitle className="text-3xl font-black text-white px-1">Configurações Avançadas</DialogTitle>
            <DialogDescription className="text-slate-500 font-bold px-1 italic">Editando: {editingAccount?.name}</DialogDescription>
          </DialogHeader>

          {/* Corpo scrollável */}
          <form onSubmit={handleUpdateAccount} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nome para Exibição</Label>
                    <Input
                      value={editingAccount?.description || ""}
                      onChange={(e) => setEditingAccount(editingAccount ? { ...editingAccount, description: e.target.value } : null)}
                      className="bg-slate-900 border-white/5 h-14 rounded-2xl"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">E-mail de Recuperação</Label>
                    <Input
                      value={editingAccount?.recovery_email || ""}
                      onChange={(e) => setEditingAccount(editingAccount ? { ...editingAccount, recovery_email: e.target.value } : null)}
                      className="bg-slate-900 border-white/5 h-14 rounded-2xl"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Quota de Disco (GB)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={editingAccount ? parseFloat(((editingAccount.quota || 0) / (1024 ** 3)).toFixed(2)) : 0}
                        onChange={(e) => setEditingAccount(editingAccount ? { ...editingAccount, quota: Math.round(parseFloat(e.target.value || "0") * 1024 * 1024 * 1024) } : null)}
                        className="bg-slate-900 border-white/5 h-14 rounded-2xl pr-16"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-black uppercase">GB</span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-bold uppercase italic">Armazenado: {formatBytes(editingAccount?.quota || 0)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Permissões de Acesso</Label>
                  <div className="grid grid-cols-1 gap-3 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                    {availableRoles.map(role => (
                      <div key={role.key} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <Checkbox
                          id={`role-${role.key}`}
                          checked={editingAccount?.roles.some(r => r.key === role.key)}
                          onCheckedChange={(checked) => {
                            if (!editingAccount) return;
                            const newRoles = checked
                              ? [...editingAccount.roles, role]
                              : editingAccount.roles.filter(r => r.key !== role.key);
                            setEditingAccount({ ...editingAccount, roles: newRoles });
                          }}
                          className="border-brand-gold h-5 w-5 rounded-md"
                        />
                        <Label htmlFor={`role-${role.key}`} className="text-sm font-bold text-slate-300 capitalize cursor-pointer">{role.label}</Label>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex flex-col items-start gap-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status Operacional</Label>
                    <Button
                      type="button"
                      variant={editingAccount?.status === "active" ? "gold" : "destructive"}
                      onClick={() => setEditingAccount(editingAccount ? { ...editingAccount, status: editingAccount.status === "active" ? "suspended" : "active" } : null)}
                      className="h-14 w-full rounded-2xl font-black uppercase tracking-widest text-xs"
                    >
                      {editingAccount?.status === "active" ? (
                        <><UserCheck className="w-4 h-4 mr-2" /> Conta Ativa</>
                      ) : (
                        <><UserX className="w-4 h-4 mr-2" /> Conta Suspensa</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Reset de Senha */}
              <div className="border-t border-white/5 pt-6 space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Redefinição de Senha</Label>
                <div className="flex items-center gap-4 p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl shrink-0">
                    <KeyRound className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-300">Resetar Senha</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">Gera uma senha aleatória e envia para o e-mail de recuperação do usuário.</p>
                  </div>
                  <Button
                    type="button"
                    disabled={isResettingPassword}
                    onClick={handleResetPassword}
                    className="h-11 px-6 rounded-2xl font-black text-xs uppercase tracking-widest bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    {isResettingPassword ? (
                      <><RefreshCw className="w-4 h-4 animate-spin mr-2" />Enviando...</>
                    ) : (
                      <><KeyRound className="w-4 h-4 mr-2" />Resetar</>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer fixo */}
            <DialogFooter className="px-10 py-6 border-t border-white/5 shrink-0 gap-4">
              <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)} className="h-14 flex-1 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500">Cancelar</Button>
              <Button type="submit" variant="brandStrong" className="h-14 flex-1 rounded-2xl font-black text-xs uppercase tracking-widest">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-slate-950 border-red-500/20 text-slate-200 sm:max-w-md backdrop-blur-3xl rounded-[2rem] p-10 text-center">
          <div className="flex justify-center mb-6 text-red-500">
            <div className="p-5 bg-red-500/10 rounded-full animate-pulse">
              <AlertTriangle className="w-12 h-12" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-black text-white">Exclusão Irreversível</DialogTitle>
          <DialogDescription className="text-slate-500 font-bold mt-4 leading-relaxed">
            Você está prestes a apagar permanentemente a conta <span className="text-white font-black">{accountToDelete?.name}</span>.
            <br /><br />
            <span className="bg-red-500/10 text-red-400 p-3 rounded-xl block border border-red-500/20 text-xs">
              TODOS os e-mails, pastas e configurações serão removidos do servidor e não poderão ser recuperados.
            </span>
          </DialogDescription>
          <DialogFooter className="pt-10 flex-col sm:flex-row gap-4">
            <Button variant="ghost" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-red-600 hover:bg-red-500" onClick={handleDeleteAccount}>Confirmar Exclusão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
