"use client";

import { useEffect, useState } from "react";
import { AccountRepositoryImpl } from "@/data/repositories/account.repository.impl";
import { Account } from "@/domain/entities/account";
import { formatBytes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  UserX,
  HardDrive,
  ShieldCheck,
  TrendingUp,
  Mail,
  Activity,
} from "lucide-react";
import Link from "next/link";

const accountRepo = new AccountRepositoryImpl();

interface Stats {
  total: number;
  active: number;
  suspended: number;
  admins: number;
  totalQuota: number;
  usedQuota: number;
  recentAccounts: Account[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [domain, setDomain] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        // Carrega até 100 contas para calcular as estatísticas
        const data = await accountRepo.listAccounts(1, 100);
        const accounts = data.items;

        const active = accounts.filter(a => a.status === "active").length;
        const suspended = accounts.filter(a => a.status !== "active").length;
        
        // Verifica se o usuário tem cargo de administrador ou moderador
        const admins = accounts.filter(a =>
          a.roles.some(r => {
            const roleKey = (typeof r === "string" ? r : r.key).toLowerCase();
            return roleKey === "moderator" || roleKey === "admin" || roleKey === "superadmin";
          })
        ).length;

        // Somatória validando se os valores existem
        const totalQuota = accounts.reduce((sum, a) => sum + (Number(a.quota) || 0), 0);
        const usedQuota = accounts.reduce((sum, a) => sum + (Number(a.usedQuota) || 0), 0);
        
        const recentAccounts = [...accounts].slice(0, 5);

        if (accounts[0]?.name) {
          setDomain(accounts[0].name.split("@")[1] || "");
        }

        setStats({
          total: data.total,
          active,
          suspended,
          admins,
          totalQuota,
          usedQuota,
          recentAccounts,
        });
      } catch (error) {
        console.error("Dashboard calculation error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 font-black uppercase tracking-widest text-[10px] animate-pulse">
          Carregando métricas...
        </span>
      </div>
    );
  }

  const usedPercent = stats
    ? Math.min((stats.usedQuota / (stats.totalQuota || 1)) * 100, 100)
    : 0;

  const cards = [
    {
      label: "Total de Contas",
      value: stats?.total ?? 0,
      icon: Users,
      color: "from-blue-600/10 to-indigo-600/10",
      border: "border-blue-500/20",
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
    },
    {
      label: "Contas Ativas",
      value: stats?.active ?? 0,
      icon: UserCheck,
      color: "from-emerald-600/10 to-teal-600/10",
      border: "border-emerald-500/20",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: "Suspensas",
      value: stats?.suspended ?? 0,
      icon: UserX,
      color: "from-red-600/10 to-rose-600/10",
      border: "border-red-500/20",
      iconColor: "text-red-400",
      iconBg: "bg-red-500/10",
    },
    {
      label: "Administradores",
      value: stats?.admins ?? 0,
      icon: ShieldCheck,
      color: "from-amber-600/10 to-orange-600/10",
      border: "border-amber-500/20",
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-brand-gold/10 rounded-3xl border border-brand-gold/20 shadow-xl shadow-brand-gold/5">
            <Activity className="w-10 h-10 text-brand-light" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Dashboard</h1>
            <p className="text-slate-500 mt-1 font-bold text-sm uppercase tracking-widest">
              {domain ? `Domínio: ${domain}` : "Visão geral do servidor"}
            </p>
          </div>
        </div>
        <Link
          href="/admin/accounts"
          className="inline-flex items-center gap-2 h-14 px-8 bg-brand-gold hover:bg-brand-gold/90 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_15px_30px_rgba(122,86,13,0.3)] transition-all active:scale-95"
        >
          <Users className="w-4 h-4" />
          Gerenciar Contas
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Card
            key={card.label}
            className={`bg-gradient-to-br ${card.color} border ${card.border} backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-xl`}
          >
            <CardContent className="p-8 flex items-center gap-6">
              <div className={`p-4 ${card.iconBg} rounded-2xl shrink-0`}>
                <card.icon className={`w-7 h-7 ${card.iconColor}`} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
                <p className="text-4xl font-black text-white mt-1 tracking-tighter">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Storage + recent accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Armazenamento */}
        <Card className="bg-slate-900/40 border-white/5 backdrop-blur-xl rounded-[2.5rem] border overflow-hidden shadow-2xl">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl">
                <HardDrive className="w-6 h-6 text-indigo-400" />
              </div>
              <CardTitle className="text-xl font-black text-white tracking-tight">Armazenamento Total</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {/* Barra de uso */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-slate-400 text-sm font-bold">{formatBytes(stats?.usedQuota ?? 0)} usados</span>
                <span className="text-brand-light font-black text-sm">{Math.round(usedPercent)}%</span>
              </div>
              <div className="w-full h-5 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden p-1">
                <div
                  className="h-full bg-gradient-to-r from-brand-gold via-brand-light to-brand-gold rounded-xl shadow-[0_0_15px_rgba(122,86,13,0.4)] transition-all duration-1000"
                  style={{ width: `${usedPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-600">
                <span>0</span>
                <span>Limite: {formatBytes(stats?.totalQuota ?? 0)}</span>
              </div>
            </div>

            {/* Cards de quota / usado */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950/50 rounded-2xl p-5 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Usado</p>
                <p className="text-2xl font-black text-white mt-1">{formatBytes(stats?.usedQuota ?? 0)}</p>
              </div>
              <div className="bg-slate-950/50 rounded-2xl p-5 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Disponível</p>
                <p className="text-2xl font-black text-white mt-1">
                  {formatBytes(Math.max((stats?.totalQuota ?? 0) - (stats?.usedQuota ?? 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contas recentes */}
        <Card className="bg-slate-900/40 border-white/5 backdrop-blur-xl rounded-[2.5rem] border overflow-hidden shadow-2xl">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-xl font-black text-white tracking-tight">Contas Recentes</CardTitle>
              </div>
              <Link href="/admin/accounts" className="text-[10px] font-black uppercase tracking-widest text-brand-gold hover:text-brand-light transition-colors">
                Ver todas →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-3">
            {stats?.recentAccounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center gap-4 p-4 bg-slate-950/30 rounded-2xl border border-white/5 hover:bg-white/[0.03] transition-all"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-black text-white text-sm shrink-0 border border-white/10">
                  {acc.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{acc.name}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                    {acc.description || "Sem descrição"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${acc.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${acc.status === "active" ? "text-emerald-500" : "text-red-500"}`}>
                    {acc.status === "active" ? "Ativo" : "Suspenso"}
                  </span>
                </div>
              </div>
            ))}
            {!stats?.recentAccounts.length && (
              <div className="flex flex-col items-center justify-center py-8 gap-2 opacity-30">
                <Mail className="w-10 h-10 text-slate-400" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Nenhuma conta encontrada</span>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
