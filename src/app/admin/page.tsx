// src/app/admin/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Star,
  Trash2,
  TrendingUp,
} from "lucide-react";

/**
 * Dashboard Admin SferaLuna.
 *
 * Version mobile améliorée :
 * - tabs scrollables sur mobile ;
 * - cartes statistiques compactes ;
 * - utilisateurs affichés en cards sur mobile ;
 * - table conservée sur desktop ;
 * - signalements / témoignages en cards compactes ;
 * - filtres responsives.
 */

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
  identityVerified: boolean;
  identityVerificationStatus: string;
}

type TabId = "stats" | "users" | "reports" | "testimonials" | "tools";

type ResetTarget = "messages" | "matches" | "visits" | "posts" | "journal";

const resetTargets: {
  id: ResetTarget;
  label: string;
  description: string;
  confirmMessage: string;
}[] = [
  {
    id: "messages",
    label: "Messages",
    description: "Supprime tous les messages échangés entre les membres.",
    confirmMessage:
      "Supprimer définitivement TOUS les messages du site ? Cette action est irréversible.",
  },
  {
    id: "matches",
    label: "Matchs & likes",
    description: "Supprime tous les matchs et tous les likes enregistrés.",
    confirmMessage:
      "Supprimer définitivement TOUS les matchs et likes du site ? Cette action est irréversible.",
  },
  {
    id: "visits",
    label: "Visites de profil",
    description: "Supprime l'historique des visites de profil.",
    confirmMessage:
      "Supprimer définitivement TOUTES les visites de profil ? Cette action est irréversible.",
  },
  {
    id: "posts",
    label: "Posts (VibeSphere / Communauté / VibeMentor)",
    description: "Supprime tous les posts publiés sur ces 3 espaces.",
    confirmMessage:
      "Supprimer définitivement TOUS les posts VibeSphere, Communauté et VibeMentor ? Cette action est irréversible.",
  },
  {
    id: "journal",
    label: "Journal émotionnel",
    description: "Supprime toutes les entrées de journal de toutes les utilisatrices.",
    confirmMessage:
      "Supprimer définitivement TOUTES les entrées de journal émotionnel ? Cette action est irréversible.",
  },
];

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
  harcèlement: "Harcèlement",
  contenu_inapproprié: "Contenu inapproprié",
  faux_profil: "Faux profil",
  autre: "Autre",
};

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

export default function AdminPage() {
  const router = useRouter();
  const { status } = useSession();

  const [activeTab, setActiveTab] = useState<TabId>("stats");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const [testimonials, setTestimonials] = useState<
    {
      _id: string;
      authorName: string;
      age?: number;
      content: string;
      status: string;
      createdAt: string;
    }[]
  >([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(false);

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
      return;
    }
    // Vérifier le rôle côté client : si non-admin → rediriger vers accueil
    if (status === "authenticated") {
      fetch("/api/admin/stats", { cache: "no-store" }).then((res) => {
        if (res.status === 403) router.replace("/");
      });
    }
  }, [status, router]);

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    setError("");

    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const data = await res.json();

      if (!data.success) {
        if (res.status === 403) {
          router.push("/mon-compte");
          return;
        }

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

      const res = await fetch(`/api/admin/users?${params}`, {
        cache: "no-store",
      });

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

  const fetchReports = useCallback(async () => {
    setIsLoadingReports(true);

    try {
      const res = await fetch("/api/admin/reports");
      const data = await res.json();

      if (data.reports) setReports(data.reports);
    } catch {
      // Silence volontaire.
    } finally {
      setIsLoadingReports(false);
    }
  }, []);

  const fetchTestimonials = useCallback(async () => {
    setIsLoadingTestimonials(true);

    try {
      const res = await fetch("/api/admin/testimonials", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) setTestimonials(data.testimonials);
    } catch {
      // Silence volontaire.
    } finally {
      setIsLoadingTestimonials(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchStats();
  }, [status, fetchStats]);

  useEffect(() => {
    if (status === "authenticated" && activeTab === "users") fetchUsers();
  }, [status, activeTab, fetchUsers]);

  useEffect(() => {
    if (status === "authenticated" && activeTab === "testimonials") {
      fetchTestimonials();
    }
  }, [status, activeTab, fetchTestimonials]);

  useEffect(() => {
    if (status === "authenticated" && activeTab === "reports") fetchReports();
  }, [status, activeTab, fetchReports]);

  useEffect(() => {
    setPage(1);
  }, [search, planFilter, statusFilter]);

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
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, ...data.user } : u))
        );
      } else {
        setError(data.error || "Action échouée.");
      }
    } catch {
      setError("Erreur lors de l'action.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBan = async (userId: string, pseudonyme: string) => {
    if (!confirm(`Bannir ${pseudonyme} ? Cette action désactivera son compte.`)) {
      return;
    }

    setActionLoading("ban-" + userId);

    try {
      await fetch(`/api/admin/users/${userId}/ban`, { method: "POST" });
      fetchReports();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, pseudonyme: string) => {
    if (
      !confirm(
        `Supprimer définitivement ${pseudonyme} ? Cette action est irréversible : son profil, ses likes, matchs, messages, visites, vibes, posts et son abonnement seront supprimés. Les statistiques du site se mettront à jour automatiquement.`
      )
    ) {
      return;
    }

    setActionLoading(userId + "delete");

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        setTotalUsers((prev) => Math.max(prev - 1, 0));
      } else {
        setError(data.error || "Suppression échouée.");
      }
    } catch {
      setError("Erreur lors de la suppression.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetData = async (target: ResetTarget, confirmMessage: string) => {
    if (!confirm(confirmMessage)) return;

    setActionLoading("reset-" + target);
    setResetMessage(null);

    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });

      const data = await res.json();

      if (data.success) {
        setResetMessage(
          `${data.label} : ${data.deletedCount} document(s) supprimé(s).`
        );
        fetchStats();
      } else {
        setError(data.error || "Reset échoué.");
      }
    } catch {
      setError("Erreur lors du reset.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveReport = async (
    reportId: string,
    action: "reviewed" | "dismissed"
  ) => {
    setActionLoading(reportId + action);

    try {
      await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });

      fetchReports();
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestimonialAction = async (
    id: string,
    action: "approved" | "rejected" | "delete"
  ) => {
    setActionLoading(id + action);

    try {
      if (action === "delete") {
        await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
        setTestimonials((prev) => prev.filter((t) => t._id !== id));
      } else {
        const res = await fetch(`/api/admin/testimonials/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: action }),
        });

        const data = await res.json();

        if (data.success) {
          setTestimonials((prev) =>
            prev.map((t) => (t._id === id ? { ...t, status: action } : t))
          );
        }
      }
    } catch {
      // Silence volontaire.
    } finally {
      setActionLoading(null);
    }
  };

  if (status === "loading" || isLoadingStats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-purple-300" />
          <p className="text-sm text-white/50">
            Chargement du dashboard admin…
          </p>
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "stats", label: "📊 Stats" },
    { id: "users", label: "👥 Users" },
    { id: "reports", label: "🚨 Reports" },
    { id: "testimonials", label: "💬 Avis" },
    { id: "tools", label: "🛠 Outils" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-pink-600/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-3 py-5 pb-12 sm:px-4 sm:py-8 sm:pb-16">
        {/* Header compact */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:mb-8 sm:flex sm:items-center sm:justify-between"
        >
          <div>
            <button
              onClick={() => router.push("/mon-compte")}
              className="mb-3 flex items-center gap-2 text-xs text-white/50 transition hover:text-white sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Mon compte
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-yellow-400/30 bg-yellow-400/20">
                <Star className="h-4 w-4 text-yellow-300" />
              </div>

              <div>
                <h1 className="font-bold leading-tight">Dashboard Admin</h1>
                <p className="text-xs text-white/40">
                  SferaLuna — Vue d&apos;ensemble
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              fetchStats();
              if (activeTab === "users") fetchUsers();
              if (activeTab === "reports") fetchReports();
              if (activeTab === "testimonials") fetchTestimonials();
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white sm:mt-0 sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </button>
        </motion.header>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex items-center gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="flex-1">{error}</span>

                <button
                  onClick={() => setError("")}
                  className="text-red-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs mobile scroll */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 sm:mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
                activeTab === tab.id
                  ? "border-white/20 bg-white/15 text-white"
                  : "border-white/8 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        {activeTab === "stats" && stats && (
          <motion.section
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {[
                {
                  emoji: "👤",
                  label: "Utilisateurs",
                  value: formatNumber(stats.users.total),
                  sub: `+${stats.users.newLast7days} cette semaine`,
                  color: "from-purple-500/20 to-purple-800/20",
                  border: "border-purple-400/20",
                },
                {
                  emoji: "👑",
                  label: "Premium",
                  value: formatNumber(stats.users.premium),
                  sub: `${stats.users.conversionRate}% conversion`,
                  color: "from-yellow-500/15 to-amber-800/15",
                  border: "border-yellow-400/20",
                },
                {
                  emoji: "💞",
                  label: "Matches actifs",
                  value: formatNumber(stats.matches.active),
                  sub: `${stats.matches.last7days} cette semaine`,
                  color: "from-pink-500/15 to-rose-800/15",
                  border: "border-pink-400/20",
                },
                {
                  emoji: "💬",
                  label: "Messages",
                  value: formatNumber(stats.messages.total),
                  sub: `${stats.messages.last7days} cette semaine`,
                  color: "from-blue-500/15 to-indigo-800/15",
                  border: "border-blue-400/20",
                },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl border ${card.border} bg-gradient-to-br ${card.color} p-3 sm:p-5`}
                >
                  <p className="mb-1 text-xl sm:text-2xl">{card.emoji}</p>
                  <p className="text-xl font-bold sm:text-2xl">{card.value}</p>
                  <p className="text-[11px] text-white/50 sm:text-xs">
                    {card.label}
                  </p>
                  <p className="mt-1 text-[10px] text-white/30 sm:text-xs">
                    {card.sub}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
              {[
                {
                  emoji: "📅",
                  label: "Aujourd'hui",
                  value: stats.users.newToday,
                },
                {
                  emoji: "📆",
                  label: "Cette semaine",
                  value: stats.users.newLast7days,
                },
                {
                  emoji: "🗓️",
                  label: "Ce mois",
                  value: stats.users.newLast30days,
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className="rounded-2xl border border-white/8 bg-white/5 p-4 sm:p-5"
                >
                  <p className="mb-1 text-xl">{c.emoji}</p>
                  <p className="text-2xl font-bold">{formatNumber(c.value)}</p>
                  <p className="mt-0.5 text-xs text-white/50">{c.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
              <h3 className="mb-4 flex items-center gap-2 font-bold">
                <TrendingUp className="h-5 w-5 text-purple-300" />
                Répartition des plans
              </h3>

              <div className="space-y-3">
                {stats.planBreakdown.map((p) => {
                  const pct =
                    stats.users.total > 0
                      ? Math.round((p.count / stats.users.total) * 100)
                      : 0;

                  return (
                    <div key={p.plan} className="flex items-center gap-3">
                      <span className="w-6 text-center text-lg">
                        {planEmoji[p.plan] || "🌙"}
                      </span>

                      <div className="flex-1">
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-white/70">
                            {planLabel[p.plan] || p.plan}
                          </span>

                          <span className="font-semibold">
                            {p.count}{" "}
                            <span className="font-normal text-white/40">
                              ({pct}%)
                            </span>
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8 }}
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>
        )}

        {/* Users */}
        {activeTab === "users" && (
          <motion.section
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-5"
          >
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher email, pseudo…"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 focus:border-purple-400/50 focus:outline-none"
                />
              </div>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#241447] px-3 py-2 text-sm text-white focus:outline-none"
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
                className="rounded-xl border border-white/10 bg-[#241447] px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="trialing">Essai</option>
                <option value="inactive">Inactif</option>
                <option value="canceled">Annulé</option>
              </select>
            </div>

            <p className="text-xs text-white/40">
              {formatNumber(totalUsers)} utilisateur
              {totalUsers !== 1 ? "s" : ""} trouvé
              {totalUsers !== 1 ? "s" : ""}
            </p>

            {isLoadingUsers ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center text-sm text-white/40">
                Aucun utilisateur trouvé.
              </div>
            ) : (
              <>
                {/* Cards mobile */}
                <div className="space-y-3 md:hidden">
                  {users.map((u) => (
                    <article
                      key={u._id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold">
                          {u.pseudonyme.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold">
                              {u.pseudonyme}
                            </p>

                            {u.hasCompletedProfile && (
                              <BadgeCheck className="h-4 w-4 text-green-400" />
                            )}

                            {u.identityVerified && (
                              <ShieldCheck
                                className="h-4 w-4 text-blue-400"
                                aria-label="Identité vérifiée"
                              />
                            )}
                          </div>

                          <p className="truncate text-xs text-white/40">
                            {u.email}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs">
                              {planEmoji[u.plan] || "🌙"}{" "}
                              {planLabel[u.plan] || u.plan}
                            </span>

                            <span
                              className={`rounded-full border px-2 py-1 text-xs ${
                                statusColor[u.subscriptionStatus] ||
                                statusColor.inactive
                              }`}
                            >
                              {u.subscriptionStatus}
                            </span>

                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/50">
                              {u.role === "admin" ? "⭐ Admin" : "User"}
                            </span>
                          </div>

                          <p className="mt-2 text-xs text-white/40">
                            Inscription : {formatDate(u.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end gap-2 border-t border-white/8 pt-3">
                        <button
                          onClick={() =>
                            handleUserAction(u._id, "toggle_premium")
                          }
                          disabled={actionLoading === u._id + "toggle_premium"}
                          className={`rounded-lg border p-2 transition ${
                            u.isPremium
                              ? "border-yellow-400/20 bg-yellow-400/15 text-yellow-300"
                              : "border-white/10 bg-white/5 text-white/40"
                          }`}
                        >
                          {actionLoading === u._id + "toggle_premium" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Crown className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          onClick={() =>
                            handleUserAction(
                              u._id,
                              u.role === "admin" ? "demote" : "promote"
                            )
                          }
                          disabled={
                            actionLoading ===
                            u._id + (u.role === "admin" ? "demote" : "promote")
                          }
                          className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
                        >
                          {actionLoading ===
                          u._id + (u.role === "admin" ? "demote" : "promote") ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          onClick={() =>
                            handleUserAction(u._id, "toggle_identity_verified")
                          }
                          disabled={
                            actionLoading === u._id + "toggle_identity_verified"
                          }
                          title={
                            u.identityVerified
                              ? "Retirer la vérification d'identité"
                              : "Valider manuellement l'identité"
                          }
                          className={`rounded-lg border p-2 transition ${
                            u.identityVerified
                              ? "border-blue-400/20 bg-blue-400/15 text-blue-300"
                              : "border-white/10 bg-white/5 text-white/40"
                          }`}
                        >
                          {actionLoading ===
                          u._id + "toggle_identity_verified" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          )}
                        </button>

                        {u.role !== "admin" && (
                          <button
                            onClick={() => handleDeleteUser(u._id, u.pseudonyme)}
                            disabled={actionLoading === u._id + "delete"}
                            className="rounded-lg border border-red-400/20 bg-red-400/10 p-2 text-red-300 transition hover:bg-red-400/20"
                          >
                            {actionLoading === u._id + "delete" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>

                {/* Table desktop */}
                <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:block">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/8 text-xs text-white/40">
                          <th className="px-4 py-3 text-left font-medium">
                            Utilisateur
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Plan
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Statut
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Inscription
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Rôle
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {users.map((u) => (
                          <tr
                            key={u._id}
                            className="border-b border-white/5 transition hover:bg-white/5"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-bold">
                                  {u.pseudonyme.charAt(0).toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                  <p className="max-w-32 truncate font-medium">
                                    {u.pseudonyme}
                                  </p>
                                  <p className="max-w-32 truncate text-xs text-white/40">
                                    {u.email}
                                  </p>
                                </div>

                                {u.hasCompletedProfile && (
                                  <BadgeCheck className="h-4 w-4 shrink-0 text-green-400" />
                                )}

                                {u.identityVerified && (
                                  <ShieldCheck
                                    className="h-4 w-4 shrink-0 text-blue-400"
                                    aria-label="Identité vérifiée"
                                  />
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <span className="text-xs font-medium">
                                {planEmoji[u.plan] || "🌙"}{" "}
                                {planLabel[u.plan] || u.plan}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full border px-2 py-1 text-xs ${
                                  statusColor[u.subscriptionStatus] ||
                                  statusColor.inactive
                                }`}
                              >
                                {u.subscriptionStatus}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-xs text-white/50">
                              {formatDate(u.createdAt)}
                            </td>

                            <td className="px-4 py-3">
                              {u.role === "admin" ? (
                                <span className="flex items-center gap-1 text-xs text-yellow-300">
                                  <Star className="h-3 w-3" /> Admin
                                </span>
                              ) : (
                                <span className="text-xs text-white/40">
                                  User
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() =>
                                    handleUserAction(u._id, "toggle_premium")
                                  }
                                  disabled={
                                    actionLoading === u._id + "toggle_premium"
                                  }
                                  className={`rounded-lg border p-1.5 text-xs transition ${
                                    u.isPremium
                                      ? "border-yellow-400/20 bg-yellow-400/15 text-yellow-300"
                                      : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                  }`}
                                >
                                  {actionLoading ===
                                  u._id + "toggle_premium" ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Crown className="h-3.5 w-3.5" />
                                  )}
                                </button>

                                <button
                                  onClick={() =>
                                    handleUserAction(
                                      u._id,
                                      u.role === "admin" ? "demote" : "promote"
                                    )
                                  }
                                  disabled={
                                    actionLoading ===
                                    u._id +
                                      (u.role === "admin" ? "demote" : "promote")
                                  }
                                  className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
                                >
                                  {actionLoading ===
                                  u._id +
                                    (u.role === "admin" ? "demote" : "promote") ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Shield className="h-3.5 w-3.5" />
                                  )}
                                </button>

                                <button
                                  onClick={() =>
                                    handleUserAction(
                                      u._id,
                                      "toggle_identity_verified"
                                    )
                                  }
                                  disabled={
                                    actionLoading ===
                                    u._id + "toggle_identity_verified"
                                  }
                                  title={
                                    u.identityVerified
                                      ? "Retirer la vérification d'identité"
                                      : "Valider manuellement l'identité"
                                  }
                                  className={`rounded-lg border p-1.5 text-xs transition ${
                                    u.identityVerified
                                      ? "border-blue-400/20 bg-blue-400/15 text-blue-300"
                                      : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                  }`}
                                >
                                  {actionLoading ===
                                  u._id + "toggle_identity_verified" ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                  )}
                                </button>

                                {u.role !== "admin" && (
                                  <button
                                    onClick={() =>
                                      handleDeleteUser(u._id, u.pseudonyme)
                                    }
                                    disabled={actionLoading === u._id + "delete"}
                                    className="rounded-lg border border-red-400/20 bg-red-400/10 p-1.5 text-red-300 transition hover:bg-red-400/20"
                                  >
                                    {actionLoading === u._id + "delete" ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/40">
                  Page {page} / {totalPages}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page <= 1 || isLoadingUsers}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Préc.
                  </button>

                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page >= totalPages || isLoadingUsers}
                    className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                  >
                    Suiv.
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* Testimonials */}
        {activeTab === "testimonials" && (
          <motion.section
            key="testimonials"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-white/60">
                {testimonials.length} témoignage(s)
              </p>

              <button
                onClick={fetchTestimonials}
                className="flex items-center gap-1 text-xs text-white/40 transition hover:text-white"
              >
                <RefreshCw className="h-3 w-3" />
                Actualiser
              </button>
            </div>

            {isLoadingTestimonials && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-purple-300" />
              </div>
            )}

            {!isLoadingTestimonials && testimonials.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-white/40">
                Aucun témoignage pour l&apos;instant.
              </div>
            )}

            {testimonials.map((t) => (
              <article
                key={t._id}
                className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="font-medium text-white">
                      {t.authorName}
                      {t.age ? `, ${t.age} ans` : ""}
                    </span>

                    <span className="ml-3 text-xs text-white/40">
                      {formatDate(t.createdAt)}
                    </span>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-2 py-1 text-xs font-medium ${
                      t.status === "approved"
                        ? "border-green-400/20 bg-green-400/10 text-green-300"
                        : t.status === "rejected"
                          ? "border-red-400/20 bg-red-400/10 text-red-300"
                          : "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                    }`}
                  >
                    {t.status === "approved"
                      ? "✓ Approuvé"
                      : t.status === "rejected"
                        ? "✕ Rejeté"
                        : "⏳ En attente"}
                  </span>
                </div>

                <p className="text-sm italic leading-relaxed text-white/70">
                  « {t.content} »
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {t.status !== "approved" && (
                    <button
                      onClick={() =>
                        handleTestimonialAction(t._id, "approved")
                      }
                      disabled={actionLoading === t._id + "approved"}
                      className="rounded-lg border border-green-400/30 bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-300 transition hover:bg-green-500/30 disabled:opacity-50"
                    >
                      {actionLoading === t._id + "approved"
                        ? "…"
                        : "✓ Approuver"}
                    </button>
                  )}

                  {t.status !== "rejected" && (
                    <button
                      onClick={() =>
                        handleTestimonialAction(t._id, "rejected")
                      }
                      disabled={actionLoading === t._id + "rejected"}
                      className="rounded-lg border border-orange-400/30 bg-orange-500/20 px-3 py-1.5 text-xs font-medium text-orange-300 transition hover:bg-orange-500/30 disabled:opacity-50"
                    >
                      {actionLoading === t._id + "rejected" ? "…" : "✕ Rejeter"}
                    </button>
                  )}

                  <button
                    onClick={() => handleTestimonialAction(t._id, "delete")}
                    disabled={actionLoading === t._id + "delete"}
                    className="ml-auto rounded-lg border border-red-400/30 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {actionLoading === t._id + "delete"
                      ? "…"
                      : "🗑 Supprimer"}
                  </button>
                </div>
              </article>
            ))}
          </motion.section>
        )}

        {/* Reports */}
        {activeTab === "reports" && (
          <motion.section
            key="reports"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-white/60">
                {reports.length} signalement(s)
              </p>

              <button
                onClick={fetchReports}
                className="flex items-center gap-1 text-xs text-white/40 transition hover:text-white"
              >
                <RefreshCw className="h-3 w-3" />
                Actualiser
              </button>
            </div>

            {isLoadingReports && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-purple-300" />
              </div>
            )}

            {!isLoadingReports && reports.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 py-12 text-center text-white/30">
                Aucun signalement.
              </div>
            )}

            {reports.map((report) => (
              <article
                key={report._id}
                className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                        report.status === "pending"
                          ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                          : report.status === "reviewed"
                            ? "border-green-400/20 bg-green-400/10 text-green-300"
                            : "border-white/10 bg-white/5 text-white/40"
                      }`}
                    >
                      {report.status === "pending"
                        ? "En attente"
                        : report.status === "reviewed"
                          ? "Traité"
                          : "Ignoré"}
                    </span>

                    <span className="text-xs text-white/40">
                      {formatDate(report.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm font-semibold">
                    Motif :{" "}
                    <span className="text-red-300">
                      {reasonLabel[report.reason] || report.reason}
                    </span>
                  </p>

                  {report.details && (
                    <p className="text-xs text-white/50">{report.details}</p>
                  )}

                  <p className="text-xs text-white/40">
                    Signalé par :{" "}
                    <span className="text-white/70">
                      {report.reporterId?.pseudonyme || "Inconnu"}
                    </span>{" "}
                    → Visé :{" "}
                    <span className="text-white/70">
                      {report.targetId?.pseudonyme || report.targetType}
                    </span>
                  </p>
                </div>

                {report.status === "pending" && (
                  <div className="flex flex-wrap items-center gap-2">
                    {report.targetId?._id && (
                      <button
                        onClick={() =>
                          handleBan(
                            report.targetId!._id,
                            report.targetId?.pseudonyme || "cette utilisatrice"
                          )
                        }
                        disabled={
                          actionLoading === "ban-" + report.targetId._id
                        }
                        className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                      >
                        🚫 Bannir
                      </button>
                    )}

                    <button
                      onClick={() =>
                        handleResolveReport(report._id, "reviewed")
                      }
                      disabled={actionLoading === report._id + "reviewed"}
                      className="rounded-xl border border-green-400/30 bg-green-600/20 px-4 py-2 text-xs text-green-200 transition hover:bg-green-600/30 disabled:opacity-50"
                    >
                      ✓ Marquer traité
                    </button>

                    <button
                      onClick={() =>
                        handleResolveReport(report._id, "dismissed")
                      }
                      disabled={actionLoading === report._id + "dismissed"}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/40 transition hover:bg-white/10 disabled:opacity-50"
                    >
                      Ignorer
                    </button>
                  </div>
                )}
              </article>
            ))}
          </motion.section>
        )}

        {/* Outils */}
        {activeTab === "tools" && (
          <motion.section
            key="tools"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-red-300">
                <AlertCircle className="h-4 w-4" />
                Zone sensible
              </p>
              <p className="mt-1 text-xs text-white/50">
                Ces actions suppriment définitivement des données pour
                l&apos;ensemble du site (toutes les utilisatrices), sans
                toucher aux comptes eux-mêmes. Utile pour repartir avec des
                statistiques propres après des tests. Irréversible.
              </p>
            </div>

            {resetMessage && (
              <div className="flex items-center gap-3 rounded-xl border border-green-400/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="flex-1">{resetMessage}</span>
                <button
                  onClick={() => setResetMessage(null)}
                  className="text-green-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="space-y-3">
              {resetTargets.map((rt) => (
                <div
                  key={rt.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold">{rt.label}</p>
                    <p className="text-xs text-white/40">{rt.description}</p>
                  </div>

                  <button
                    onClick={() => handleResetData(rt.id, rt.confirmMessage)}
                    disabled={actionLoading === "reset-" + rt.id}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-600/20 px-4 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-600/30 disabled:opacity-50"
                  >
                    {actionLoading === "reset-" + rt.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Réinitialiser
                  </button>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </main>
  );
}
