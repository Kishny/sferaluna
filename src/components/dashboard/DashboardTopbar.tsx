// src/components/dashboard/DashboardTopbar.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  Compass,
  Crown,
  Eye,
  Heart,
  Loader2,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  User,
  Lock,
} from "lucide-react";

import { Avatar, cn } from "./shared";
import type { DashboardTabId, DashboardUser, NotificationCounts } from "./types";

// ─────────────────────────────────────────────
// Hook : clic en dehors
// ─────────────────────────────────────────────

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onOutside: () => void,
  active: boolean
) {
  useEffect(() => {
    if (!active) return;

    const handler = (event: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, onOutside, active]);
}

// ─────────────────────────────────────────────
// Recherche globale (⌘K / Ctrl+K)
// ─────────────────────────────────────────────

type PageShortcut = {
  label: string;
  keywords: string;
  icon: ElementType;
  href?: string;
  tab?: DashboardTabId;
};

const PAGE_SHORTCUTS: PageShortcut[] = [
  { label: "Vos découvertes du jour", keywords: "explorer decouvrir decouvertes selection profils", icon: Compass, href: "/explorer" },
  { label: "Explorer librement", keywords: "explorer librement parcourir profils", icon: Compass, href: "/explorer/libre" },
  { label: "Mes matchs & messages", keywords: "matchs messages conversations discussion", icon: MessageSquareText, href: "/matches" },
  { label: "Circle of Six", keywords: "circle six cercle affinites", icon: Sparkles, href: "/circle" },
  { label: "Événements", keywords: "evenements sorties apero rencontres lieux", icon: CalendarDays, href: "/evenements" },
  { label: "VibePlanner", keywords: "vibeplanner rendez-vous date idee", icon: Sparkles, href: "/vibeplanner" },
  { label: "Mode Fantôme", keywords: "mode fantome invisible discret", icon: Eye, href: "/mode-fantome" },
  { label: "Mon profil", keywords: "profil photos bio modifier", icon: User, tab: "profil" },
  { label: "Préférences", keywords: "preferences intentions visibilite orientation", icon: SlidersHorizontal, tab: "preferences" },
  { label: "Premium & abonnement", keywords: "premium abonnement offre plan paiement elite", icon: Crown, tab: "premium" },
  { label: "Sécurité", keywords: "securite mot de passe identite verification", icon: Lock, tab: "securite" },
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

type SearchResult =
  | { kind: "page"; id: string; label: string; icon: ElementType; href?: string; tab?: DashboardTabId }
  | { kind: "profile"; id: string; label: string; sub: string; image?: string; verified?: boolean }
  | { kind: "event"; id: string; label: string; sub: string; emoji?: string };

function SearchBox({
  onNavigateTab,
  className = "",
}: {
  onNavigateTab: (tab: DashboardTabId) => void;
  className?: string;
}) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remote, setRemote] = useState<{ profiles: any[]; events: any[] }>({
    profiles: [],
    events: [],
  });
  const [highlight, setHighlight] = useState(0);
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent));
  }, []);

  // Raccourci clavier ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Recherche serveur (debounce 250 ms)
  useEffect(() => {
    const q = query.trim();

    if (q.length < 2) {
      setRemote({ profiles: [], events: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/dashboard/search?q=${encodeURIComponent(q)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const json = await res.json().catch(() => null);
        if (json?.success) {
          setRemote({ profiles: json.profiles ?? [], events: json.events ?? [] });
        }
      } catch {
        // requête annulée ou réseau : silencieux
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const results = useMemo<SearchResult[]>(() => {
    const q = normalize(query.trim());

    const pages: SearchResult[] = PAGE_SHORTCUTS.filter(
      (page) => !q || normalize(page.label).includes(q) || page.keywords.includes(q)
    )
      .slice(0, q ? 4 : 6)
      .map((page) => ({
        kind: "page",
        id: page.label,
        label: page.label,
        icon: page.icon,
        href: page.href,
        tab: page.tab,
      }));

    const profiles: SearchResult[] = remote.profiles.map((p) => ({
      kind: "profile",
      id: String(p._id),
      label: p.pseudonyme,
      sub: [p.age ? `${p.age} ans` : "", p.localisation].filter(Boolean).join(" · "),
      image: p.image,
      verified: p.identityVerified,
    }));

    const events: SearchResult[] = remote.events.map((e) => ({
      kind: "event",
      id: String(e._id),
      label: e.title,
      sub: `${new Date(e.date).toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })} · ${e.isOnline ? "En ligne" : e.location}`,
      emoji: e.emoji,
    }));

    return [...profiles, ...events, ...pages];
  }, [query, remote]);

  useEffect(() => setHighlight(0), [results.length]);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(wrapperRef, close, open);

  const select = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();

    if (result.kind === "profile") router.push(`/profil/${result.id}`);
    else if (result.kind === "event") router.push(`/evenements#${result.id}`);
    else if (result.tab) onNavigateTab(result.tab);
    else if (result.href) router.push(result.href);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (results[highlight]) select(results[highlight]);
      else if (query.trim()) router.push("/explorer");
    } else if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const sections: { title: string; kind: SearchResult["kind"] }[] = [
    { title: "Personnes", kind: "profile" },
    { title: "Événements", kind: "event" },
    { title: "Accès rapide", kind: "page" },
  ];

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <label className="group flex h-12 items-center gap-3 rounded-2xl border border-violet-300/15 bg-[#1b0d3a]/70 px-4 backdrop-blur-xl transition focus-within:border-fuchsia-400/50 focus-within:bg-[#1f1044]/90 focus-within:shadow-[0_0_0_4px_rgba(192,38,211,0.12)]">
        <Search className="h-5 w-5 shrink-0 text-white/55" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Rechercher des personnes, événements, lieux…"
          className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-0"
          aria-label="Rechercher"
          role="combobox"
          aria-expanded={open}
          aria-controls="dashboard-search-results"
          autoComplete="off"
        />
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-white/50" />
        ) : (
          <kbd className="hidden items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-1 font-sans text-[11px] text-white/60 sm:inline-flex">
            {isMac ? "⌘" : "Ctrl"} K
          </kbd>
        )}
      </label>

      <AnimatePresence>
        {open && (
          <motion.div
            id="dashboard-search-results"
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-violet-300/15 bg-[#1a0c38]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          >
            {query.trim().length >= 2 &&
              !loading &&
              remote.profiles.length === 0 &&
              remote.events.length === 0 && (
                <p className="px-3 py-2 text-xs text-white/45">
                  Aucune personne ni événement pour « {query.trim()} ».
                </p>
              )}

            {sections.map((section) => {
              const items = results
                .map((result, index) => ({ result, index }))
                .filter(({ result }) => result.kind === section.kind);

              if (items.length === 0) return null;

              return (
                <div key={section.kind} className="py-1">
                  <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/35">
                    {section.title}
                  </p>
                  {items.map(({ result, index }) => {
                    const active = index === highlight;
                    return (
                      <button
                        key={`${result.kind}-${result.id}`}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onMouseEnter={() => setHighlight(index)}
                        onClick={() => select(result)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition",
                          active ? "bg-violet-500/20" : "hover:bg-white/5"
                        )}
                      >
                        {result.kind === "profile" && (
                          <Avatar src={result.image} name={result.label} size={34} />
                        )}
                        {result.kind === "event" && (
                          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-fuchsia-500/15 text-lg">
                            {result.emoji || "🌙"}
                          </span>
                        )}
                        {result.kind === "page" && (
                          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-violet-500/15">
                            <result.icon className="h-4 w-4 text-violet-200" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1 truncate text-sm font-medium text-white">
                            {result.label}
                            {result.kind === "profile" && result.verified && (
                              <BadgeCheck className="h-3.5 w-3.5 text-sky-300" />
                            )}
                          </span>
                          {"sub" in result && result.sub && (
                            <span className="block truncate text-xs text-white/50">{result.sub}</span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Cloche de notifications
// ─────────────────────────────────────────────

function NotificationBell({
  notifs,
  onOpen,
  onNavigateTab,
  messagesHref,
}: {
  notifs: NotificationCounts;
  onOpen: () => void;
  onNavigateTab: (tab: DashboardTabId) => void;
  messagesHref: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  // Snapshot affiché : on marque "lu" à l'ouverture sans vider la liste.
  const [snapshot, setSnapshot] = useState<NotificationCounts>(notifs);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const toggle = () => {
    if (!open) {
      setSnapshot(notifs);
      if (notifs.total > 0) onOpen();
    }
    setOpen((value) => !value);
  };

  const rows = [
    {
      key: "messages",
      show: snapshot.unreadMessages > 0,
      icon: MessageSquareText,
      label: `${snapshot.unreadMessages} nouveau${snapshot.unreadMessages > 1 ? "x" : ""} message${snapshot.unreadMessages > 1 ? "s" : ""}`,
      href: messagesHref,
    },
    {
      key: "matches",
      show: snapshot.newMatches > 0,
      icon: Heart,
      label: `${snapshot.newMatches} nouveau${snapshot.newMatches > 1 ? "x" : ""} match${snapshot.newMatches > 1 ? "s" : ""}`,
      tab: "connexions" as DashboardTabId,
    },
    {
      key: "visits",
      show: snapshot.newVisits > 0,
      icon: Eye,
      label: `${snapshot.newVisits} visite${snapshot.newVisits > 1 ? "s" : ""} de ton profil`,
      tab: "connexions" as DashboardTabId,
    },
  ].filter((row) => row.show);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative flex h-12 w-12 items-center justify-center rounded-full border border-violet-300/15 bg-[#1b0d3a]/70 text-white/80 backdrop-blur-xl transition hover:border-violet-300/35 hover:text-white"
        aria-label={`Notifications${notifs.total ? ` (${notifs.total} non lues)` : ""}`}
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {notifs.total > 0 && (
          <span className="absolute right-2.5 top-2.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-500/70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pink-500 ring-2 ring-[#1b0d3a]" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-violet-300/15 bg-[#1a0c38]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          >
            <p className="px-3 pb-2 pt-2 text-sm font-semibold text-white">Notifications</p>

            {rows.length === 0 ? (
              <p className="px-3 pb-3 text-sm text-white/50">
                Tout est calme pour l’instant <span aria-hidden>🌙</span>
              </p>
            ) : (
              rows.map((row) => {
                const inner = (
                  <>
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/15">
                      <row.icon className="h-4 w-4 text-pink-300" />
                    </span>
                    <span className="flex-1 text-sm text-white/85">{row.label}</span>
                  </>
                );

                return row.href ? (
                  <Link
                    key={row.key}
                    href={row.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-white/5"
                  >
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (row.tab) onNavigateTab(row.tab);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/5"
                  >
                    {inner}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Menu utilisatrice
// ─────────────────────────────────────────────

function UserMenu({
  user,
  onNavigateTab,
  onLogout,
}: {
  user: DashboardUser;
  onNavigateTab: (tab: DashboardTabId) => void;
  onLogout: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const go = (tab: DashboardTabId) => {
    setOpen(false);
    onNavigateTab(tab);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 items-center gap-3 rounded-full border border-violet-300/15 bg-[#1b0d3a]/70 py-1 pl-1 pr-2 backdrop-blur-xl transition hover:border-violet-300/35 sm:pr-4"
        aria-expanded={open}
        aria-label="Menu du compte"
      >
        <Avatar
          src={user.image}
          name={user.pseudonyme}
          size={40}
          className="ring-2 ring-fuchsia-400/60"
        />
        <span className="hidden max-w-[11rem] truncate text-sm font-semibold text-white md:block">
          {user.pseudonyme}
        </span>
        <ChevronDown
          className={cn("hidden h-4 w-4 text-white/60 transition-transform sm:block", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[calc(100%+10px)] z-50 w-60 rounded-2xl border border-violet-300/15 bg-[#1a0c38]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          >
            <div className="border-b border-white/10 px-3 pb-3 pt-2">
              <p className="truncate text-sm font-semibold text-white">{user.pseudonyme}</p>
              <p className="truncate text-xs text-white/50">{user.email}</p>
            </div>

            <div className="py-1">
              <button type="button" onClick={() => go("profil")} className="menu-item">
                <User className="h-4 w-4" /> Mon profil
              </button>
              {user._id && (
                <Link href={`/profil/${user._id}?preview=1`} target="_blank" className="menu-item">
                  <Eye className="h-4 w-4" /> Voir mon profil public
                </Link>
              )}
              <button type="button" onClick={() => go("premium")} className="menu-item">
                <Crown className="h-4 w-4" /> Mon abonnement
              </button>
              <button type="button" onClick={() => go("securite")} className="menu-item">
                <Lock className="h-4 w-4" /> Sécurité
              </button>
              {user.role === "admin" && (
                <Link href="/admin" className="menu-item text-amber-200">
                  <Shield className="h-4 w-4" /> Administration
                </Link>
              )}
            </div>

            <div className="border-t border-white/10 pt-1">
              <button type="button" onClick={onLogout} className="menu-item text-rose-200/90">
                <LogOut className="h-4 w-4" /> Déconnexion
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        :global(.menu-item) {
          display: flex;
          width: 100%;
          align-items: center;
          gap: 0.75rem;
          border-radius: 0.75rem;
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.8);
          transition: background 0.15s, color 0.15s;
          text-align: left;
        }
        :global(.menu-item:hover) {
          background: rgba(255, 255, 255, 0.06);
          color: white;
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// Barre supérieure
// ─────────────────────────────────────────────

export default function DashboardTopbar({
  user,
  notifs,
  messagesHref,
  onMarkNotificationsSeen,
  onNavigateTab,
  onLogout,
  onOpenMenu,
}: {
  user: DashboardUser;
  notifs: NotificationCounts;
  messagesHref: string;
  onMarkNotificationsSeen: () => void;
  onNavigateTab: (tab: DashboardTabId) => void;
  onLogout: () => void;
  onOpenMenu: () => void;
}) {
  return (
    <header className="relative z-30 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {/* Burger mobile */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-300/15 bg-[#1b0d3a]/70 text-white/80 backdrop-blur-xl lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <SearchBox
          onNavigateTab={onNavigateTab}
          className="hidden flex-1 sm:block sm:max-w-xl"
        />

        <div className="ml-auto flex items-center gap-2.5 sm:gap-4">
          <NotificationBell
            notifs={notifs}
            onOpen={onMarkNotificationsSeen}
            onNavigateTab={onNavigateTab}
            messagesHref={messagesHref}
          />
          <UserMenu user={user} onNavigateTab={onNavigateTab} onLogout={onLogout} />
        </div>
      </div>

      {/* Recherche pleine largeur sur mobile */}
      <SearchBox onNavigateTab={onNavigateTab} className="sm:hidden" />
    </header>
  );
}
