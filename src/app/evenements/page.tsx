// src/app/evenements/page.tsx

"use client";

/**
 * Événements Luna (LunaGather) — rencontres en ligne ou en présentiel.
 *
 * Données : GET /api/events (événements publiés, inscription de
 * l'utilisatrice, aperçu des participantes, organisatrice, chiffres réels).
 * Action : POST /api/events/[id] pour s'inscrire / se désinscrire.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  Loader2,
  MapPin,
  Sparkles,
  Tag,
  Users,
  Wifi,
} from "lucide-react";

import { ExplorerShell } from "@/components/explorer/shared";
import {
  Avatar,
  AvatarPile,
  BTN_GHOST,
  BTN_PRIMARY,
  EmptyState,
  ErrorBanner,
  Eyebrow,
  FilterPill,
  GradientText,
  LoadingBlock,
  PANEL,
  PANEL_FEATURED,
  PageTitle,
  PillRow,
  StatTile,
  capitalize,
} from "@/components/app/kit";
import { SceneArt, type SceneVariant } from "@/components/site/art";
import { cn } from "@/components/site/ui";

interface Person {
  _id: string;
  pseudonyme: string;
  image?: string;
}

interface LunaEvent {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  isOnline: boolean;
  maxAttendees: number;
  category: string;
  emoji: string;
  coverEmoji?: string;
  createdAt?: string;
  attendeeCount: number;
  attendeePreview?: Person[];
  organizer?: { pseudonyme: string; image?: string; identityVerified?: boolean; isTeam?: boolean } | null;
  isRegistered: boolean;
  isPast: boolean;
  isFull: boolean;
}

interface Stats {
  participantsPast: number;
  eventsThisYear: number;
  upcoming: number;
}

type Filter = "all" | "online" | "presentiel" | "upcoming" | "past" | "mine";

const WEEK = 7 * 24 * 60 * 60 * 1000;

const SCENES: SceneVariant[] = ["night", "rooftop", "hills", "river", "dusk"];

function eventDate(date: string) {
  const d = new Date(date);
  return {
    day: capitalize(d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric" })),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h"),
  };
}

function EventsContent() {
  const router = useRouter();
  const [events, setEvents] = useState<LunaEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [openId, setOpenId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/events", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/auth?mode=login&callbackUrl=%2Fevenements");
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Impossible de charger les événements.");
        return;
      }
      setEvents(data.events ?? []);
      setStats(data.stats ?? null);
    } catch {
      setError("Connexion au serveur impossible.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (event: LunaEvent) => {
    setTogglingId(event._id);
    setError("");
    try {
      const res = await fetch(`/api/events/${event._id}`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Action impossible pour le moment.");
        return;
      }
      setEvents((prev) =>
        prev.map((e) =>
          e._id === event._id
            ? { ...e, isRegistered: !!data.registered, attendeeCount: data.attendeeCount, isFull: data.attendeeCount >= e.maxAttendees }
            : e
        )
      );
    } catch {
      setError("Connexion au serveur impossible.");
    } finally {
      setTogglingId(null);
    }
  };

  const counts = useMemo(
    () => ({
      all: events.length,
      online: events.filter((e) => e.isOnline).length,
      presentiel: events.filter((e) => !e.isOnline).length,
      upcoming: events.filter((e) => !e.isPast).length,
      past: events.filter((e) => e.isPast).length,
      mine: events.filter((e) => e.isRegistered && !e.isPast).length,
    }),
    [events]
  );

  const visible = useMemo(() => {
    const list = events.filter((e) => {
      if (filter === "online") return e.isOnline;
      if (filter === "presentiel") return !e.isOnline;
      if (filter === "upcoming") return !e.isPast;
      if (filter === "past") return e.isPast;
      if (filter === "mine") return e.isRegistered && !e.isPast;
      return true;
    });
    // À venir d'abord (du plus proche au plus lointain), puis passés (du plus récent au plus ancien).
    return list.sort((a, b) => {
      if (a.isPast !== b.isPast) return a.isPast ? 1 : -1;
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return a.isPast ? db - da : da - db;
    });
  }, [events, filter]);

  const featuredId = visible.find((e) => !e.isPast)?._id;

  return (
    <ExplorerShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <PageTitle
          eyebrow={<Eyebrow icon={Users}>LunaGather</Eyebrow>}
          title={
            <>
              Événements <GradientText>Luna</GradientText> <span aria-hidden>🌙</span>
            </>
          }
          subtitle="Rencontrez-vous en vrai, en ligne ou en présentiel, dans une ambiance douce et sécurisée."
        />

        {stats && (stats.participantsPast > 0 || stats.eventsThisYear > 0) && (
          <div className="mx-auto mt-7 grid max-w-3xl grid-cols-3 gap-2.5 sm:gap-4">
            <StatTile icon={Users} value={stats.participantsPast} label="personnes déjà venues" tone="text-violet-300" />
            <StatTile icon={Heart} value={stats.eventsThisYear} label="événements cette année" />
            <StatTile icon={CalendarDays} value={stats.upcoming} label="à venir" tone="text-emerald-300" />
          </div>
        )}

        {error && (
          <div className="mt-6">
            <ErrorBanner message={error} onClose={() => setError("")} />
          </div>
        )}

        {loading ? (
          <LoadingBlock label="Chargement des événements…" />
        ) : events.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={CalendarDays}
              title="Aucun événement pour le moment"
              text="Les prochaines soirées, apéros virtuels et sorties LunaGather apparaîtront ici. Revenez bientôt !"
            />
          </div>
        ) : (
          <>
            <PillRow className="mt-7 sm:justify-center">
              <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
                Tous ({counts.all})
              </FilterPill>
              <FilterPill active={filter === "upcoming"} onClick={() => setFilter("upcoming")} icon={<CalendarDays className="h-4 w-4" />}>
                À venir ({counts.upcoming})
              </FilterPill>
              <FilterPill active={filter === "online"} onClick={() => setFilter("online")} icon={<span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />}>
                En ligne ({counts.online})
              </FilterPill>
              <FilterPill active={filter === "presentiel"} onClick={() => setFilter("presentiel")} icon={<MapPin className="h-4 w-4 text-pink-300" />}>
                Présentiel ({counts.presentiel})
              </FilterPill>
              {counts.mine > 0 && (
                <FilterPill active={filter === "mine"} onClick={() => setFilter("mine")} icon={<CalendarCheck className="h-4 w-4" />}>
                  Mes inscriptions ({counts.mine})
                </FilterPill>
              )}
              {counts.past > 0 && (
                <FilterPill active={filter === "past"} onClick={() => setFilter("past")} icon={<Clock className="h-4 w-4" />}>
                  Passés ({counts.past})
                </FilterPill>
              )}
            </PillRow>

            <div className="mt-6 space-y-5">
              {visible.length === 0 && (
                <p className={cn(PANEL, "px-6 py-10 text-center text-sm text-white/65")}>Aucun événement dans cette catégorie.</p>
              )}
              {visible.map((event, index) => (
                <EventCard
                  key={event._id}
                  event={event}
                  index={index}
                  featured={event._id === featuredId}
                  open={openId === event._id}
                  onToggleOpen={() => setOpenId(openId === event._id ? null : event._id)}
                  onRegister={() => toggle(event)}
                  pending={togglingId === event._id}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </ExplorerShell>
  );
}

function EventCard({
  event,
  index,
  featured,
  open,
  onToggleOpen,
  onRegister,
  pending,
}: {
  event: LunaEvent;
  index: number;
  featured: boolean;
  open: boolean;
  onToggleOpen: () => void;
  onRegister: () => void;
  pending: boolean;
}) {
  const { day, time } = eventDate(event.date);
  const placesLeft = Math.max(0, event.maxAttendees - event.attendeeCount);
  const isNew = event.createdAt ? Date.now() - new Date(event.createdAt).getTime() < WEEK && !event.isPast : false;
  const preview = event.attendeePreview ?? [];
  const extra = Math.max(0, event.attendeeCount - preview.length);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      className={cn(featured ? PANEL_FEATURED : PANEL, "p-4 sm:p-5", event.isPast && "opacity-80")}
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)_220px]">
        {/* Visuel */}
        <div className="relative h-44 overflow-hidden rounded-2xl sm:h-48 md:h-full md:min-h-[190px]">
          <SceneArt variant={SCENES[index % SCENES.length]} seed={index + 3} className="absolute inset-0" />
          <span className="absolute inset-0 flex items-center justify-center text-6xl drop-shadow-[0_6px_20px_rgba(0,0,0,0.45)]" aria-hidden>
            {event.coverEmoji || event.emoji}
          </span>
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-sm font-medium text-white backdrop-blur">
            {event.isOnline ? (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> En ligne
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 text-pink-300" /> Présentiel
              </>
            )}
          </span>
        </div>

        {/* Contenu */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {isNew && (
              <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-fuchsia-500 to-pink-500 px-2 py-0.5 text-xs font-semibold text-white">
                <Sparkles className="h-3 w-3" /> Nouveau
              </span>
            )}
            {event.isPast && <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/70">Terminé</span>}
          </div>
          <h2 className="mt-1.5 text-xl font-bold text-white sm:text-2xl">{event.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-fuchsia-300" /> {day} à {time}
            </span>
            <span className="flex items-center gap-1.5">
              {event.isOnline ? <Wifi className="h-4 w-4 text-fuchsia-300" /> : <MapPin className="h-4 w-4 text-fuchsia-300" />}
              {event.location}
            </span>
          </div>

          {event.organizer && (
            <p className="mt-3 flex items-center gap-2 text-sm text-white/85">
              <Avatar src={event.organizer.isTeam ? "/logo-sferaluna.png" : event.organizer.image} name={event.organizer.pseudonyme} size={32} />
              Organisé par {event.organizer.pseudonyme}
              {event.organizer.identityVerified && <BadgeCheck className="h-4 w-4 text-fuchsia-300" aria-label="Vérifiée" />}
            </p>
          )}

          <p className={cn("mt-3 text-sm leading-relaxed text-white/75", !open && "line-clamp-2")}>{event.description}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 bg-violet-500/10 px-3 py-1 text-xs text-violet-50">
              <Tag className="h-3.5 w-3.5 text-fuchsia-300" /> {capitalize(event.category)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 bg-violet-500/10 px-3 py-1 text-xs text-violet-50">
              <Users className="h-3.5 w-3.5 text-fuchsia-300" /> {event.maxAttendees} places
            </span>
          </div>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid gap-2 rounded-2xl border border-violet-300/15 bg-white/[0.03] p-4 text-sm text-white/80 sm:grid-cols-2">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-fuchsia-300" /> {day}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-fuchsia-300" /> {time}
                  </p>
                  <p className="flex items-center gap-2 sm:col-span-2">
                    {event.isOnline ? <Wifi className="h-4 w-4 text-fuchsia-300" /> : <MapPin className="h-4 w-4 text-fuchsia-300" />}
                    {event.location}
                  </p>
                  {event.isRegistered && !event.isPast && (
                    <p className="flex items-center gap-2 text-emerald-200 sm:col-span-2">
                      <Check className="h-4 w-4" /> Vous êtes inscrite. Les détails pratiques vous seront communiqués avant l’événement.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Participantes + actions */}
        <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-1 lg:items-end lg:text-right">
          <div className="flex items-center gap-3 lg:flex-col lg:items-end lg:gap-1.5">
            <AvatarPile people={preview} extra={extra} />
            <div>
              <p className="text-sm text-white/80">
                {event.attendeeCount} participante{event.attendeeCount > 1 ? "s" : ""}
              </p>
              {!event.isPast &&
                (event.isFull ? (
                  <p className="text-xs font-semibold text-rose-300">Complet</p>
                ) : placesLeft <= 10 ? (
                  <p className="text-xs font-semibold text-fuchsia-300">
                    Plus que {placesLeft} place{placesLeft > 1 ? "s" : ""}
                  </p>
                ) : (
                  <p className="text-xs text-emerald-300">Places disponibles</p>
                ))}
            </div>
          </div>

          <div className="mt-auto grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
            {!event.isPast &&
              (event.isRegistered ? (
                <button type="button" onClick={onRegister} disabled={pending} className={cn(BTN_GHOST, "h-11 border-emerald-300/40 text-emerald-100")}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Inscrite · annuler
                </button>
              ) : (
                <button type="button" onClick={onRegister} disabled={pending || event.isFull} className={cn(BTN_PRIMARY, "h-11")}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                  {event.isFull ? "Complet" : "Je participe"}
                  {!event.isFull && <ChevronRight className="h-4 w-4" />}
                </button>
              ))}
            <button type="button" onClick={onToggleOpen} className={cn(BTN_GHOST, "h-11 whitespace-nowrap", event.isPast && "sm:col-span-2 lg:col-span-1")} aria-expanded={open}>
              <Eye className="h-4 w-4" /> {open ? "Masquer les détails" : "Voir l’événement"}
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function EvenementsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#12081f]" />}>
      <EventsContent />
    </Suspense>
  );
}
