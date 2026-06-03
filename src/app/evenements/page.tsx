"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Monitor, Users, ChevronDown, ChevronUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

type Filter = "all" | "online" | "presentiel";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }) + " à " + date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function EvenementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState<LunaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (data.success) setEvents(data.events);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchEvents();
  }, [status, fetchEvents]);

  const handleToggleRegistration = async (eventId: string) => {
    setTogglingId(eventId);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) =>
          prev.map((e) =>
            e._id === eventId
              ? { ...e, isRegistered: data.registered, attendeeCount: data.attendeeCount, isFull: data.attendeeCount >= e.maxAttendees }
              : e
          )
        );
      }
    } catch {
      // silencieux
    } finally {
      setTogglingId(null);
    }
  };

  const upcomingEvents = events.filter((e) => {
    if (e.isPast) return false;
    if (filter === "online") return e.isOnline;
    if (filter === "presentiel") return !e.isOnline;
    return true;
  });

  const pastEvents = events.filter((e) => e.isPast);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff]">
        <Header />
        <div className="flex items-center justify-center min-h-screen text-[#8E7AB5]">Chargement des événements…</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff]">
      <Header />
      <main className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#2d1b69]">Événements Luna 🌙</h1>
          <p className="text-[#8E7AB5] mt-2">Rencontrez-vous en vrai — en ligne ou en présentiel</p>
        </motion.div>

        {/* Filtres */}
        <div className="flex gap-2 justify-center mb-8">
          {(["all", "online", "presentiel"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all border ${
                filter === f
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent"
                  : "border-[#e8e0f5] text-[#5B4B8A] bg-white hover:bg-purple-50"
              }`}
            >
              {f === "all" ? "Tous" : f === "online" ? "En ligne" : "Présentiel"}
            </button>
          ))}
        </div>

        {/* Événements à venir */}
        {upcomingEvents.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6 md:py-12 text-[#8E7AB5]">
            <p className="text-5xl mb-4">🌙</p>
            <p className="text-lg">Aucun événement à venir pour le moment.</p>
            <p className="text-sm mt-2">Revenez bientôt — de nouveaux événements arrivent !</p>
          </motion.div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {upcomingEvents.map((event, i) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl border border-[#e8e0f5] shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Cover */}
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 h-24 flex items-center justify-center text-5xl">
                  {event.coverEmoji || event.emoji}
                </div>

                <div className="p-5">
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="text-xs px-2.5 py-1 bg-purple-50 text-[#5B4B8A] rounded-full border border-[#e8e0f5]">
                      {event.emoji} {event.category}
                    </span>
                    {event.isOnline ? (
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                        <Monitor size={10} /> En ligne
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs px-2.5 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
                        <MapPin size={10} /> Présentiel
                      </span>
                    )}
                    {event.isFull && !event.isRegistered && (
                      <span className="text-xs px-2.5 py-1 bg-red-50 text-red-500 rounded-full border border-red-100">Complet</span>
                    )}
                  </div>

                  <h3 className="font-bold text-[#2d1b69] mb-2">{event.title}</h3>
                  <p className="text-[#8E7AB5] text-xs mb-3 leading-relaxed line-clamp-2">{event.description}</p>

                  {/* Date */}
                  <p className="text-[#5B4B8A] text-xs font-medium mb-2">
                    📅 {capitalize(formatDate(event.date))}
                  </p>

                  {/* Lieu */}
                  {!event.isOnline && (
                    <div className="flex items-center gap-1 text-[#8E7AB5] text-xs mb-3">
                      <MapPin size={11} />
                      {event.location}
                    </div>
                  )}

                  {/* Participantes */}
                  <div className="flex items-center gap-1 text-[#8E7AB5] text-xs mb-4">
                    <Users size={11} />
                    <span>
                      <span className="font-semibold text-[#5B4B8A]">{event.attendeeCount}</span> / {event.maxAttendees} participantes
                    </span>
                  </div>

                  {/* Bouton inscription */}
                  <button
                    onClick={() => handleToggleRegistration(event._id)}
                    disabled={togglingId === event._id || (event.isFull && !event.isRegistered)}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                      event.isRegistered
                        ? "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200"
                        : event.isFull
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
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
            ))}
          </div>
        )}

        {/* Événements passés */}
        {pastEvents.length > 0 && (
          <div className="mt-12">
            <button
              onClick={() => setShowPast((v) => !v)}
              className="flex items-center gap-2 text-[#8E7AB5] hover:text-[#5B4B8A] transition-colors text-sm font-medium mx-auto mb-4"
            >
              {showPast ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showPast ? "Masquer" : "Voir"} les événements passés ({pastEvents.length})
            </button>

            <AnimatePresence>
              {showPast && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid gap-4 sm:grid-cols-2 opacity-60">
                    {pastEvents.map((event) => (
                      <div key={event._id} className="bg-white rounded-2xl border border-[#e8e0f5] p-4 overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{event.coverEmoji || event.emoji}</span>
                          <div>
                            <h3 className="font-semibold text-[#2d1b69] text-sm">{event.title}</h3>
                            <p className="text-xs text-[#8E7AB5]">{capitalize(formatDate(event.date))}</p>
                          </div>
                        </div>
                        <p className="text-xs text-[#8E7AB5]">{event.attendeeCount} participante{event.attendeeCount !== 1 ? "s" : ""}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
