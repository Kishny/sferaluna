// src/app/admin/page.tsx

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flag,
  Heart,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
  UserX,
  Wrench,
} from "lucide-react";

/**
 * Dashboard Admin SferaLuna — design premium sombre + données réelles.
 *
 * Shell : sidebar fixe (desktop) + nav scrollable (mobile) + header.
 * Sections : Dashboard (overview branché sur /api/admin/stats), Utilisateurs,
 * Signalements, Témoignages, Newsletter, Outils. Toute la logique de gestion
 * existante est conservée (actions users, bannissement, reset, etc.).
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
    active24h: number;
    activeLast7days: number;
    inactive: number;
    retentionRate: number;
  };
  matches: { total: number; active: number; last7days: number };
  messages: { total: number; last7days: number; today: number };
  revenue: {
    monthly: number;
    estimated: number;
    source: "stripe" | "estimate";
    currency: string;
    since: string;
  };
  planBreakdown: { plan: string; count: number }[];
  ageDistribution: { label: string; count: number; pct: number }[];
  dailySeries: {
    label: string;
    inscriptions: number;
    matches: number;
    messages: number;
  }[];
  canceled: {
    pseudonyme: string;
    plan: string;
    planLabel: string;
    date: string | null;
  }[];
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

type TabId =
  | "dashboard"
  | "users"
  | "reports"
  | "testimonials"
  | "newsletter"
  | "tools";

type ResetTarget = "messages" | "matches" | "visits" | "posts" | "journal";

const nav: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "reports", label: "Signalements", icon: Flag },
  { id: "testimonials", label: "Témoignages", icon: MessageCircle },
  { id: "newsletter", label: "Newsletter", icon: Mail },
  { id: "tools", label: "Outils", icon: Wrench },
];

const sectionTitle: Record<TabId, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard Admin", sub: "Vue d'ensemble de la plateforme" },
  users: { title: "Utilisateurs", sub: "Gestion des membres" },
  reports: { title: "Signalements", sub: "Modération de la communauté" },
  testimonials: { title: "Témoignages", sub: "Validation des avis" },
  newsletter: { title: "Newsletter", sub: "Communication aux abonnées" },
  tools: { title: "Outils", sub: "Maintenance & données" },
};

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

const planLabel: Record<string, string> = {
  free: "Gratuit",
  "essential-monthly": "Essentiel",
  "premium-monthly": "Premium",
  "elite-monthly": "Elite",
};

const planColor: Record<string, string> = {
  free: "#8b8199",
  "essential-monthly": "#8b5cf6",
  "premium-monthly": "#ec4899",
  "elite-monthly": "#e9c46a",
};

const planBadgeColor: Record<string, string> = {
  free: "border-white/10 bg-white/5 text-white/70",
  "essential-monthly": "border-violet-400/25 bg-violet-500/15 text-violet-200",
  "premium-monthly": "border-pink-400/25 bg-pink-500/15 text-pink-200",
  "elite-monthly": "border-amber-300/30 bg-amber-400/15 text-amber-200",
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

/** Statut lisible d'une membre pour l'overview. */
function memberStatus(u: AdminUser): "Actif" | "Inactif" | "Résilié" {
  if (u.subscriptionStatus === "canceled") return "Résilié";
  if (u.lastLoginAt) {
    const days = (Date.now() - new Date(u.lastLoginAt).getTime()) / 86400000;
    if (days <= 30) return "Actif";
  }
  return "Inactif";
}

const memberStatusStyle: Record<string, string> = {
  Actif: "text-emerald-300 bg-emerald-500/12 border-emerald-400/25",
  Inactif: "text-orange-300 bg-orange-500/12 border-orange-400/25",
  Résilié: "text-violet-300 bg-violet-500/15 border-violet-400/30",
};

/**
 * Abonnement EFFECTIF d'une membre (pas le plan choisi).
 * - abonnement annulé  → "Résilié"
 * - premium réellement actif (isPremium) → palier réel
 * - sinon → "Gratuit" (ex : plan Elite sélectionné mais jamais payé)
 */
function effectivePlan(u: AdminUser): {
  key: string;
  label: string;
  style: string;
  isElite: boolean;
} {
  if (u.subscriptionStatus === "canceled") {
    return {
      key: "canceled",
      label: "Résilié",
      style: "text-violet-300 bg-violet-500/15 border-violet-400/30",
      isElite: false,
    };
  }
  if (u.isPremium && u.plan !== "free") {
    return {
      key: u.plan,
      label: planLabel[u.plan] || u.plan,
      style: planBadgeColor[u.plan] || planBadgeColor.free,
      isElite: u.plan === "elite-monthly",
    };
  }
  return {
    key: "free",
    label: "Gratuit",
    style: planBadgeColor.free,
    isElite: false,
  };
}

/* ---------- Graphiques SVG (aucune dépendance) ---------- */

function CombinedChart({ data }: { data: AdminStats["dailySeries"] }) {
  const W = 560;
  const H = 240;
  const pad = { top: 20, right: 16, bottom: 28, left: 24 };
  const iW = W - pad.left - pad.right;
  const iH = H - pad.top - pad.bottom;

  const peak = Math.max(
    1,
    ...data.map((d) => Math.max(d.inscriptions, d.matches, d.messages))
  );
  const max = Math.ceil(peak / 4) * 4 || 4;

  const groupW = iW / Math.max(data.length, 1);
  const barW = 12;
  const gap = 5;

  const linePts = data.map((d, i) => ({
    x: pad.left + groupW * i + groupW / 2,
    y: pad.top + iH - (d.messages / max) * iH,
  }));
  const linePath = linePts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const gridLines = [0, max / 4, max / 2, (3 * max) / 4, max];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="barInscr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="barMatch" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(233,196,106,0.25)" />
          <stop offset="100%" stopColor="rgba(233,196,106,0)" />
        </linearGradient>
      </defs>

      {gridLines.map((g, i) => {
        const y = pad.top + iH - (g / max) * iH;
        return (
          <g key={i}>
            <line
              x1={pad.left}
              y1={y}
              x2={W - pad.right}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
            <text x={4} y={y + 3} fill="rgba(255,255,255,0.25)" fontSize="9">
              {Math.round(g)}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const center = pad.left + groupW * i + groupW / 2;
        const hInscr = (d.inscriptions / max) * iH;
        const hMatch = (d.matches / max) * iH;
        return (
          <g key={i}>
            <rect
              x={center - barW - gap / 2}
              y={pad.top + iH - hInscr}
              width={barW}
              height={hInscr}
              rx="3"
              fill="url(#barInscr)"
            />
            <rect
              x={center + gap / 2}
              y={pad.top + iH - hMatch}
              width={barW}
              height={hMatch}
              rx="3"
              fill="url(#barMatch)"
            />
            <text
              x={center}
              y={H - 8}
              textAnchor="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize="10"
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {linePts.length > 0 && (
        <>
          <path
            d={`${linePath} L ${linePts[linePts.length - 1].x} ${
              pad.top + iH
            } L ${linePts[0].x} ${pad.top + iH} Z`}
            fill="url(#lineFill)"
          />
          <path
            d={linePath}
            fill="none"
            stroke="#e9c46a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {linePts.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3.5"
              fill="#1a0b2e"
              stroke="#e9c46a"
              strokeWidth="2"
            />
          ))}
        </>
      )}
    </svg>
  );
}

function PlanDonut({
  breakdown,
  total,
}: {
  breakdown: AdminStats["planBreakdown"];
  total: number;
}) {
  const radius = 58;
  const stroke = 20;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  const items = breakdown.map((b) => ({
    ...b,
    pct: total > 0 ? Math.round((b.count / total) * 100) : 0,
    color: planColor[b.plan] || "#8b8199",
    label: planLabel[b.plan] || b.plan,
  }));

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-[150px] w-[150px] shrink-0">
        <svg viewBox="0 0 150 150" className="h-full w-full -rotate-90">
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          {items.map((p) => {
            const len = total > 0 ? (p.count / total) * circ : 0;
            const seg = (
              <circle
                key={p.plan}
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke={p.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
              />
            );
            offset += len;
            return seg;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {formatNumber(total)}
          </span>
          <span className="text-[11px] text-white/45">membres</span>
        </div>
      </div>

      <div className="flex-1 space-y-2.5">
        {items.map((p) => (
          <div key={p.plan} className="flex items-center gap-2.5 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="flex items-center gap-1 text-white/70">
              {p.label}
              {p.plan === "elite-monthly" && (
                <Crown className="h-3 w-3 text-amber-300" />
              )}
            </span>
            <span className="ml-auto font-semibold text-white">
              {formatNumber(p.count)}
            </span>
            <span className="w-9 text-right text-xs text-white/40">
              {p.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */

export default function AdminPage() {
  const router = useRouter();
  const { status } = useSession();

  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);

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
      city?: string;
      content: string;
      rating?: number;
      showAvatar?: boolean;
      featured?: boolean;
      status: string;
      createdAt: string;
    }[]
  >([]);
  const [isLoadingTestimonials, setIsLoadingTestimonials] = useState(false);

  // Newsletter
  const [newsletterStats, setNewsletterStats] = useState<{
    subscriberCount: number;
    audienceConfigured: boolean;
  } | null>(null);
  const [nlSubject, setNlSubject] = useState("");
  const [nlContent, setNlContent] = useState("");
  const [nlStatus, setNlStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [nlMessage, setNlMessage] = useState("");

  const fetchNewsletterStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/newsletter");
      const data = await res.json();
      if (data.success) {
        setNewsletterStats({
          subscriberCount: data.subscriberCount ?? 0,
          audienceConfigured: Boolean(data.audienceConfigured),
        });
      }
    } catch {
      // silencieux
    }
  }, []);

  const handleSendNewsletter = async () => {
    if (nlSubject.trim().length < 3 || nlContent.trim().length < 20) {
      setNlStatus("error");
      setNlMessage("Objet (3+) et contenu (20+) requis.");
      return;
    }

    setNlStatus("sending");
    setNlMessage("");

    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: nlSubject, content: nlContent }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setNlStatus("success");
        setNlMessage("Newsletter envoyée à l'audience ✅");
        setNlSubject("");
        setNlContent("");
      } else {
        setNlStatus("error");
        setNlMessage(data.error ?? "Envoi échoué.");
      }
    } catch {
      setNlStatus("error");
      setNlMessage("Erreur de connexion.");
    }
  };

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

  const fetchRecentUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users?page=1&limit=6", {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) setRecentUsers(data.users);
    } catch {
      // silencieux
    }
  }, []);

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
    if (status === "authenticated") {
      fetchStats();
      fetchRecentUsers();
      fetchReports();
    }
  }, [status, fetchStats, fetchRecentUsers, fetchReports]);

  useEffect(() => {
    if (status === "authenticated" && activeTab === "users") fetchUsers();
  }, [status, activeTab, fetchUsers]);

  useEffect(() => {
    if (status === "authenticated" && activeTab === "testimonials") {
      fetchTestimonials();
    }
  }, [status, activeTab, fetchTestimonials]);

  useEffect(() => {
    if (status === "authenticated" && activeTab === "newsletter") {
      fetchNewsletterStats();
    }
  }, [status, activeTab, fetchNewsletterStats]);

  useEffect(() => {
    setPage(1);
  }, [search, planFilter, statusFilter]);

  const handleRefresh = () => {
    fetchStats();
    fetchRecentUsers();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "reports") fetchReports();
    if (activeTab === "testimonials") fetchTestimonials();
    if (activeTab === "newsletter") fetchNewsletterStats();
  };

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

  const handleTestimonialFeatured = async (id: string, featured: boolean) => {
    setActionLoading(id + "featured");

    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured }),
      });

      const data = await res.json();

      if (data.success) {
        setTestimonials((prev) =>
          prev.map((t) => (t._id === id ? { ...t, featured } : t))
        );
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

  const pendingReports = reports.filter((r) => r.status === "pending");

  return (
    <div className="min-h-screen bg-[#120726] text-white antialiased">
      {/* halos d'ambiance */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-[28rem] w-[28rem] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-pink-600/12 blur-[120px]" />
        <div className="absolute top-1/2 -left-20 h-72 w-72 rounded-full bg-amber-500/8 blur-[120px]" />
      </div>

      <div className="relative z-10 flex">
        {/* -------- Sidebar (desktop) -------- */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-white/[0.03] px-4 py-6 backdrop-blur-xl lg:flex">
          <button
            onClick={() => router.push("/mon-compte")}
            className="mb-6 flex items-center gap-2 px-2 text-xs text-white/40 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Mon compte
          </button>

          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 shadow-lg shadow-fuchsia-500/30">
              <div className="absolute inset-[3px] rounded-[13px] bg-[#160a2e]" />
              <span className="relative text-lg">🌙</span>
            </div>
            <div>
              <p className="text-base font-bold leading-none tracking-tight">
                Sfera<span className="text-amber-300">Luna</span>
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
                Admin
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {nav.map((item) => {
              const isActive = item.id === activeTab;
              const badge =
                item.id === "reports" && pendingReports.length > 0
                  ? pendingReports.length
                  : null;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600/40 to-fuchsia-600/20 text-white shadow-lg shadow-violet-900/40 ring-1 ring-white/10"
                      : "text-white/50 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`h-[18px] w-[18px] ${
                      isActive ? "text-amber-300" : ""
                    }`}
                  />
                  {item.label}
                  {badge ? (
                    <span className="ml-auto rounded-full bg-red-500/25 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
                      {badge}
                    </span>
                  ) : isActive ? (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-300" />
                  ) : null}
                </button>
              );
            })}
          </nav>

          <button
            onClick={() => router.push("/mon-compte")}
            className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Déconnexion
          </button>
        </aside>

        {/* -------- Main -------- */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {sectionTitle[activeTab].title}
              </h1>
              <p className="mt-1 text-sm text-white/40">
                {sectionTitle[activeTab].sub}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">Actualiser</span>
              </button>

              <button className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 text-white/70 transition hover:bg-white/10">
                <Bell className="h-4 w-4" />
                {pendingReports.length > 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-pink-500 ring-2 ring-[#120726]" />
                )}
              </button>

              <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 text-sm font-bold">
                  A
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold leading-none">Admin</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-amber-300">
                    <Crown className="h-2.5 w-2.5" /> Super Admin
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Nav mobile scrollable */}
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition ${
                  activeTab === item.id
                    ? "border-white/20 bg-white/15 text-white"
                    : "border-white/10 bg-white/5 text-white/50"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>

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

          {/* ================= DASHBOARD ================= */}
          {activeTab === "dashboard" && stats && (
            <motion.section
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Cartes stats principales */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
                {[
                  {
                    icon: Users,
                    label: "Total Utilisateurs",
                    value: formatNumber(stats.users.total),
                    sub: `+${stats.users.newLast7days} cette semaine`,
                    trend: "up" as const,
                    accent: "text-violet-200",
                    ring: "border-violet-400/25",
                    glow: "from-violet-500/25 to-violet-800/5",
                    iconBg: "bg-violet-500/20 text-violet-200",
                  },
                  {
                    icon: Activity,
                    label: "Membres Actifs",
                    value: formatNumber(stats.users.active24h),
                    sub: "connectés / 24h",
                    trend: "up" as const,
                    accent: "text-emerald-200",
                    ring: "border-emerald-400/25",
                    glow: "from-emerald-500/20 to-emerald-800/5",
                    iconBg: "bg-emerald-500/20 text-emerald-200",
                  },
                  {
                    icon: UserX,
                    label: "Membres Inactifs",
                    value: formatNumber(stats.users.inactive),
                    sub: "aucune activité 30j",
                    trend: "down" as const,
                    accent: "text-orange-200",
                    ring: "border-orange-400/25",
                    glow: "from-orange-500/20 to-orange-800/5",
                    iconBg: "bg-orange-500/20 text-orange-200",
                  },
                  {
                    icon: Heart,
                    label: "Matches Actifs",
                    value: formatNumber(stats.matches.active),
                    sub: `+${stats.matches.last7days} cette semaine`,
                    trend: "up" as const,
                    accent: "text-pink-200",
                    ring: "border-pink-400/25",
                    glow: "from-pink-500/20 to-fuchsia-800/5",
                    iconBg: "bg-pink-500/20 text-pink-200",
                  },
                  {
                    icon: MessageCircle,
                    label: "Messages (auj.)",
                    value: formatNumber(stats.messages.today),
                    sub: `${formatNumber(stats.messages.last7days)} / 7j`,
                    trend: "up" as const,
                    accent: "text-sky-200",
                    ring: "border-sky-400/25",
                    glow: "from-sky-500/20 to-indigo-800/5",
                    iconBg: "bg-sky-500/20 text-sky-200",
                  },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`relative overflow-hidden rounded-2xl border ${s.ring} bg-gradient-to-br ${s.glow} p-4 backdrop-blur-sm`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className={`rounded-xl p-2 ${s.iconBg}`}>
                        <s.icon className="h-4 w-4" />
                      </div>
                      {s.trend === "up" ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-orange-400" />
                      )}
                    </div>
                    <p className="text-2xl font-bold tracking-tight">{s.value}</p>
                    <p className="mt-0.5 text-xs text-white/50">{s.label}</p>
                    <p className={`mt-1.5 text-[11px] font-medium ${s.accent}`}>
                      {s.sub}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
                  <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/70">
                    <UserRound className="h-4 w-4 text-violet-300" />
                    Nouveaux inscrits
                  </p>
                  <div className="grid grid-cols-3 divide-x divide-white/10">
                    {[
                      { k: "Aujourd'hui", v: stats.users.newToday },
                      { k: "Semaine", v: stats.users.newLast7days },
                      { k: "Mois", v: stats.users.newLast30days },
                    ].map((c) => (
                      <div
                        key={c.k}
                        className="px-2 text-center first:pl-0 last:pr-0"
                      >
                        <p className="text-2xl font-bold">{formatNumber(c.v)}</p>
                        <p className="mt-0.5 text-[11px] text-white/40">{c.k}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
                  <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-white/70">
                    <Activity className="h-4 w-4 text-emerald-300" />
                    Taux de rétention
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-emerald-300">
                        {stats.users.retentionRate} %
                      </p>
                      <p className="mt-1 text-[11px] text-white/40">
                        membres &gt; 30j revenus / 30j
                      </p>
                    </div>
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${stats.users.retentionRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-amber-300/25 bg-gradient-to-br from-amber-500/12 to-transparent p-5 backdrop-blur-sm">
                  <p className="mb-4 flex items-center justify-between gap-2 text-sm font-semibold text-white/70">
                    <span className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-300" />
                      Revenu du mois
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        stats.revenue.source === "stripe"
                          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                          : "border-white/15 bg-white/5 text-white/40"
                      }`}
                    >
                      {stats.revenue.source === "stripe" ? "Stripe · réel" : "estimé"}
                    </span>
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-amber-200">
                        {formatNumber(stats.revenue.monthly)} €
                      </p>
                      <p className="mt-1 text-[11px] text-white/40">
                        {stats.revenue.source === "stripe"
                          ? `paiements encaissés · est. ${formatNumber(
                              stats.revenue.estimated
                            )} €`
                          : `${formatNumber(
                              stats.users.activeSubscriptions
                            )} abonnements actifs`}
                      </p>
                    </div>
                    <Sparkles className="h-8 w-8 text-amber-300/40" />
                  </div>
                </div>
              </div>

              {/* Row 3 : graphique + donut */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Activité — 7 derniers jours
                      </h3>
                      <p className="text-xs text-white/40">
                        Inscriptions, matches & messages
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1.5 text-white/60">
                        <span className="h-2 w-2 rounded-sm bg-violet-400" />
                        Inscriptions
                      </span>
                      <span className="flex items-center gap-1.5 text-white/60">
                        <span className="h-2 w-2 rounded-sm bg-pink-400" />
                        Matches
                      </span>
                      <span className="flex items-center gap-1.5 text-white/60">
                        <span className="h-2 w-4 rounded-full bg-amber-300" />
                        Messages
                      </span>
                    </div>
                  </div>
                  <CombinedChart data={stats.dailySeries} />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Répartition des plans</h3>
                    <MoreHorizontal className="h-4 w-4 text-white/30" />
                  </div>
                  <PlanDonut
                    breakdown={stats.planBreakdown}
                    total={stats.users.total}
                  />
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="mb-3 text-xs font-semibold text-white/50">
                      Répartition par âge
                    </p>
                    <div className="space-y-2.5">
                      {stats.ageDistribution.map((a) => (
                        <div
                          key={a.label}
                          className="flex items-center gap-3 text-xs"
                        >
                          <span className="w-20 shrink-0 text-white/60">
                            {a.label}
                          </span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
                              style={{ width: `${a.pct}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-white/50">
                            {a.pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4 : derniers inscrits + activités */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">
                  <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                    <h3 className="text-sm font-semibold">Derniers inscrits</h3>
                    <button
                      onClick={() => setActiveTab("users")}
                      className="flex items-center gap-1 text-xs text-violet-300 transition hover:text-violet-200"
                    >
                      Voir tout <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] uppercase tracking-wider text-white/35">
                          <th className="px-5 py-3 font-medium">Membre</th>
                          <th className="px-3 py-3 font-medium">Âge</th>
                          <th className="px-3 py-3 font-medium">Statut</th>
                          <th className="px-3 py-3 font-medium">Abonnement</th>
                          <th className="px-3 py-3 font-medium">Inscription</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentUsers.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-5 py-8 text-center text-white/35"
                            >
                              Aucun inscrit récent.
                            </td>
                          </tr>
                        ) : (
                          recentUsers.map((m) => {
                            const st = memberStatus(m);
                            const ep = effectivePlan(m);
                            return (
                              <tr
                                key={m._id}
                                className="border-t border-white/5 transition hover:bg-white/[0.03]"
                              >
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-xs font-bold">
                                      {m.pseudonyme.charAt(0).toUpperCase()}
                                      {ep.isElite && (
                                        <Crown className="absolute -right-1 -top-1 h-3.5 w-3.5 text-amber-300 drop-shadow" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate font-medium leading-none">
                                        {m.pseudonyme}
                                      </p>
                                      <p className="mt-1 truncate text-[11px] text-white/35">
                                        {m.localisation || m.email}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-white/60">
                                  {m.age ?? "—"}
                                </td>
                                <td className="px-3 py-3">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${memberStatusStyle[st]}`}
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    {st}
                                  </span>
                                </td>
                                <td className="px-3 py-3">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${ep.style}`}
                                  >
                                    {ep.isElite && <Crown className="h-3 w-3" />}
                                    {ep.label}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-white/50">
                                  {formatDate(m.createdAt)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Activités récentes = signalements réels */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Bell className="h-4 w-4 text-pink-300" />
                      Activités récentes
                    </h3>
                    {pendingReports.length > 0 && (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300">
                        {pendingReports.length} à traiter
                      </span>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {pendingReports.length === 0 ? (
                      <div className="flex items-center gap-3 rounded-xl border border-emerald-400/15 bg-emerald-500/5 p-4 text-sm text-emerald-200/80">
                        <ShieldCheck className="h-4 w-4 shrink-0" />
                        Aucun signalement en attente. Tout est calme ✨
                      </div>
                    ) : (
                      pendingReports.slice(0, 5).map((r) => (
                        <button
                          key={r._id}
                          onClick={() => setActiveTab("reports")}
                          className="flex w-full items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3 text-left transition hover:bg-white/[0.06]"
                        >
                          <div className="rounded-lg border border-red-400/25 bg-red-500/15 p-1.5 text-red-300">
                            <ShieldAlert className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-tight">
                              {reasonLabel[r.reason] || r.reason}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-white/45">
                              {r.reporterId?.pseudonyme || "Inconnu"} →{" "}
                              {r.targetId?.pseudonyme || r.targetType}
                            </p>
                          </div>
                          <span className="shrink-0 text-[10px] text-white/30">
                            {formatDate(r.createdAt)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Row 5 : résiliations */}
              <div className="rounded-2xl border border-violet-400/15 bg-violet-500/[0.06] p-5 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <UserX className="h-4 w-4 text-violet-300" />
                      Abonnements résiliés
                    </h3>
                    <p className="text-xs text-white/40">
                      {stats.canceled.length} résiliation
                      {stats.canceled.length !== 1 ? "s" : ""} récente
                      {stats.canceled.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {stats.canceled.length === 0 ? (
                  <p className="rounded-xl border border-white/8 bg-white/[0.03] p-4 text-center text-sm text-white/40">
                    Aucune résiliation. 🎉
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {stats.canceled.map((c, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <p className="truncate font-medium">{c.pseudonyme}</p>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                              planBadgeColor[c.plan] || planBadgeColor.free
                            }`}
                          >
                            {c.planLabel}
                          </span>
                        </div>
                        <p className="mt-2 text-[11px] text-white/40">
                          Résilié le {formatDate(c.date)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.section>
          )}

          {/* ================= USERS ================= */}
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
                              {(() => {
                                const ep = effectivePlan(u);
                                return (
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${ep.style}`}
                                  >
                                    {ep.isElite && <Crown className="h-3 w-3" />}
                                    {ep.label}
                                  </span>
                                );
                              })()}
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
                            {actionLoading === u._id + "toggle_identity_verified" ? (
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
                            <th className="px-4 py-3 text-left font-medium">Plan</th>
                            <th className="px-4 py-3 text-left font-medium">
                              Statut
                            </th>
                            <th className="px-4 py-3 text-left font-medium">
                              Inscription
                            </th>
                            <th className="px-4 py-3 text-left font-medium">Rôle</th>
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
                                {(() => {
                                  const ep = effectivePlan(u);
                                  return (
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${ep.style}`}
                                    >
                                      {ep.isElite && <Crown className="h-3 w-3" />}
                                      {ep.label}
                                    </span>
                                  );
                                })()}
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
                                  <span className="text-xs text-white/40">User</span>
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
                                    {actionLoading === u._id + "toggle_premium" ? (
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

          {/* ================= TESTIMONIALS ================= */}
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
                      {t.city && (
                        <span className="ml-2 text-xs text-purple-300">
                          📍 {t.city}
                        </span>
                      )}
                      <span className="ml-2 text-xs text-amber-300">
                        {"★".repeat(t.rating ?? 5)}
                        <span className="text-white/20">
                          {"★".repeat(5 - (t.rating ?? 5))}
                        </span>
                      </span>
                      {t.showAvatar && (
                        <span className="ml-2 text-xs text-white/40">📷 photo</span>
                      )}
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
                        onClick={() => handleTestimonialAction(t._id, "approved")}
                        disabled={actionLoading === t._id + "approved"}
                        className="rounded-lg border border-green-400/30 bg-green-500/20 px-3 py-1.5 text-xs font-medium text-green-300 transition hover:bg-green-500/30 disabled:opacity-50"
                      >
                        {actionLoading === t._id + "approved" ? "…" : "✓ Approuver"}
                      </button>
                    )}

                    {t.status !== "rejected" && (
                      <button
                        onClick={() => handleTestimonialAction(t._id, "rejected")}
                        disabled={actionLoading === t._id + "rejected"}
                        className="rounded-lg border border-orange-400/30 bg-orange-500/20 px-3 py-1.5 text-xs font-medium text-orange-300 transition hover:bg-orange-500/30 disabled:opacity-50"
                      >
                        {actionLoading === t._id + "rejected" ? "…" : "✕ Rejeter"}
                      </button>
                    )}

                    {t.status === "approved" && (
                      <button
                        onClick={() =>
                          handleTestimonialFeatured(t._id, !t.featured)
                        }
                        disabled={actionLoading === t._id + "featured"}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                          t.featured
                            ? "border-amber-400/40 bg-amber-400/20 text-amber-200 hover:bg-amber-400/30"
                            : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        {actionLoading === t._id + "featured"
                          ? "…"
                          : t.featured
                            ? "⭐ Épinglé"
                            : "☆ Épingler"}
                      </button>
                    )}

                    <button
                      onClick={() => handleTestimonialAction(t._id, "delete")}
                      disabled={actionLoading === t._id + "delete"}
                      className="ml-auto rounded-lg border border-red-400/30 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/30 disabled:opacity-50"
                    >
                      {actionLoading === t._id + "delete" ? "…" : "🗑 Supprimer"}
                    </button>
                  </div>
                </article>
              ))}
            </motion.section>
          )}

          {/* ================= REPORTS ================= */}
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
                          disabled={actionLoading === "ban-" + report.targetId._id}
                          className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                          🚫 Bannir
                        </button>
                      )}

                      <button
                        onClick={() => handleResolveReport(report._id, "reviewed")}
                        disabled={actionLoading === report._id + "reviewed"}
                        className="rounded-xl border border-green-400/30 bg-green-600/20 px-4 py-2 text-xs text-green-200 transition hover:bg-green-600/30 disabled:opacity-50"
                      >
                        ✓ Marquer traité
                      </button>

                      <button
                        onClick={() => handleResolveReport(report._id, "dismissed")}
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

          {/* ================= NEWSLETTER ================= */}
          {activeTab === "newsletter" && (
            <motion.section
              key="newsletter"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    📨 Newsletter & actualités
                  </p>
                  <p className="text-xs text-white/50">
                    {newsletterStats
                      ? `${newsletterStats.subscriberCount} abonnée(s)`
                      : "Chargement…"}
                  </p>
                </div>
                <button
                  onClick={fetchNewsletterStats}
                  className="flex items-center gap-1 text-xs text-white/40 transition hover:text-white"
                >
                  <RefreshCw className="h-3 w-3" />
                  Actualiser
                </button>
              </div>

              {newsletterStats && !newsletterStats.audienceConfigured && (
                <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-xs text-yellow-100">
                  ⚠️ Audience Resend non configurée. Crée une Audience dans le
                  dashboard Resend puis renseigne{" "}
                  <code className="rounded bg-black/30 px-1">RESEND_AUDIENCE_ID</code>{" "}
                  dans les variables d&apos;environnement Vercel pour activer
                  l&apos;envoi.
                </div>
              )}

              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/60">
                    Objet
                  </label>
                  <input
                    type="text"
                    value={nlSubject}
                    onChange={(e) => setNlSubject(e.target.value)}
                    placeholder="Les nouveautés du mois sur SferaLuna 💜"
                    maxLength={120}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-purple-400/50"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-white/60">
                    Message
                  </label>
                  <textarea
                    value={nlContent}
                    onChange={(e) => setNlContent(e.target.value)}
                    rows={8}
                    placeholder={
                      "Écris ton actualité ici…\n\nSaute une ligne pour séparer les paragraphes. Un lien de désabonnement est ajouté automatiquement."
                    }
                    className="w-full resize-y rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-purple-400/50"
                  />
                </div>

                {nlMessage && (
                  <p
                    className={`text-xs ${
                      nlStatus === "success" ? "text-green-300" : "text-red-300"
                    }`}
                  >
                    {nlMessage}
                  </p>
                )}

                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-white/40">
                    L&apos;envoi part vers toute l&apos;audience Resend.
                  </p>
                  <button
                    onClick={handleSendNewsletter}
                    disabled={nlStatus === "sending"}
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {nlStatus === "sending" ? "Envoi…" : "Envoyer la newsletter"}
                  </button>
                </div>
              </div>
            </motion.section>
          )}

          {/* ================= TOOLS ================= */}
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
                  l&apos;ensemble du site (toutes les utilisatrices), sans toucher
                  aux comptes eux-mêmes. Utile pour repartir avec des statistiques
                  propres après des tests. Irréversible.
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

          <p className="mt-8 text-center text-[11px] text-white/25">
            SferaLuna · Dashboard admin
          </p>
        </main>
      </div>
    </div>
  );
}
