// src/components/dashboard/DashboardSidebar.tsx

"use client";

import Link from "next/link";
import type { ElementType } from "react";
import {
  CalendarDays,
  ChevronRight,
  Compass,
  Crown,
  Heart,
  Home,
  Lock,
  MessageSquareText,
  Moon,
  Shield,
  SlidersHorizontal,
  Sparkles,
  User,
  X,
} from "lucide-react";

import HexagonSix from "@/components/icons/HexagonSix";
import { CountBadge, cn } from "./shared";
import type { DashboardData, DashboardTabId, DashboardUser } from "./types";

type NavItem = {
  key: string;
  label: string;
  icon: ElementType;
  tab?: DashboardTabId;
  href?: string;
  badge?: number;
  locked?: boolean;
  highlight?: boolean;
};

function CircleIcon({ className }: { className?: string }) {
  return <HexagonSix size={22} className={className} />;
}

export default function DashboardSidebar({
  user,
  activeTab,
  onNavigate,
  data,
  interactionsBadge,
  premiumActive,
  onClose,
}: {
  user: DashboardUser;
  activeTab: DashboardTabId;
  onNavigate: (tab: DashboardTabId) => void;
  data: DashboardData | null;
  interactionsBadge: number;
  premiumActive: boolean;
  /** Fourni en mode tiroir mobile. */
  onClose?: () => void;
}) {
  const features = data?.features;

  const mainItems: NavItem[] = [
    { key: "dashboard", label: "Tableau de bord", icon: Home, tab: "dashboard" },
    {
      key: "explorer",
      label: "Explorer librement",
      icon: Compass,
      href: "/explorer",
      highlight: true,
    },
    {
      key: "circle",
      label: "Circle of Six",
      icon: CircleIcon,
      href: "/circle",
      locked: features ? !features.circleOfSix : false,
    },
    {
      key: "messages",
      label: "Messages",
      icon: MessageSquareText,
      href: data?.counts.firstUnreadMatchId
        ? `/messages/${data.counts.firstUnreadMatchId}`
        : "/matches",
      badge: data?.counts.unreadMessages ?? 0,
    },
    { key: "evenements", label: "Événements", icon: CalendarDays, href: "/evenements" },
    {
      key: "vibeplanner",
      label: "VibePlanner",
      icon: Sparkles,
      href: "/vibeplanner",
      locked: features ? !features.vibePlanner : false,
    },
  ];

  const accountItems: NavItem[] = [
    { key: "connexions", label: "Mes interactions", icon: Heart, tab: "connexions", badge: interactionsBadge },
    { key: "profil", label: "Mon profil", icon: User, tab: "profil" },
    { key: "preferences", label: "Préférences", icon: SlidersHorizontal, tab: "preferences" },
    { key: "premium", label: "Premium", icon: Crown, tab: "premium" },
    { key: "securite", label: "Sécurité", icon: Lock, tab: "securite" },
  ];

  const isElite = premiumActive && user.plan === "elite-monthly";

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = item.tab !== undefined && item.tab === activeTab;

    const className = cn(
      "group relative flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-[15px] font-medium transition-all duration-200",
      item.highlight
        ? "bg-gradient-to-r from-fuchsia-600 via-purple-600 to-violet-600 text-white shadow-[0_8px_28px_-6px_rgba(192,38,211,0.65)] ring-1 ring-fuchsia-300/40 hover:brightness-110"
        : isActive
          ? "bg-gradient-to-r from-violet-500/30 to-fuchsia-500/10 text-white ring-1 ring-violet-300/30"
          : "text-white/70 hover:bg-white/[0.06] hover:text-white"
    );

    const content = (
      <>
        <Icon
          className={cn(
            "h-[22px] w-[22px] shrink-0",
            item.highlight ? "text-white" : isActive ? "text-violet-200" : "text-violet-300/80"
          )}
        />
        <span className="flex-1 truncate text-left">{item.label}</span>
        {item.locked && <Lock className="h-3.5 w-3.5 text-white/35" aria-label="Réservé aux abonnées" />}
        {!!item.badge && <CountBadge value={item.badge} />}
        {item.highlight && (
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        )}
      </>
    );

    if (item.href) {
      return (
        <Link key={item.key} href={item.href} className={className} onClick={onClose}>
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.key}
        type="button"
        className={className}
        aria-current={isActive ? "page" : undefined}
        onClick={() => {
          if (item.tab) onNavigate(item.tab);
          onClose?.();
        }}
      >
        {content}
      </button>
    );
  };

  return (
    <aside className="flex h-full w-full flex-col gap-6 overflow-y-auto px-4 pb-5 pt-6">
      {/* Marque */}
      <div className="flex items-start justify-between gap-2 px-2">
        <Link href="/" className="flex items-center gap-3" onClick={onClose}>
          <span className="relative flex h-12 w-12 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-fuchsia-500/30 blur-lg" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-sferaluna.png"
              alt=""
              className="relative h-11 w-11 rounded-full object-cover"
            />
          </span>
          <span>
            <span className="block text-2xl font-semibold tracking-tight text-white">
              SferaLuna
            </span>
            <span className="block text-xs leading-snug text-white/55">
              Rencontres vraies,
              <br />
              vies plus grandes.
            </span>
          </span>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1.5" aria-label="Navigation principale">
        {mainItems.map(renderItem)}
      </nav>

      <div className="mx-3 h-px bg-gradient-to-r from-transparent via-violet-300/25 to-transparent" />

      <nav className="flex flex-col gap-1.5" aria-label="Mon compte">
        {accountItems.map(renderItem)}
        {user.role === "admin" && (
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-3.5 rounded-xl px-4 py-3 text-[15px] font-medium text-amber-200/90 transition hover:bg-amber-300/10"
          >
            <Shield className="h-[22px] w-[22px]" />
            Administration
          </Link>
        )}
      </nav>

      {/* Carte énergie / upsell */}
      <div className="mt-auto rounded-2xl border border-violet-300/15 bg-gradient-to-br from-[#2b1462] to-[#1b0c3c] p-4">
        <div className="mb-4 flex items-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-amber-200/20 blur-md" />
            <Moon className="relative h-8 w-8 fill-amber-100/90 text-amber-100" />
          </span>
          <p className="text-sm leading-snug text-white/80">
            {isElite ? (
              <>Tu rayonnes en Elite <span aria-hidden>👑</span></>
            ) : (
              <>
                Fais rayonner
                <br />
                ta belle énergie <span aria-hidden>✨</span>
              </>
            )}
          </p>
        </div>

        {isElite ? (
          <button
            type="button"
            onClick={() => {
              onNavigate("premium");
              onClose?.();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300/60 bg-amber-300/10 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-300/20"
          >
            <Crown className="h-4 w-4" />
            Gérer mon abonnement
          </button>
        ) : (
          <Link
            href="/paiement"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300/70 bg-gradient-to-r from-amber-300/15 to-yellow-300/10 px-4 py-2.5 text-sm font-semibold text-amber-200 shadow-[0_0_20px_-6px_rgba(252,211,77,0.6)] transition hover:from-amber-300/25"
          >
            <Crown className="h-4 w-4" />
            {premiumActive ? "Passer Elite" : "Passer Premium"}
          </Link>
        )}
      </div>
    </aside>
  );
}
