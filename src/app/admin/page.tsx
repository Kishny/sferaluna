// src/app/admin/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Crown,
  Heart,
  MessageCircle,
  TrendingUp,
  ArrowLeft,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Star,
  AlertCircle,
  Loader2,
  BadgeCheck,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface AdminStats {
  users: {
    total: number;
    premium: number;
    activeSubscriptions: number;
    profilesCompleted: number;
    newToday: number;
    newLast7days: number;
    newLast30days: number;
    conversionRate: number;
  };
  matches: { total: number; active: number; last7days: number };
  messages: { total: number; last7days: number };
  planBreakdown: { plan: string; count: number }[];
}

interface AdminUser {
  _id: string;
  email: string;
  pseudonyme: string;
  plan: string;
  subscriptionStatus: string;
  isPremium: boolean;
  hasCompletedProfile: boolean;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  localisation?: string;
  age?: number;
}

type TabId = "stats" | "users" | "reports" | "testimonials";

interface AdminReport {
  _id: string;
  reporterId: { _id: string; pseudonyme: string; image?: string } | null;
  targetType: "user" | "message" | "community_post";
  targetId: { _id: string; pseudonyme?: string; image?: string } | null;
  reason: string;
  details?: string;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
}

const reasonLabel: Record<string, string> = {
  spam: "Spam",
  "harcèlement": "Harcèlement",
  "contenu_inapproprié": "Contenu inapproprié",
  "faux_profil": "Faux profil",
  autre: "Autre",
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const planEmoji: Record<string, string> = {
  free: "🌙",
  "essential-monthly": "⭐",
  "premium-monthly": "💎",
  "elite-monthly": "👑",
};

const planLabel: Record<string, string> = {
  free: "Gratuit",
  "essential-monthly": "Essentiel",
  "premium-monthly": "Premium",
  "elite-monthly": "Elite",
};

const statusColor: Record<string, string> = {
  active: "text-green-300 bg-green-400/10 border-green-400/20",
  trialing: "text-blue-300 bg-blue-400/10 border-blue-400/20",
  inactive: "text-white/40 bg-white/5 border-white/10",
  past_due: "text-orange-300 bg-orange-400/10 border-orange-400/20",
  canceled: "text-red-300 bg-red-400/10 border-red-400/20",
};

function formatDate(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR");
}

function formatNumber(n: number) {
  return n.toLocaleString("fr-FR");
}

// ─────────────────────────────────────────────
// Page Admin
// ─────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<TabId>("stats");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Témoignages
  const [testimonials, setTestimonials] = useState<{
    _id: string; authorName: string; age?: number; content: string;
    status: string; createdAt: string;
  }[]>([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(false);

  const fetchTestimonials = useCallback(async () => {
    setIsLoadingTestimonials(true);
    try {
      const res = await fetch("/api/admin/testimonials", { cache: "no-store" });
      const data = await res.json();
      if (data.success) setTestimonials(data.testimonials);
    } catch { /* silent */ } finally { setIsLoadingTestimonials(false); }
  }, []);

  const handleTestimonialAction = async (id: string, action: "approved" | "rejected" | "delete") => {
    setActionLoading(id + action);
    try {
      if (action === "delete") {
        await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
        setTestimonials(prev => prev.filter(t => t._id !== id));
      } else {
        const res = await fetch(`/api/admin/testimonials/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action }),
        });
        const data = await res.json();
        if (data.success) setTestimonials(prev => prev.map(t => t._id === id ? { ...t, status: action } : t));
      }
    } catch { /* silent */ } finally { setActionLoading(null); }
  };

  // Filtres users
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // ── Vérification rôle admin ──
  useEffect(() => {
    if (status === "unauthenticated") { router.push("/auth?mode=login"); return; }
  }, [status, router]);

  // ── Chargement stats ──
  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    setError("");
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) {
        if (res.status === 403) { router.push("/mon-compte"); return; }
        setError(data.error || "Erreur de chargement.");
        return;
      }
      setStats(data.stats);
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setIsLoadingStats(false);
    }
  }, [router]);

  // ── Chargement users ──
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search.length >= 2 && { search }),
        ...(planFilter !== "all" && { plan: planFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });
      const res = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
        setTotalUsers(data.pagination.total);
      }
    } catch {
      setError("Erreur de chargement des utilisateurs.");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [page, search, planFilter, statusFilter]);

  useEffect(() => { if (status === "authenticated") fetchStats(); }, [status, fetchStats]);
  useEffect(() => { if (status === "authenticated" && activeTab === "users") fetchUsers(); }, [status, activeTab, fetchUsers]);
  useEffect(() => { if (status === "authenticated" && activeTab === "testimonials") fetchTestimonials(); }, [status, activeTab, fetchTestimonials]);
  useEffect(() => { setPage(1); }, [search, planFilter, statusFilter]);

  // ── Action sur utilisateur ──
  const handleUserAction = async (userId: string, action: string) => {
    setActionLoading(userId + action);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) => u._id === userId ? { ...u, ...data.user } : u));
      } else {
        setError(data.error || "Action échouée.");
      }
    } catch {
      setError("Erreur lors de l'action.");
    } finally {
      setActionLoading(null);
    }
  };

  if (status === "loading" || isLoadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-purple-300 animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Chargement du dashboard admin…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
      {/* Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-pink-600/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 pb-16">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/mon-compte")}
              className="flex items-center gap-2 text-white/50 hover:text-white transition text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Mon compte
            </button>
            <div className="h-4 w-px bg-white/15" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center">
                <Star className="h-4 w-4 text-yellow-300" />
              </div>
              <div>
                <h1 className="font-bold leading-tight">Dashboard Admin</h1>
                <p className="text-xs text-white/40">SferaLuna — Vue d&apos;ensemble</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => { fetchStats(); if (activeTab === "users") fetchUsers(); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </motion.div>

        {/* ── Erreur globale ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-200 flex items-center gap-3 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
                <button onClick={() => setError("")} className="ml-auto text-red-300 hover:text-white">✕</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tabs ── */}
        <div className="mb-6 flex gap-2">
          {([
            { id: "stats", label: "📊 Statistiques" },
            { id: "users", label: "👥 Utilisateurs" },
            { id: "testimonials", label: "💬 Témoignages" },
          ] as { id: TabId; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-white/15 border border-white/20 text-white"
                  : "bg-white/5 border border-white/8 text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Onglet Statistiques ── */}
        {activeTab === "stats" && stats && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Cartes principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { emoji: "👤", label: "Utilisateurs", value: formatNumber(stats.users.total), sub: `+${stats.users.newLast7days} cette semaine`, color: "from-purple-500/20 to-purple-800/20", border: "border-purple-400/20" },
                { emoji: "👑", label: "Membres premium", value: formatNumber(stats.users.premium), sub: `${stats.users.conversionRate}% de conversion`, color: "from-yellow-500/15 to-amber-800/15", border: "border-yellow-400/20" },
                { emoji: "💞", label: "Matches actifs", value: formatNumber(stats.matches.active), sub: `${stats.matches.last7days} cette semaine`, color: "from-pink-500/15 to-rose-800/15", border: "border-pink-400/20" },
                { emoji: "💬", label: "Messages", value: formatNumber(stats.messages.total), sub: `${stats.messages.last7days} cette semaine`, color: "from-blue-500/15 to-indigo-800/15", border: "border-blue-400/20" },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className={`rounded-2xl border ${card.border} bg-gradient-to-br ${card.color} p-5`}
                >
                  <p className="text-2xl mb-2">{card.emoji}</p>
                  <p className="text-2xl font-bold mb-0.5">{card.value}</p>
                  <p className="text-xs text-white/50">{card.label}</p>
                  <p className="text-xs text-white/30 mt-1">{card.sub}</p>
                </motion.div>
              ))}
            </div>

            {/* Ligne 2 : inscriptions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { emoji: "📅", label: "Inscrits aujourd'hui", value: stats.users.newToday },
                { emoji: "📆", label: "Inscrits cette semaine", value: stats.users.newLast7days },
                { emoji: "🗓️", label: "Inscrits ce mois", value: stats.users.newLast30days },
              ].map((c, i) => (
                <div key={c.label} className="rounded-2xl border border-white/8 bg-white/5 p-5">
                  <p className="text-xl mb-2">{c.emoji}</p>
                  <p className="text-2xl font-bold">{formatNumber(c.value)}</p>
                  <p className="text-xs text-white/50 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            {/* Répartition des plans */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="font-bold mb-5 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-300" />
                Répartition des plans
              </h3>
              <div className="space-y-3">
                {stats.planBreakdown.map((p) => {
                  const pct = stats.users.total > 0 ? Math.round((p.count / stats.users.total) * 100) : 0;
                  return (
                    <div key={p.plan} className="flex items-center gap-3">
                      <span className="text-lg w-6 text-center">{planEmoji[p.plan] || "🌙"}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white/70">{planLabel[p.plan] || p.plan}</span>
                          <span className="font-semibold">{p.count} <span className="text-white/40 font-normal">({pct}%)</span></span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Autres stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { emoji: "✅", label: "Profils complétés", value: `${formatNumber(stats.users.profilesCompleted)} / ${formatNumber(stats.users.total)}`, pct: stats.users.total > 0 ? Math.round((stats.users.profilesCompleted / stats.users.total) * 100) : 0 },
                { emoji: "💳", label: "Abonnements actifs", value: `${formatNumber(stats.users.activeSubscriptions)}`, pct: stats.users.total > 0 ? Math.round((stats.users.activeSubscriptions / stats.users.total) * 100) : 0 },
                { emoji: "🔁", label: "Total matches", value: formatNumber(stats.matches.total), pct: null },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl border border-white/8 bg-white/5 p-5">
                  <p className="text-2xl mb-2">{c.emoji}</p>
                  <p className="text-xl font-bold">{c.value}</p>
                  <p className="text-xs text-white/50 mt-0.5">{c.label}</p>
                  {c.pct !== null && (
                    <p className="text-xs text-purple-300 mt-1">{c.pct}%</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Onglet Utilisateurs ── */}
        {activeTab === "users" && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Filtres */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher email, pseudo…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-400/50"
                />
              </div>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="all">Tous les plans</option>
                <option value="free">🌙 Gratuit</option>
                <option value="essential-monthly">⭐ Essentiel</option>
                <option value="premium-monthly">💎 Premium</option>
                <option value="elite-monthly">👑 Elite</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="trialing">Essai</option>
                <option value="inactive">Inactif</option>
                <option value="canceled">Annulé</option>
              </select>
            </div>

            {/* Compteur */}
            <p className="text-xs text-white/40">{formatNumber(totalUsers)} utilisateur{totalUsers !== 1 ? "s" : ""} trouvé{totalUsers !== 1 ? "s" : ""}</p>

            {/* Table */}
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              {isLoadingUsers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 text-purple-300 animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-white/40 text-sm">
                  Aucun utilisateur trouvé.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/8 text-white/40 text-xs">
                        <th className="px-4 py-3 text-left font-medium">Utilisateur</th>
                        <th className="px-4 py-3 text-left font-medium">Plan</th>
                        <th className="px-4 py-3 text-left font-medium">Statut</th>
                        <th className="px-4 py-3 text-left font-medium">Inscription</th>
                        <th className="px-4 py-3 text-left font-medium">Rôle</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <tr
                          key={u._id}
                          className={`border-b border-white/5 hover:bg-white/5 transition ${i % 2 === 0 ? "" : "bg-white/2"}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {u.pseudonyme.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate max-w-32">{u.pseudonyme}</p>
                                <p className="text-white/40 text-xs truncate max-w-32">{u.email}</p>
                              </div>
                              {u.hasCompletedProfile && (
                                <BadgeCheck className="h-4 w-4 text-green-400 flex-shrink-0" />
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="text-xs font-medium">
                              {planEmoji[u.plan] || "🌙"} {planLabel[u.plan] || u.plan}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full border ${statusColor[u.subscriptionStatus] || statusColor.inactive}`}>
                              {u.subscriptionStatus}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-white/50 text-xs">
                            {formatDate(u.createdAt)}
                          </td>

                          <td className="px-4 py-3">
                            {u.role === "admin" ? (
                              <span className="flex items-center gap-1 text-xs text-yellow-300">
                                <Star className="h-3 w-3" /> Admin
                              </span>
                            ) : (
                              <span className="text-xs text-white/40">User</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUserAction(u._id, "toggle_premium")}
                                disabled={actionLoading === u._id + "toggle_premium"}
                                title={u.isPremium ? "Révoquer premium" : "Activer premium"}
                                className={`p-1.5 rounded-lg border transition text-xs ${u.isPremium ? "bg-yellow-400/15 border-yellow-400/20 text-yellow-300 hover:bg-yellow-400/25" : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"}`}
                              >
                                {actionLoading === u._id + "toggle_premium"
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Crown className="h-3.5 w-3.5" />
                                }
                              </button>

                              <button
                                onClick={() => handleUserAction(u._id, u.role === "admin" ? "demote" : "promote")}
                                disabled={actionLoading === u._id + (u.role === "admin" ? "demote" : "promote")}
                                title={u.role === "admin" ? "Retirer admin" : "Promouvoir admin"}
                                className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition"
                              >
                                {actionLoading === u._id + (u.role === "admin" ? "demote" : "promote")
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Shield className="h-3.5 w-3.5" />
                                }
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/40">Page {page} / {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page <= 1 || isLoadingUsers}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-30 flex items-center gap-1 text-sm"
                  >
                    <ChevronLeft className="h-4 w-4" /> Préc.
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page >= totalPages || isLoadingUsers}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-30 flex items-center gap-1 text-sm"
                  >
                    Suiv. <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
        {/* ── Onglet Témoignages ── */}
        {activeTab === "testimonials" && (
          <motion.div key="testimonials" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/60 text-sm">{testimonials.length} témoignage(s) au total</p>
              <button onClick={fetchTestimonials} className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition">
                <RefreshCw className="h-3 w-3" /> Actualiser
              </button>
            </div>

            {isLoadingTestimonials && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 text-purple-300 animate-spin" />
              </div>
            )}

            {!isLoadingTestimonials && testimonials.length === 0 && (
              <div className="text-center py-16 text-white/40">Aucun témoignage pour l'instant.</div>
            )}

            {testimonials.map(t => (
              <div key={t._id} className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="font-medium text-white">{t.authorName}{t.age ? `, ${t.age} ans` : ''}</span>
                    <span className="ml-3 text-xs text-white/40">{formatDate(t.createdAt)}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${
                    t.status === 'approved' ? 'text-green-300 bg-green-400/10 border-green-400/20' :
                    t.status === 'rejected' ? 'text-red-300 bg-red-400/10 border-red-400/20' :
                    'text-yellow-300 bg-yellow-400/10 border-yellow-400/20'
                  }`}>
                    {t.status === 'approved' ? '✓ Approuvé' : t.status === 'rejected' ? '✕ Rejeté' : '⏳ En attente'}
                  </span>
                </div>
                <p className="text-white/70 text-sm leading-relaxed italic">« {t.content} »</p>
                <div className="flex gap-2 pt-1">
                  {t.status !== 'approved' && (
                    <button
                      onClick={() => handleTestimonialAction(t._id, 'approved')}
                      disabled={actionLoading === t._id + 'approved'}
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-medium hover:bg-green-500/30 transition disabled:opacity-50"
                    >
                      {actionLoading === t._id + 'approved' ? '…' : '✓ Approuver'}
                    </button>
                  )}
                  {t.status !== 'rejected' && (
                    <button
                      onClick={() => handleTestimonialAction(t._id, 'rejected')}
                      disabled={actionLoading === t._id + 'rejected'}
                      className="px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-medium hover:bg-orange-500/30 transition disabled:opacity-50"
                    >
                      {actionLoading === t._id + 'rejected' ? '…' : '✕ Rejeter'}
                    </button>
                  )}
                  <button
                    onClick={() => handleTestimonialAction(t._id, 'delete')}
                    disabled={actionLoading === t._id + 'delete'}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 text-xs font-medium hover:bg-red-500/30 transition disabled:opacity-50 ml-auto"
                  >
                    {actionLoading === t._id + 'delete' ? '…' : '🗑 Supprimer'}
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

      </div>
    </main>
  );
}
