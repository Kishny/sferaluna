"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Monitor,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  CalendarDays,
  Sparkles,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

/**
 * Type principal d'un événement Luna.
 * Ces données viennent de l'API /api/events.
 */
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
  coverEmoji: string;
  attendeeCount: number;
  isRegistered: boolean;
  isPast: boolean;
  isFull: boolean;
}

/**
 * Filtres disponibles sur la page.
 */
type Filter = "all" | "online" | "presentiel";

/**
 * Formate la date complète pour desktop / détails.
 */
function formatDate(dateStr: string) {
  const date = new Date(dateStr);

  return (
    date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }) +
    " à " +
    date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

/**
 * Version courte de la date pour mobile.
 */
function formatShortDate(dateStr: string) {
  const date = new Date(dateStr);

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Heure courte pour mobile.
 */
function formatTime(dateStr: string) {
  const date = new Date(dateStr);

  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Met la première lettre en majuscule.
 */
function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Motif orbite décoratif (cercles concentriques + points d'accent),
 * écho visuel du nom "Sfera".
 */
function OrbitGlow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute opacity-[0.14] ${className}`}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="90" fill="none" stroke="#8E7AB5" strokeWidth="1" />
      <circle
        cx="100"
        cy="100"
        r="62"
        fill="none"
        stroke="#8E7AB5"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
      <circle cx="100" cy="100" r="34" fill="none" stroke="#8E7AB5" strokeWidth="1" />
      <circle cx="100" cy="10" r="3" fill="#5B4B8A" />
      <circle cx="190" cy="100" r="3" fill="#5B4B8A" />
      <circle cx="100" cy="190" r="3" fill="#5B4B8A" />
      <circle cx="10" cy="100" r="3" fill="#5B4B8A" />
    </svg>
  );
}

/**
 * Palette tournante par événement — chaque carte reçoit une identité
 * couleur distincte (la catégorie étant une chaîne libre côté API).
 */
const eventThemes = [
  { cover: "from-[#FF9A3C]/20 to-[#FFD166]/20", badgeBg: "bg-[#FF9A3C]/10", badgeText: "text-[#C9762A]" },
  { cover: "from-[#9D4EDD]/20 to-[#C77DFF]/20", badgeBg: "bg-[#9D4EDD]/10", badgeText: "text-[#7E3BBE]" },
  { cover: "from-[#FF6B6B]/20 to-[#FF9A9A]/20", badgeBg: "bg-[#FF6B6B]/10", badgeText: "text-[#E0504F]" },
  { cover: "from-[#4ECDC4]/20 to-[#8FE9E0]/20", badgeBg: "bg-[#4ECDC4]/10", badgeText: "text-[#2F9D94]" },
  { cover: "from-[#D9B8FF]/30 to-[#F0E0FF]/30", badgeBg: "bg-[#D9B8FF]/15", badgeText: "text-[#7E3BBE]" },
  { cover: "from-purple-100 to-pink-100", badgeBg: "bg-purple-50", badgeText: "text-[#5B4B8A]" },
];

export default function EvenementsPage() {
  const { status } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState<LunaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  /**
   * Accordéon mobile pour les événements à venir.
   * null = aucun événement ouvert.
   */
  const [openEventId, setOpenEventId] = useState<string | null>(null);

  /**
   * Accordéon mobile pour les événements passés.
   * null = aucun événement passé ouvert.
   */
  const [openPastEventId, setOpenPastEventId] = useState<string | null>(null);

  /**
   * Redirection si l'utilisateur n'est pas connecté.
   */
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  /**
   * Charge les événements depuis l'API.
   */
  const fetchEvents = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/events");
      const data = await res.json();

      if (data.success) setEvents(data.events);
    } catch {
      // On reste silencieux pour éviter de casser l'interface.
      // Tu pourras ajouter un state error plus tard si besoin.
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Premier chargement lorsque l'utilisateur est connecté.
   */
  useEffect(() => {
    if (status === "authenticated") fetchEvents();
  }, [status, fetchEvents]);

  /**
   * Inscription / désinscription à un événement.
   */
  const handleToggleRegistration = async (eventId: string) => {
    setTogglingId(eventId);

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        setEvents((prev) =>
          prev.map((event) =>
            event._id === eventId
              ? {
                  ...event,
                  isRegistered: data.registered,
                  attendeeCount: data.attendeeCount,
                  isFull: data.attendeeCount >= event.maxAttendees,
                }
              : event
          )
        );
      }
    } catch {
      // Silencieux pour le moment.
    } finally {
      setTogglingId(null);
    }
  };

  /**
   * Événements à venir filtrés.
   */
  const upcomingEvents = events.filter((event) => {
    if (event.isPast) return false;
    if (filter === "online") return event.isOnline;
    if (filter === "presentiel") return !event.isOnline;
    return true;
  });

  /**
   * Événements passés.
   */
  const pastEvents = events.filter((event) => event.isPast);

  /**
   * Compteur affiché dans le hero.
   */
  const upcomingCount = upcomingEvents.length;

  if (status === "loading" || loading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff]">
          <Header />

          <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-[#8E7AB5]">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Chargement des événements…</p>
          </div>
        </div>

        <div className="hidden sm:block">
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff]">
        <OrbitGlow className="right-[-8%] top-20 h-72 w-72 sm:h-96 sm:w-96" />
        <OrbitGlow className="left-[-10%] top-[65%] h-80 w-80 sm:h-[28rem] sm:w-[28rem]" />

        <Header />

        <main className="relative z-10 mx-auto max-w-4xl px-3 pb-8 pt-20 sm:px-4 sm:pb-16 sm:pt-24">
          {/* Header compact */}
          <motion.section
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 overflow-hidden rounded-3xl border border-[#e8e0f5] bg-white/75 p-4 text-center shadow-sm backdrop-blur sm:mb-8 sm:bg-transparent sm:p-0 sm:shadow-none sm:border-0"
          >
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#8E7AB5]/20 bg-[#8E7AB5]/10 px-3 py-1 text-xs font-medium text-[#5B4B8A] sm:mb-4 sm:px-4 sm:py-1.5 sm:text-sm">
              <Sparkles className="h-3.5 w-3.5" />
              LunaGather
            </div>

            <h1 className="text-2xl font-bold text-[#2d1b69] sm:text-3xl md:text-4xl">
              Événements Luna 🌙
            </h1>

            <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-[#8E7AB5] sm:mt-2 sm:text-base">
              Rencontrez-vous en vrai, en ligne ou en présentiel, dans une
              ambiance douce et sécurisée.
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2 sm:mx-auto sm:max-w-md">
              <div className="rounded-2xl bg-[#f7f0ff] px-2 py-2">
                <p className="text-base font-bold text-[#5B4B8A]">
                  {upcomingCount}
                </p>
                <p className="text-[10px] text-[#8E7AB5] sm:text-xs">
                  à venir
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f0ff] px-2 py-2">
                <p className="text-base font-bold text-[#5B4B8A]">
                  {pastEvents.length}
                </p>
                <p className="text-[10px] text-[#8E7AB5] sm:text-xs">
                  passés
                </p>
              </div>

              <div className="rounded-2xl bg-[#f7f0ff] px-2 py-2">
                <p className="text-base font-bold text-[#5B4B8A]">Luna</p>
                <p className="text-[10px] text-[#8E7AB5] sm:text-xs">
                  safe place
                </p>
              </div>
            </div>
          </motion.section>

          {/* Filtres compacts */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-4 flex justify-center gap-2 overflow-x-auto pb-1 sm:mb-8 sm:flex-wrap"
          >
            {(["all", "online", "presentiel"] as Filter[]).map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all sm:px-5 sm:text-sm ${
                  filter === item
                    ? "border-transparent bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                    : "border-[#e8e0f5] bg-white text-[#5B4B8A] hover:bg-purple-50"
                }`}
              >
                {item === "all"
                  ? "Tous"
                  : item === "online"
                    ? "En ligne"
                    : "Présentiel"}
              </button>
            ))}
          </motion.div>

          {/* Événements à venir */}
          {upcomingEvents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl border border-[#e8e0f5] bg-white/70 px-4 py-10 text-center text-[#8E7AB5] shadow-sm sm:py-12"
            >
              <p className="mb-3 text-4xl sm:text-5xl">🌙</p>

              <p className="text-base font-semibold sm:text-lg">
                Aucun événement à venir pour le moment.
              </p>

              <p className="mt-2 text-sm">
                Revenez bientôt, de nouveaux événements arrivent.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Mobile : accordéons compacts */}
              <div className="space-y-2.5 sm:hidden">
                {upcomingEvents.map((event, index) => {
                  const isOpen = openEventId === event._id;
                  const theme = eventThemes[index % eventThemes.length];

                  return (
                    <motion.article
                      key={event._id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.04, 0.25) }}
                      className="overflow-hidden rounded-2xl border border-[#e8e0f5] bg-white shadow-sm"
                    >
                      {/* Résumé compact */}
                      <button
                        type="button"
                        onClick={() =>
                          setOpenEventId(isOpen ? null : event._id)
                        }
                        className="flex w-full items-center gap-3 px-3 py-3 text-left"
                      >
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.cover} text-2xl`}
                        >
                          {event.coverEmoji || event.emoji}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                event.isOnline
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-green-50 text-green-600"
                              }`}
                            >
                              {event.isOnline ? (
                                <>
                                  <Monitor size={10} />
                                  En ligne
                                </>
                              ) : (
                                <>
                                  <MapPin size={10} />
                                  Présentiel
                                </>
                              )}
                            </span>

                            {event.isRegistered && (
                              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-[#8E7AB5]">
                                Inscrite
                              </span>
                            )}

                            {event.isFull && !event.isRegistered && (
                              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-500">
                                Complet
                              </span>
                            )}
                          </div>

                          <h3 className="truncate text-sm font-bold text-[#2d1b69]">
                            {event.title}
                          </h3>

                          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#8E7AB5]">
                            <CalendarDays size={11} />
                            <span>
                              {formatShortDate(event.date)} ·{" "}
                              {formatTime(event.date)}
                            </span>
                          </p>
                        </div>

                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-[#8E7AB5] transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Détails accordéon */}
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-[#f0ecff] px-3 pb-3 pt-3">
                              <div className="mb-3 flex flex-wrap gap-1.5">
                                <span
                                  className={`rounded-full border border-[#e8e0f5] px-2.5 py-1 text-[11px] ${theme.badgeBg} ${theme.badgeText}`}
                                >
                                  {event.emoji} {event.category}
                                </span>

                                <span className="inline-flex items-center gap-1 rounded-full border border-[#e8e0f5] bg-white px-2.5 py-1 text-[11px] text-[#8E7AB5]">
                                  <Users size={11} />
                                  {event.attendeeCount}/{event.maxAttendees}
                                </span>
                              </div>

                              <p className="mb-3 text-xs leading-relaxed text-[#8E7AB5]">
                                {event.description}
                              </p>

                              <p className="mb-2 text-xs font-medium text-[#5B4B8A]">
                                📅 {capitalize(formatDate(event.date))}
                              </p>

                              {!event.isOnline && (
                                <p className="mb-3 flex items-center gap-1 text-xs text-[#8E7AB5]">
                                  <MapPin size={12} />
                                  {event.location}
                                </p>
                              )}

                              <button
                                onClick={() =>
                                  handleToggleRegistration(event._id)
                                }
                                disabled={
                                  togglingId === event._id ||
                                  (event.isFull && !event.isRegistered)
                                }
                                className={`w-full rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-50 ${
                                  event.isRegistered
                                    ? "border border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200"
                                    : event.isFull
                                      ? "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400"
                                      : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500"
                                }`}
                              >
                                {togglingId === event._id
                                  ? "…"
                                  : event.isRegistered
                                    ? "Me désinscrire"
                                    : event.isFull
                                      ? "Complet"
                                      : "Je participe ✨"}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.article>
                  );
                })}
              </div>

              {/* Desktop / tablette : cards complètes */}
              <div className="hidden grid-cols-2 gap-5 sm:grid">
                {upcomingEvents.map((event, index) => {
                  const theme = eventThemes[index % eventThemes.length];

                  return (
                  <motion.article
                    key={event._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    className="overflow-hidden rounded-2xl border border-[#e8e0f5] bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    {/* Cover */}
                    <div
                      className={`flex h-24 items-center justify-center bg-gradient-to-br ${theme.cover} text-5xl`}
                    >
                      {event.coverEmoji || event.emoji}
                    </div>

                    <div className="p-5">
                      {/* Badges */}
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border border-[#e8e0f5] px-2.5 py-1 text-xs ${theme.badgeBg} ${theme.badgeText}`}
                        >
                          {event.emoji} {event.category}
                        </span>

                        {event.isOnline ? (
                          <span className="flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs text-blue-600">
                            <Monitor size={10} /> En ligne
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-xs text-green-600">
                            <MapPin size={10} /> Présentiel
                          </span>
                        )}

                        {event.isFull && !event.isRegistered && (
                          <span className="rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs text-red-500">
                            Complet
                          </span>
                        )}
                      </div>

                      <h3 className="mb-2 font-bold text-[#2d1b69]">
                        {event.title}
                      </h3>

                      <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-[#8E7AB5]">
                        {event.description}
                      </p>

                      {/* Date */}
                      <p className="mb-2 text-xs font-medium text-[#5B4B8A]">
                        📅 {capitalize(formatDate(event.date))}
                      </p>

                      {/* Lieu */}
                      {!event.isOnline && (
                        <div className="mb-3 flex items-center gap-1 text-xs text-[#8E7AB5]">
                          <MapPin size={11} />
                          {event.location}
                        </div>
                      )}

                      {/* Participantes */}
                      <div className="mb-4 flex items-center gap-1 text-xs text-[#8E7AB5]">
                        <Users size={11} />

                        <span>
                          <span className="font-semibold text-[#5B4B8A]">
                            {event.attendeeCount}
                          </span>{" "}
                          / {event.maxAttendees} participantes
                        </span>
                      </div>

                      {/* Bouton inscription */}
                      <button
                        onClick={() => handleToggleRegistration(event._id)}
                        disabled={
                          togglingId === event._id ||
                          (event.isFull && !event.isRegistered)
                        }
                        className={`w-full rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-50 ${
                          event.isRegistered
                            ? "border border-gray-200 bg-gray-100 text-gray-500 hover:bg-gray-200"
                            : event.isFull
                              ? "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400"
                              : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500"
                        }`}
                      >
                        {togglingId === event._id
                          ? "…"
                          : event.isRegistered
                            ? "Me désinscrire"
                            : event.isFull
                              ? "Complet"
                              : "Je participe ✨"}
                      </button>
                    </div>
                  </motion.article>
                  );
                })}
              </div>
            </>
          )}

          {/* Événements passés */}
          {pastEvents.length > 0 && (
            <section className="mt-8 sm:mt-12">
              <button
                onClick={() => setShowPast((current) => !current)}
                className="mx-auto mb-4 flex items-center gap-2 rounded-full border border-[#e8e0f5] bg-white px-4 py-2 text-sm font-medium text-[#8E7AB5] transition-colors hover:text-[#5B4B8A]"
              >
                {showPast ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showPast ? "Masquer" : "Voir"} les événements passés (
                {pastEvents.length})
              </button>

              <AnimatePresence>
                {showPast && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    {/* Mobile : passés en accordéons très compacts */}
                    <div className="space-y-2 opacity-75 sm:hidden">
                      {pastEvents.map((event) => {
                        const isOpen = openPastEventId === event._id;

                        return (
                          <div
                            key={event._id}
                            className="overflow-hidden rounded-2xl border border-[#e8e0f5] bg-white"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenPastEventId(isOpen ? null : event._id)
                              }
                              className="flex w-full items-center gap-3 px-3 py-3 text-left"
                            >
                              <span className="text-2xl">
                                {event.coverEmoji || event.emoji}
                              </span>

                              <div className="min-w-0 flex-1">
                                <h3 className="truncate text-sm font-semibold text-[#2d1b69]">
                                  {event.title}
                                </h3>

                                <p className="text-[11px] text-[#8E7AB5]">
                                  {formatShortDate(event.date)} ·{" "}
                                  {event.attendeeCount} participante
                                  {event.attendeeCount !== 1 ? "s" : ""}
                                </p>
                              </div>

                              <ChevronDown
                                className={`h-4 w-4 text-[#8E7AB5] transition-transform ${
                                  isOpen ? "rotate-180" : ""
                                }`}
                              />
                            </button>

                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.2,
                                    ease: "easeOut",
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="border-t border-[#f0ecff] px-3 pb-3 pt-2">
                                    <p className="text-xs leading-relaxed text-[#8E7AB5]">
                                      {event.description}
                                    </p>

                                    <p className="mt-2 text-xs font-medium text-[#5B4B8A]">
                                      📅 {capitalize(formatDate(event.date))}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop / tablette : passés en grille */}
                    <div className="hidden grid-cols-2 gap-4 opacity-60 sm:grid">
                      {pastEvents.map((event) => (
                        <div
                          key={event._id}
                          className="overflow-hidden rounded-2xl border border-[#e8e0f5] bg-white p-4"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-xl">
                              {event.coverEmoji || event.emoji}
                            </span>

                            <div>
                              <h3 className="text-sm font-semibold text-[#2d1b69]">
                                {event.title}
                              </h3>

                              <p className="text-xs text-[#8E7AB5]">
                                {capitalize(formatDate(event.date))}
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-[#8E7AB5]">
                            {event.attendeeCount} participante
                            {event.attendeeCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          )}
        </main>
      </div>

      {/* Footer masqué sur mobile pour garder une sensation d'application */}
      <div className="hidden sm:block">
        <Footer />
      </div>
    </>
  );
}
