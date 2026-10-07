// src/components/dashboard/DashboardHome.tsx

"use client";

import Link from "next/link";
import { DailyInsightBlock } from "@/components/insights/DailyInsight";
import { useRouter } from "next/navigation";
import { useState, type ElementType, type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Briefcase,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Compass,
  CreditCard,
  Crown,
  Eye,
  Fingerprint,
  Heart,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageSquareText,
  Pencil,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Users,
} from "lucide-react";

import MoonScene from "./MoonScene";
import { quoteFont } from "./fonts";
import {
  Avatar,
  CARD,
  CountBadge,
  INNER_CARD,
  INTENTION_LABELS,
  PLAN_LABELS,
  SUBSCRIPTION_LABELS,
  VISIBILITY_LABELS,
  cn,
  isPremiumActive,
} from "./shared";
import type {
  DashboardData,
  DashboardEvent,
  DashboardTabId,
  DashboardUser,
  MissingField,
} from "./types";

// ─────────────────────────────────────────────
// Animations
// ─────────────────────────────────────────────

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 + i * 0.06, duration: 0.4, ease: "easeOut" as const },
  }),
};

function Section({
  children,
  index = 0,
  className = "",
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <motion.section
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.section>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <span className={cn("block animate-pulse rounded-lg bg-white/[0.07]", className)} />;
}

// ─────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────

export default function DashboardHome({
  user,
  profileCompletion,
  missingFields,
  data,
  isLoading,
  error,
  onRefresh,
  onNavigateTab,
}: {
  user: DashboardUser;
  profileCompletion: number;
  missingFields: MissingField[];
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => Promise<void> | void;
  onNavigateTab: (tab: DashboardTabId) => void;
}) {
  return (
    <div className="space-y-5 lg:space-y-6">
      <Hero user={user} />

      <DailyInsightBlock />

      <QuickActions user={user} onNavigateTab={onNavigateTab} />

      <ProfileOverview
        user={user}
        profileCompletion={profileCompletion}
        onNavigateTab={onNavigateTab}
      />

      {error && !data && (
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 sm:flex-row sm:items-center">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => onRefresh()}
            className="rounded-lg border border-rose-200/30 px-3 py-1.5 text-xs font-semibold hover:bg-rose-200/10"
          >
            Réessayer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12 lg:gap-6">
        <TodoCard
          className="xl:col-span-7"
          user={user}
          data={data}
          isLoading={isLoading}
          profileCompletion={profileCompletion}
          onNavigateTab={onNavigateTab}
        />
        <IntentionsCard
          className="xl:col-span-5"
          user={user}
          profileCompletion={profileCompletion}
          missingFields={missingFields}
          onNavigateTab={onNavigateTab}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
        <VisitorsCard data={data} isLoading={isLoading} onNavigateTab={onNavigateTab} />
        <MatchesCard data={data} isLoading={isLoading} />
        <EventCard
          className="md:col-span-2 xl:col-span-1"
          user={user}
          data={data}
          isLoading={isLoading}
          onRefresh={onRefresh}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────

function greeting() {
  const hour = new Date().getHours();
  if (hour >= 18 || hour < 5) return "Bonsoir";
  return "Bonjour";
}

function Hero({ user }: { user: DashboardUser }) {
  return (
    <Section className="relative isolate px-1 pb-2 pt-2 sm:pt-3">
      <MoonScene className="pointer-events-none absolute -right-6 -top-[110px] -z-10 h-[230px] w-[420px] opacity-50 sm:-top-[120px] sm:h-[290px] sm:w-[720px] sm:opacity-80 lg:-right-10 lg:w-[900px] lg:opacity-100" />

      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1.5 rounded-full py-1 text-sm text-white/65 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Retour au site
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[42px]">
            {greeting()}{" "}
            <span className="bg-gradient-to-r from-white via-violet-100 to-fuchsia-200 bg-clip-text text-transparent">
              {user.pseudonyme}
            </span>{" "}
            <span className="inline-block origin-[70%_70%] animate-[wave_2.4s_ease-in-out_1]" aria-hidden>
              👋
            </span>
          </h1>
          <p className="mt-2 text-base text-white/75 sm:text-lg">
            Ravie de te revoir ! Que souhaites-tu explorer aujourd’hui ?
          </p>
        </div>

        <p
          className={cn(
            quoteFont.className,
            "hidden max-w-[16rem] text-right text-2xl italic leading-snug text-violet-100/90 lg:block"
          )}
        >
          “Des rencontres qui font du bien, vraiment.”
        </p>
      </div>

      <style jsx global>{`
        @keyframes wave {
          0%, 60%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
        }
      `}</style>
    </Section>
  );
}

// ─────────────────────────────────────────────
// Actions rapides
// ─────────────────────────────────────────────

function QuickActions({
  user,
  onNavigateTab,
}: {
  user: DashboardUser;
  onNavigateTab: (tab: DashboardTabId) => void;
}) {
  const router = useRouter();

  const actions: {
    key: string;
    title: string;
    text: string;
    icon: ElementType;
    iconClass: string;
    onClick: () => void;
    featured?: boolean;
  }[] = [
    {
      key: "explorer",
      title: "Explorer",
      text: "Tes 6 découvertes de la semaine, puis tous les profils à ton rythme",
      icon: Compass,
      iconClass: "text-white",
      onClick: () => router.push("/explorer"),
      featured: true,
    },
    {
      key: "matches",
      title: "Voir mes matchs",
      text: "Retrouve tes affinités et poursuis la conversation",
      icon: Heart,
      iconClass: "fill-pink-400 text-pink-400",
      onClick: () => router.push("/matches"),
    },
    {
      key: "profil",
      title: "Modifier mon profil",
      text: "Mets en valeur qui tu es et tes intentions",
      icon: Pencil,
      iconClass: "text-white",
      onClick: () => onNavigateTab("profil"),
    },
    {
      key: "premium",
      title: "Gérer mon abonnement",
      text: isPremiumActive(user)
        ? `Ton offre ${PLAN_LABELS[user.plan]} et tous ses avantages`
        : "Découvre tous les avantages Premium",
      icon: Crown,
      iconClass: "text-amber-300 fill-amber-300/40",
      onClick: () => onNavigateTab("premium"),
    },
  ];

  const iconBg: Record<string, string> = {
    explorer: "bg-white/15 ring-white/30",
    matches: "bg-pink-500/15 ring-pink-400/25",
    profil: "bg-gradient-to-br from-indigo-500 to-violet-600 ring-indigo-300/30",
    premium: "bg-amber-400/15 ring-amber-300/30",
  };

  return (
    <Section index={1} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 lg:gap-4">
      {actions.map((action) => (
        <motion.button
          key={action.key}
          type="button"
          onClick={action.onClick}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "group relative flex items-center gap-4 overflow-hidden rounded-2xl p-4 text-left transition-shadow sm:p-5",
            action.featured
              ? "bg-gradient-to-br from-fuchsia-500 via-purple-600 to-violet-700 shadow-[0_12px_40px_-10px_rgba(192,38,211,0.7)] ring-1 ring-fuchsia-300/40"
              : cn(CARD, "hover:border-violet-300/30")
          )}
        >
          {action.featured && (
            <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
          )}
          <span
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-1 sm:h-16 sm:w-16",
              iconBg[action.key]
            )}
          >
            <action.icon className={cn("h-7 w-7", action.iconClass)} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-base font-semibold text-white">
              {action.title}
              <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
            </span>
            <span
              className={cn(
                "mt-1 block text-[13px] leading-snug",
                action.featured ? "text-white/85" : "text-white/60"
              )}
            >
              {action.text}
            </span>
          </span>
        </motion.button>
      ))}
    </Section>
  );
}

// ─────────────────────────────────────────────
// Carte profil + tuiles d'état
// ─────────────────────────────────────────────

function ProgressAvatar({
  user,
  completion,
}: {
  user: DashboardUser;
  completion: number;
}) {
  const size = 128;
  const stroke = 5;
  const r = (size - stroke * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (completion / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id="dash-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c026d3" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#dash-ring)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute" style={{ inset: stroke + 5 }}>
        <Avatar src={user.image} name={user.pseudonyme} size={size - (stroke + 5) * 2} />
      </div>
      <span className="absolute bottom-0.5 right-0.5 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[#1d0f3d] bg-emerald-500 text-[11px] font-bold text-white">
        {completion}%
      </span>
    </div>
  );
}

function StatTile({
  icon: Icon,
  iconWrap,
  label,
  value,
  check,
  onClick,
  children,
  className = "",
}: {
  icon: ElementType;
  iconWrap: string;
  label: string;
  value: string;
  check?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
}) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={cn(
        INNER_CARD,
        "flex min-w-0 flex-col justify-center gap-2 p-3 text-left transition sm:p-3.5",
        onClick && "hover:border-violet-300/30 hover:bg-[#1c0e3d]",
        className
      )}
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10", iconWrap)}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs text-white/55">{label}</span>
          <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-white">
            {value}
            {check && (
              <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500">
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </span>
            )}
          </span>
        </span>
      </div>
      {children}
    </Tag>
  );
}

function ProfileOverview({
  user,
  profileCompletion,
  onNavigateTab,
}: {
  user: DashboardUser;
  profileCompletion: number;
  onNavigateTab: (tab: DashboardTabId) => void;
}) {
  const active = isPremiumActive(user);
  const planLabel = active || user.plan === "free" ? PLAN_LABELS[user.plan] : `${PLAN_LABELS[user.plan]} (en attente)`;
  const subscriptionOk = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing";

  return (
    <Section index={2} className={cn(CARD, "p-4 sm:p-5 lg:p-6")}>
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center">
        {/* Identité */}
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left xl:w-[40%] xl:shrink-0 xl:border-r xl:border-violet-300/10 xl:pr-6">
          <ProgressAvatar user={user} completion={profileCompletion} />

          <div className="min-w-0 space-y-2.5">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="truncate text-xl font-bold text-violet-100 sm:text-2xl">{user.pseudonyme}</h2>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold",
                  user.plan === "free"
                    ? "border border-white/15 bg-white/10 text-white/70"
                    : "border border-amber-300/40 bg-amber-300/15 text-amber-200"
                )}
              >
                <Star className="h-3 w-3 fill-current" />
                {PLAN_LABELS[user.plan]}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-white/80 sm:justify-start">
              {user.age ? (
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4 text-fuchsia-300" /> {user.age} ans
                </span>
              ) : null}
              {user.localisation && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-fuchsia-300" /> {user.localisation}
                </span>
              )}
            </div>

            <p className="flex items-center justify-center gap-1.5 truncate text-sm text-white/70 sm:justify-start">
              <Mail className="h-4 w-4 shrink-0 text-fuchsia-300" />
              <span className="truncate">{user.email}</span>
            </p>

            {user._id && (
              <Link
                href={`/profil/${user._id}?preview=1`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl border border-violet-300/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-100 transition hover:border-fuchsia-300/50 hover:bg-fuchsia-500/10"
              >
                <Eye className="h-4 w-4" />
                Voir mon profil public
              </Link>
            )}
          </div>
        </div>

        {/* Tuiles d'état */}
        <div className="grid flex-1 grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
          <StatTile
            icon={BarChart3}
            iconWrap="bg-violet-500/20 text-violet-200"
            label="Profil complété"
            value={`${profileCompletion}%`}
            onClick={() => onNavigateTab("profil")}
          >
            <span className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <motion.span
                className="block h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                initial={{ width: 0 }}
                animate={{ width: `${profileCompletion}%` }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              />
            </span>
          </StatTile>

          <StatTile
            icon={ShieldCheck}
            iconWrap="bg-emerald-500/20 text-emerald-300"
            label="Compte"
            value={user.hasCompletedProfile ? "Validé" : "À compléter"}
            check={user.hasCompletedProfile}
          />

          <StatTile
            icon={Eye}
            iconWrap="bg-amber-400/15 text-amber-200"
            label="Visibilité"
            value={VISIBILITY_LABELS[user.visibilite] || user.visibilite}
            onClick={() => onNavigateTab("preferences")}
          />

          <StatTile
            icon={Star}
            iconWrap="bg-amber-400/15 text-amber-300"
            label="Plan actuel"
            value={planLabel}
            onClick={() => onNavigateTab("premium")}
          />

          <StatTile
            icon={CreditCard}
            iconWrap="bg-amber-400/15 text-amber-200"
            label="Abonnement"
            value={user.plan === "free" ? "Aucun" : SUBSCRIPTION_LABELS[user.subscriptionStatus] || "Inactif"}
            check={user.plan !== "free" && subscriptionOk}
            onClick={() => onNavigateTab("premium")}
          />

          <StatTile
            icon={Fingerprint}
            iconWrap="bg-sky-500/15 text-sky-200"
            label="Identité"
            value={user.identityVerified ? "Vérifiée" : "À vérifier"}
            check={Boolean(user.identityVerified)}
            onClick={user.identityVerified ? undefined : () => onNavigateTab("securite")}
          />
        </div>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────
// À faire aujourd'hui
// ─────────────────────────────────────────────

type Todo = {
  key: string;
  icon: ElementType;
  iconClass: string;
  title: string;
  text: string;
  badge?: number;
  href?: string;
  tab?: DashboardTabId;
};

function buildTodos(
  user: DashboardUser,
  data: DashboardData | null,
  profileCompletion: number
): Todo[] {
  const todos: Todo[] = [];
  const counts = data?.counts;

  if (!user.image) {
    todos.push({
      key: "photo",
      icon: Camera,
      iconClass: "bg-fuchsia-500/20 text-fuchsia-200",
      title: "Ajoute ta plus belle photo",
      text: "Les profils avec photo reçoivent bien plus de likes",
      tab: "profil",
    });
  } else if (profileCompletion < 100) {
    todos.push({
      key: "profile",
      icon: Sparkles,
      iconClass: "bg-fuchsia-500/20 text-fuchsia-200",
      title: "Termine ton profil",
      text: `Encore ${100 - profileCompletion}% pour briller dans les recherches`,
      tab: "profil",
    });
  }

  if (counts && counts.unreadMessages > 0) {
    todos.push({
      key: "messages",
      icon: MessageSquareText,
      iconClass: "bg-violet-500/25 text-violet-200",
      title: "Réponds à tes messages",
      text:
        counts.unreadMessages === 1
          ? "1 nouveau message t’attend"
          : `${counts.unreadMessages} nouveaux messages t’attendent`,
      badge: counts.unreadMessages,
      href: counts.firstUnreadMatchId ? `/messages/${counts.firstUnreadMatchId}` : "/matches",
    });
  } else if (counts && counts.silentMatches > 0) {
    todos.push({
      key: "icebreaker",
      icon: MessageSquareText,
      iconClass: "bg-violet-500/25 text-violet-200",
      title: "Brise la glace",
      text:
        counts.silentMatches === 1
          ? "1 match attend ton premier message"
          : `${counts.silentMatches} matchs attendent ton premier message`,
      href: "/matches",
    });
  }

  if (counts && counts.discoverable > 0) {
    const n = counts.newProfilesWeek > 0 ? counts.newProfilesWeek : counts.discoverable;
    const isNew = counts.newProfilesWeek > 0;
    todos.push({
      key: "discover",
      icon: Heart,
      iconClass: "bg-pink-500/20 text-pink-300 [&>svg]:fill-pink-300",
      title: `Découvre ${n} ${isNew ? "nouveau" : ""}${isNew && n > 1 ? "x" : ""} profil${n > 1 ? "s" : ""}`.replace(/\s+/g, " "),
      text: "Des personnes qui pourraient te plaire",
      href: "/explorer",
    });
  }

  if (data?.event) {
    const city = user.localisation?.trim();
    todos.push({
      key: "events",
      icon: CalendarDays,
      iconClass: "bg-fuchsia-500/20 text-fuchsia-200",
      title:
        data.event.mode === "local" && city
          ? `Explore les événements à ${city}`
          : "Explore les prochains événements",
      text:
        counts && counts.localEventsWeek > 0
          ? `${counts.localEventsWeek} rencontre${counts.localEventsWeek > 1 ? "s" : ""} dans ta ville cette semaine`
          : "Des rencontres en vrai ou en ligne",
      href: "/evenements",
    });
  }

  if (!user.identityVerified) {
    todos.push({
      key: "identity",
      icon: BadgeCheck,
      iconClass: "bg-sky-500/20 text-sky-200",
      title: "Vérifie ton identité",
      text: "Le badge vérifié rassure et inspire confiance",
      tab: "securite",
    });
  }

  return todos.slice(0, 4);
}

function TodoCard({
  user,
  data,
  isLoading,
  profileCompletion,
  onNavigateTab,
  className = "",
}: {
  user: DashboardUser;
  data: DashboardData | null;
  isLoading: boolean;
  profileCompletion: number;
  onNavigateTab: (tab: DashboardTabId) => void;
  className?: string;
}) {
  const todos = buildTodos(user, data, profileCompletion);

  return (
    <Section index={3} className={cn(CARD, "p-4 sm:p-6", className)}>
      <div className="mb-5 flex items-start gap-3">
        <CalendarDays className="mt-1 h-6 w-6 shrink-0 text-fuchsia-300" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-lg font-semibold text-white sm:text-xl">À faire aujourd’hui</h3>
            {!isLoading && todos.length > 0 && (
              <span className="rounded-lg bg-fuchsia-500/20 px-2.5 py-0.5 text-xs font-semibold text-fuchsia-200">
                {todos.length} action{todos.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-white/65">
            Quelques petites actions pour faire avancer ta belle aventure <span aria-hidden>✨</span>
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && !data ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-[68px] w-full rounded-xl" />)
        ) : todos.length === 0 ? (
          <div className={cn(INNER_CARD, "flex items-center gap-3 p-4 text-sm text-white/70")}>
            <Sparkles className="h-5 w-5 text-amber-200" />
            Tout est à jour, profite de ta soirée <span aria-hidden>🌙</span>
          </div>
        ) : (
          todos.map((todo) => {
            const body = (
              <>
                <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", todo.iconClass)}>
                  <todo.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold leading-snug text-white sm:truncate">{todo.title}</span>
                  <span className="block text-[13px] leading-snug text-white/60 sm:truncate">{todo.text}</span>
                </span>
                {!!todo.badge && <CountBadge value={todo.badge} className="h-6 min-w-[1.5rem]" />}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-violet-300/30 text-violet-100 transition group-hover:border-fuchsia-300/60 group-hover:bg-fuchsia-500/15">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </>
            );

            const cls = cn(
              INNER_CARD,
              "group flex w-full items-center gap-3.5 p-3 text-left transition hover:border-violet-300/25 hover:bg-[#1c0e3d] sm:px-4"
            );

            return todo.href ? (
              <Link key={todo.key} href={todo.href} className={cls}>
                {body}
              </Link>
            ) : (
              <button
                key={todo.key}
                type="button"
                onClick={() => todo.tab && onNavigateTab(todo.tab)}
                className={cls}
              >
                {body}
              </button>
            );
          })
        )}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────
// Intentions + progression
// ─────────────────────────────────────────────

const INTENTION_ICONS: Record<string, ElementType> = {
  "rencontre-serieuse": Heart,
  amitie: Users,
  aventure: Sparkles,
  reseautage: Briefcase,
  discussion: MessageSquareText,
};

function IntentionsCard({
  user,
  profileCompletion,
  missingFields,
  onNavigateTab,
  className = "",
}: {
  user: DashboardUser;
  profileCompletion: number;
  missingFields: MissingField[];
  onNavigateTab: (tab: DashboardTabId) => void;
  className?: string;
}) {
  const intentions = user.intentions || [];

  return (
    <Section index={4} className={cn(CARD, "flex flex-col gap-5 p-4 sm:p-6", className)}>
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2.5 text-lg font-semibold text-white">
              <Heart className="h-5 w-5 fill-fuchsia-400 text-fuchsia-400" />
              Tes intentions
            </h3>
            <p className="mt-0.5 text-sm text-white/60">Ce qui t’anime sur SferaLuna</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("preferences")}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-300/25 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/85 transition hover:border-fuchsia-300/50 hover:bg-fuchsia-500/10"
          >
            <Pencil className="h-3.5 w-3.5" /> Modifier
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          {intentions.length === 0 ? (
            <button
              type="button"
              onClick={() => onNavigateTab("preferences")}
              className="rounded-full border border-dashed border-violet-300/35 px-4 py-2 text-sm text-white/65 transition hover:border-fuchsia-300/60 hover:text-white"
            >
              + Ajouter mes intentions
            </button>
          ) : (
            intentions.map((intent, i) => {
              const Icon = INTENTION_ICONS[intent] || Sparkles;
              return (
                <span
                  key={intent}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium",
                    i === 0
                      ? "border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-50"
                      : "border-violet-300/30 bg-violet-500/10 text-violet-50"
                  )}
                >
                  <Icon className={cn("h-4 w-4", i === 0 ? "fill-pink-400 text-pink-400" : "text-violet-200")} />
                  {INTENTION_LABELS[intent] || intent}
                </span>
              );
            })
          )}
        </div>
      </div>

      <div className={cn(INNER_CARD, "mt-auto p-4 sm:p-5")}>
        <div className="flex items-center justify-between gap-3">
          <h4 className="flex items-center gap-2.5 text-base font-semibold text-white">
            <BarChart3 className="h-5 w-5 text-violet-300" /> Ta progression
          </h4>
          <span className="text-lg font-bold text-violet-200">{profileCompletion}%</span>
        </div>
        <p className="mt-1 text-sm text-white/60">
          {profileCompletion >= 100
            ? "Ton profil est complet ! Tu mets toutes les chances de ton côté."
            : "Complète ton profil pour apparaître dans plus de recherches."}
        </p>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${profileCompletion}%` }}
            transition={{ duration: 1.1, delay: 0.35, ease: "easeOut" }}
          />
        </div>

        {profileCompletion >= 100 ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-violet-300/10 bg-white/[0.03] p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/15">
              <Star className="h-5 w-5 fill-amber-300 text-amber-300" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">Profil au top !</span>
              <span className="block text-xs text-white/60">Tu as complété toutes les sections de ton profil.</span>
            </span>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {missingFields.slice(0, 4).map((field) => (
              <button
                key={field.key}
                type="button"
                onClick={() => onNavigateTab(field.key === "visibilite" || field.key === "intentions" || field.key === "orientation" ? "preferences" : "profil")}
                className="rounded-full border border-violet-300/25 bg-white/[0.04] px-3 py-1 text-xs text-white/80 transition hover:border-fuchsia-300/50 hover:text-white"
              >
                + {field.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────
// Cartes du bas : visites, matchs, événement
// ─────────────────────────────────────────────

function BottomCardHeader({
  icon: Icon,
  iconClass,
  title,
  action,
}: {
  icon: ElementType;
  iconClass: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2.5 text-base font-semibold text-white">
        <Icon className={cn("h-5 w-5", iconClass)} />
        {title}
      </h3>
      {action}
    </div>
  );
}

function SeeAll(props: { href?: string; onClick?: () => void }) {
  const cls =
    "inline-flex items-center gap-1 text-xs font-medium text-white/65 transition hover:text-white";
  const content = (
    <>
      Voir tout <ArrowRight className="h-3.5 w-3.5" />
    </>
  );
  return props.href ? (
    <Link href={props.href} className={cls}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={props.onClick} className={cls}>
      {content}
    </button>
  );
}

function MoreCircle({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-dashed border-violet-300/35 text-sm font-semibold text-white/80">
      +{count > 99 ? 99 : count}
    </span>
  );
}

function VisitorsCard({
  data,
  isLoading,
  onNavigateTab,
}: {
  data: DashboardData | null;
  isLoading: boolean;
  onNavigateTab: (tab: DashboardTabId) => void;
}) {
  const total = data?.counts.visitsWeek ?? 0;
  const locked = data?.visitors.locked ?? false;
  const items = data?.visitors.items ?? [];
  const DAY = 24 * 60 * 60 * 1000;

  return (
    <Section index={5} className={cn(CARD, "flex flex-col p-4 sm:p-5")}>
      <BottomCardHeader
        icon={Eye}
        iconClass="text-violet-300"
        title="Dernières visites"
        action={!locked && total > 0 ? <SeeAll onClick={() => onNavigateTab("connexions")} /> : undefined}
      />

      {isLoading && !data ? (
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-14 rounded-full" />
          ))}
        </div>
      ) : total === 0 ? (
        <p className="text-sm text-white/55">
          Pas encore de visite cette semaine. Un profil complet attire plus de regards <span aria-hidden>✨</span>
        </p>
      ) : locked ? (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-3">
            {Array.from({ length: Math.min(total, 5) }).map((_, i) => (
              <span
                key={i}
                className="h-14 w-14 rounded-full border-2 border-[#1d0f3d] bg-gradient-to-br from-fuchsia-400/70 to-violet-600/70 blur-[3px]"
              />
            ))}
          </div>
          <Link
            href="/paiement"
            className="ml-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-300/20"
          >
            <Lock className="h-3.5 w-3.5" /> Voir qui
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-3">
            {items.map((visitor) => {
              const recent = Date.now() - new Date(visitor.lastVisit).getTime() < DAY;
              return (
                <Link
                  key={visitor._id}
                  href={`/profil/${visitor._id}`}
                  title={visitor.pseudonyme}
                  className="relative rounded-full transition hover:z-10 hover:-translate-y-0.5"
                >
                  <Avatar src={visitor.image} name={visitor.pseudonyme} size={56} className="border-2 border-[#1d0f3d]" />
                  {recent && (
                    <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#1d0f3d] bg-emerald-400" />
                  )}
                </Link>
              );
            })}
          </div>
          <MoreCircle count={total - items.length} />
        </div>
      )}

      {total > 0 && (
        <p className="mt-auto pt-4 text-sm text-white/65">
          {total} personne{total > 1 ? "s ont" : " a"} visité ton profil cette semaine
        </p>
      )}
    </Section>
  );
}

function MatchesCard({ data, isLoading }: { data: DashboardData | null; isLoading: boolean }) {
  const items = data?.matches.items ?? [];
  const total = data?.counts.totalMatches ?? 0;
  const newWeek = data?.counts.newMatchesWeek ?? 0;

  return (
    <Section index={6} className={cn(CARD, "flex flex-col p-4 sm:p-5")}>
      <BottomCardHeader
        icon={Heart}
        iconClass="fill-pink-400 text-pink-400"
        title="Nouveaux matchs"
        action={total > 0 ? <SeeAll href="/matches" /> : undefined}
      />

      {isLoading && !data ? (
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-14 rounded-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-white/55">Ton premier match t’attend peut-être à un clic.</p>
          <Link
            href="/explorer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3.5 py-2 text-xs font-semibold text-white"
          >
            <Compass className="h-3.5 w-3.5" /> Explorer des profils
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-3">
            {items.map((match) => (
              <Link
                key={match.matchId}
                href={`/messages/${match.matchId}`}
                title={`Écrire à ${match.user.pseudonyme}`}
                className="rounded-full transition hover:z-10 hover:-translate-y-0.5"
              >
                <Avatar
                  src={match.user.image}
                  name={match.user.pseudonyme}
                  size={56}
                  className="rounded-full ring-2 ring-pink-400/80 ring-offset-2 ring-offset-[#1d0f3d]"
                />
              </Link>
            ))}
          </div>
          <MoreCircle count={total - items.length} />
        </div>
      )}

      {items.length > 0 && (
        <p className="mt-auto pt-4 text-sm text-white/65">
          {newWeek > 0
            ? `${newWeek} nouveau${newWeek > 1 ? "x" : ""} match${newWeek > 1 ? "s" : ""} cette semaine`
            : `${total} match${total > 1 ? "s" : ""} au total`}
        </p>
      )}
    </Section>
  );
}

function formatEventDate(date: string) {
  const d = new Date(date);
  const day = d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });
  const hour = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${hour}`;
}

function EventCard({
  user,
  data,
  isLoading,
  onRefresh,
  className = "",
}: {
  user: DashboardUser;
  data: DashboardData | null;
  isLoading: boolean;
  onRefresh: () => Promise<void> | void;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [override, setOverride] = useState<Partial<DashboardEvent> | null>(null);

  const baseEvent = data?.event ?? null;
  const event = baseEvent ? { ...baseEvent, ...(override?._id === baseEvent._id ? override : {}) } : null;

  const title =
    event?.mode === "online" ? "Événements en ligne" : event?.mode === "local" ? "Événements près de toi" : "Prochain événement";

  const toggle = async () => {
    if (!event || pending) return;
    setPending(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/events/${event._id}`, { method: "POST" });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setMessage(json?.error || "Inscription impossible pour le moment.");
        return;
      }

      setOverride({
        _id: event._id,
        isRegistered: json.registered,
        attendeeCount: json.attendeeCount,
        isFull: json.attendeeCount >= event.maxAttendees,
      });
      setMessage(json.registered ? "C’est noté, à très vite ! 🌙" : "Désinscription prise en compte.");
      await onRefresh();
      setOverride(null);
    } catch {
      setMessage("Connexion impossible.");
    } finally {
      setPending(false);
    }
  };

  const extra = event ? Math.max(0, event.attendeeCount - event.attendees.length) : 0;

  return (
    <Section index={7} className={cn(CARD, "flex flex-col p-4 sm:p-5", className)}>
      <BottomCardHeader
        icon={CalendarDays}
        iconClass="text-fuchsia-300"
        title={title}
        action={<SeeAll href="/evenements" />}
      />

      {isLoading && !data ? (
        <div className="flex gap-4">
          <Skeleton className="h-20 w-28 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ) : !event ? (
        <p className="text-sm text-white/55">
          Aucun événement programmé pour l’instant. On te prévient dès qu’un nouveau rendez-vous arrive
          {user.localisation ? ` à ${user.localisation}` : ""} <span aria-hidden>✨</span>
        </p>
      ) : (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-fuchsia-600/60 via-purple-700/60 to-indigo-800/70 sm:h-[88px] sm:w-28">
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,220,170,0.35),transparent_60%)]" />
            <span className="relative text-4xl drop-shadow-lg">{event.coverEmoji || event.emoji}</span>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="truncate text-[15px] font-semibold text-white">{event.title}</p>
            <p className="flex items-center gap-1.5 text-xs text-white/70">
              <CalendarDays className="h-3.5 w-3.5 text-fuchsia-300" />
              {formatEventDate(event.date)}
            </p>
            <p className="flex items-center gap-1.5 truncate text-xs text-white/70">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-fuchsia-300" />
              <span className="truncate">{event.isOnline ? "En ligne" : event.location}</span>
            </p>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {event.attendees.map((attendee) => (
                    <Avatar
                      key={attendee._id}
                      src={attendee.image}
                      name={attendee.pseudonyme}
                      size={28}
                      className="border-2 border-[#1d0f3d]"
                    />
                  ))}
                </div>
                {extra > 0 && (
                  <span className="ml-1.5 rounded-full bg-violet-500/25 px-2 py-0.5 text-[11px] font-semibold text-violet-100">
                    +{extra}
                  </span>
                )}
                {event.attendeeCount === 0 && (
                  <span className="text-[11px] text-white/50">Sois la première inscrite</span>
                )}
              </div>

              <button
                type="button"
                onClick={toggle}
                disabled={pending || (event.isFull && !event.isRegistered)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                  event.isRegistered
                    ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                    : "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/40 hover:brightness-110"
                )}
              >
                {pending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : event.isRegistered ? (
                  <Check className="h-3.5 w-3.5" />
                ) : null}
                {event.isRegistered ? "Inscrite" : event.isFull ? "Complet" : "Je participe"}
              </button>
            </div>

            {message && <p className="pt-1 text-[11px] text-white/60">{message}</p>}
          </div>
        </div>
      )}
    </Section>
  );
}
