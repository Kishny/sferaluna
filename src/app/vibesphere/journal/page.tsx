// src/app/vibesphere/journal/page.tsx

"use client";

/**
 * Journal émotionnel SferaLuna.
 *
 * Cette page gère :
 * - la saisie d'une humeur ;
 * - la saisie d'une note personnelle ;
 * - le mode jour / nuit ;
 * - une analyse IA simulée ;
 * - une timeline émotionnelle persistée en MongoDB (via /api/journal) ;
 * - des rituels quotidiens ;
 * - une playlist Luna selon l'humeur ;
 * - des statistiques.
 *
 * Version mobile-first :
 * - hero compact ;
 * - formulaire en accordéon mobile ;
 * - timeline en accordéon mobile ;
 * - playlist en accordéon mobile ;
 * - stats en accordéon mobile ;
 * - footer masqué sur mobile.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Loader2,
  Moon,
  Play,
  RefreshCw,
  Sparkles,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useConfirm } from "@/components/ConfirmDialog";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";

/** Serif du titre (auto-hébergée par next/font). */
const titleFont = Playfair_Display({ subsets: ["latin"], weight: ["700"], display: "swap" });

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Period = "jour" | "nuit";

type MoodName =
  | "Apaisé"
  | "Énergique"
  | "Triste"
  | "Amoureux"
  | "Pensif"
  | "Heureux";

type Entry = {
  id: string;
  mood: string;
  note: string;
  date: string;
  ritualDone: boolean;
  period: Period;
  aiAnalysis?: string;
};

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

const moodEmojiMap: Record<MoodName, string> = {
  Apaisé: "🌿",
  Énergique: "⚡️",
  Triste: "🌧️",
  Amoureux: "💖",
  Pensif: "💭",
  Heureux: "🌞",
};

const moodSuggestions: MoodName[] = [
  "Apaisé",
  "Énergique",
  "Triste",
  "Amoureux",
  "Pensif",
  "Heureux",
];

const playlistItems = [
  {
    title: "Douceur Lunaire",
    url: "https://www.youtube.com/watch?v=nSD7qJm1Dr0",
    mood: "Apaisé",
    description: "Une ambiance douce pour ralentir et respirer.",
  },
  {
    title: "Élan Cosmique",
    url: "https://www.youtube.com/watch?v=DOIekJF3fUk",
    mood: "Énergique",
    description: "Pour canaliser ton énergie dans une vibe positive.",
  },
  {
    title: "Lâcher-Prise",
    url: "https://www.youtube.com/watch?v=PmSFj5onIOk",
    mood: "Triste",
    description: "Un espace sonore pour laisser sortir ce qui pèse.",
  },
  {
    title: "Paix Intérieure",
    url: "https://www.youtube.com/watch?v=5F0sP7n1cBQ",
    mood: "Pensif",
    description: "Parfait pour accompagner tes réflexions intérieures.",
  },
  {
    title: "Onde Amoureuse",
    url: "https://www.youtube.com/watch?v=YUlU-u3DD1E",
    mood: "Amoureux",
    description: "R&B tendre et enveloppant pour les moments doux.",
  },
  {
    title: "Matin Radieux",
    url: "https://www.youtube.com/watch?v=37nFAfCrKp0",
    mood: "Heureux",
    description: "Une playlist lumineuse pour amplifier ta bonne humeur.",
  },
  {
    title: "Nuit Sereine",
    url: "https://www.youtube.com/watch?v=UxXoVc5DT44",
    mood: "Apaisé",
    description: "Un second cocon sonore pour t'apaiser en douceur.",
  },
  {
    title: "Bonnes Ondes",
    url: "https://www.youtube.com/watch?v=g4G5FgKJZa8",
    mood: "Heureux",
    description: "Encore plus d'ondes positives pour rayonner.",
  },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function isMoodName(value: string): value is MoodName {
  return value in moodEmojiMap;
}

type PlaylistItem = (typeof playlistItems)[number];

/** Extrait l'ID vidéo d'une URL YouTube (watch?v=...). */
function getYouTubeId(url: string): string {
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : "";
}

function simulateAiAnalysis(mood: string): string {
  const responses: Record<string, string> = {
    Apaisé:
      "Tu sembles en harmonie. Prends ce moment pour te reconnecter à toi-même 🌿",
    Énergique:
      "Tu débordes d'énergie ! Canalise-la vers un projet positif ⚡️",
    Triste:
      "Tu vis un passage délicat. Accueille cette émotion avec douceur 🌧️",
    Amoureux:
      "L'amour est dans l'air ! Cultive cette belle énergie sans t'oublier 💖",
    Pensif:
      "Tu explores ton monde intérieur. Laisse-toi guider par tes réflexions 💭",
    Heureux:
      "Profite de cette belle vibration ! Souris à la vie et partage cette énergie 🌞",
  };

  return (
    responses[mood] ||
    "Ton état d'âme est unique. Écoute ce qu'il cherche à te dire."
  );
}

function createFormattedDate() {
  return new Date().toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Sphère en orbite décorative (cercles concentriques + points d'accent),
 * écho visuel du nom "Sfera". La couleur du tracé s'adapte au thème.
 */
function OrbitGlow({
  className = "",
  stroke = "#FFFFFF",
}: {
  className?: string;
  stroke?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute opacity-[0.16] ${className}`}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="90" fill="none" stroke={stroke} strokeWidth="1" />
      <circle
        cx="100"
        cy="100"
        r="62"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeDasharray="4 6"
      />
      <circle cx="100" cy="100" r="34" fill="none" stroke={stroke} strokeWidth="1" />
      <circle cx="100" cy="10" r="3" fill={stroke} />
      <circle cx="190" cy="100" r="3" fill={stroke} />
      <circle cx="100" cy="190" r="3" fill={stroke} />
      <circle cx="10" cy="100" r="3" fill={stroke} />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Thème jour / nuit
// ─────────────────────────────────────────────

type Theme = {
  isDay: boolean;
  page: string;
  card: string;
  soft: string;
  title: string;
  text: string;
  muted: string;
  field: string;
  iconBubble: string;
  divider: string;
};

function themeFor(isDay: boolean): Theme {
  return isDay
    ? {
        isDay,
        page: "bg-gradient-to-b from-[#e9defc] via-[#f3ecff] to-[#e6d9fb] text-[#2a1f5c]",
        card: "border-white/90 bg-white/85 shadow-[0_18px_50px_-28px_rgba(91,63,214,0.45)]",
        soft: "border-[#e3d7fb] bg-white/70",
        title: "text-[#231a52]",
        text: "text-[#3b2f6b]",
        muted: "text-[#7a6aa4]",
        field: "border-[#ddd0f7] bg-white text-[#231a52] placeholder:text-[#a99cc9] focus:border-[#8b5cf6] focus:ring-[#8b5cf6]/20",
        iconBubble: "bg-[#efe7ff]",
        divider: "border-[#ece3fb]",
      }
    : {
        isDay,
        page: "bg-gradient-to-b from-[#12081f] via-[#1c0f3d] to-[#12081f] text-white",
        card: "border-violet-300/[0.16] bg-[#1b0d38]/80 shadow-[0_18px_50px_-24px_rgba(8,0,24,0.9)]",
        soft: "border-violet-300/15 bg-white/[0.04]",
        title: "text-white",
        text: "text-white/85",
        muted: "text-white/60",
        field: "border-violet-300/20 bg-white/[0.05] text-white placeholder:text-white/40 focus:border-fuchsia-300/60 focus:ring-fuchsia-500/20",
        iconBubble: "bg-white/[0.07]",
        divider: "border-white/10",
      };
}

/** Décor du bandeau : lune, planètes, étoiles et nuages (SVG, aucun fichier à charger). */
function HeroDecor({ isDay }: { isDay: boolean }) {
  const cloud = isDay ? "#ffffff" : "#3b2473";
  const moonA = isDay ? "#f4ecff" : "#e9d5ff";
  const moonB = isDay ? "#cdb8f5" : "#7c3aed";
  const star = isDay ? "#ffffff" : "#f5e8ff";
  return (
    <svg viewBox="0 0 1200 260" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="jr-moon" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor={moonA} />
          <stop offset="100%" stopColor={moonB} />
        </radialGradient>
        <filter id="jr-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      {/* Grande lune à droite */}
      <circle cx="930" cy="150" r="130" fill="url(#jr-moon)" opacity={isDay ? 0.75 : 0.55} />
      <circle cx="890" cy="110" r="16" fill={moonB} opacity="0.25" />
      <circle cx="975" cy="170" r="24" fill={moonB} opacity="0.2" />
      <circle cx="930" cy="80" r="9" fill={moonB} opacity="0.22" />
      {/* Petites planètes */}
      <circle cx="285" cy="72" r="26" fill="url(#jr-moon)" opacity="0.9" />
      <ellipse cx="285" cy="72" rx="44" ry="10" fill="none" stroke={moonB} strokeOpacity="0.45" strokeWidth="1.5" transform="rotate(-18 285 72)" />
      <circle cx="330" cy="150" r="9" fill="url(#jr-moon)" opacity="0.8" />
      <circle cx="1085" cy="128" r="12" fill="url(#jr-moon)" opacity="0.85" />
      {/* Orbites */}
      <ellipse cx="170" cy="150" rx="210" ry="120" fill="none" stroke={moonB} strokeOpacity="0.25" strokeDasharray="3 7" />
      {/* Étoiles */}
      {[
        [380, 80, 7], [1010, 110, 9], [1150, 40, 6], [60, 60, 6], [640, 30, 4], [760, 210, 5], [470, 215, 4], [1120, 205, 5],
      ].map(([x, y, s], i) => (
        <path key={i} d={`M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z`} fill={star} opacity="0.9" />
      ))}
      {/* Nuages */}
      <g filter="url(#jr-blur)" fill={cloud} opacity={isDay ? 0.9 : 0.55}>
        <ellipse cx="120" cy="250" rx="220" ry="46" />
        <ellipse cx="430" cy="270" rx="200" ry="40" />
        <ellipse cx="780" cy="268" rx="240" ry="44" />
        <ellipse cx="1110" cy="252" rx="200" ry="48" />
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────

const NOTE_MAX = 500;

export default function JournalPage() {
  const [confirm, confirmDialog] = useConfirm();
  const [entries, setEntries] = useState<Entry[]>([]);

  const [mood, setMood] = useState("");
  const [note, setNote] = useState("");
  const [period, setPeriod] = useState<Period>("jour");

  const [selectedMood, setSelectedMood] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [loadedStorage, setLoadedStorage] = useState(false);

  const [formOpen, setFormOpen] = useState(true);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  const [playingTrack, setPlayingTrack] = useState<PlaylistItem | null>(null);

  const isDay = period === "jour";
  const t = themeFor(isDay);

  const filteredPlaylist = useMemo(() => {
    if (!selectedMood) return playlistItems;
    const filtered = playlistItems.filter((item) => item.mood === selectedMood);
    return filtered.length > 0 ? filtered : playlistItems;
  }, [selectedMood]);

  const stats = useMemo(() => {
    const uniqueMoods = new Set(entries.map((entry) => entry.mood));
    return {
      total: entries.length,
      rituals: entries.filter((entry) => entry.ritualDone).length,
      uniqueMoods: uniqueMoods.size,
      dayEntries: entries.filter((entry) => entry.period === "jour").length,
      nightEntries: entries.filter((entry) => entry.period === "nuit").length,
    };
  }, [entries]);

  // ── Chargement (entrées enregistrées sur le compte, via /api/journal) ──
  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/journal", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !Array.isArray(data.entries)) return;
      setEntries(data.entries);
    } catch (err) {
      console.error("Erreur chargement journal :", err);
    } finally {
      setLoadedStorage(true);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // ── Actions ──
  const handleMoodSelect = (selected: MoodName) => {
    setMood(selected);
    setSelectedMood(selected);
    setError("");
  };

  const handleSubmit = async () => {
    if (!mood.trim() && !note.trim()) {
      setError("Choisis une humeur ou écris une note.");
      return;
    }
    setError("");
    setIsAnalyzing(true);

    const analysis = mood ? simulateAiAnalysis(mood) : "Ta note est précieuse, même sans humeur associée 💫";

    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: mood || "Non spécifié",
          note: note.trim() || "Aucune note",
          date: createFormattedDate(),
          period,
          aiAnalysis: analysis,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || !data.entry) {
        setError(data?.error || "L’entrée n’a pas pu être enregistrée. Réessaie dans un instant.");
        return;
      }
      setEntries((prev) => [data.entry, ...prev]);
      setAiAnalysis(analysis);
      setMood("");
      setNote("");
      setSelectedMood("");
      setTimelineOpen(true);
    } catch {
      setError("Connexion impossible. Ton entrée n’a pas été enregistrée.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRitualToggle = async (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    const newValue = !entry.ritualDone;
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ritualDone: newValue } : e)));
    try {
      await fetch(`/api/journal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ritualDone: newValue }),
      });
    } catch {
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ritualDone: !newValue } : e)));
    }
  };

  const deleteEntry = async (id: string) => {
    if (!(await confirm({ title: "Supprimer cette entrée ?", text: "Elle sera effacée de ton journal pour de bon.", confirmLabel: "Supprimer" }))) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await fetch(`/api/journal/${id}`, { method: "DELETE" });
    } catch {
      await loadEntries();
    }
  };

  const clearCurrentInput = () => {
    setMood("");
    setNote("");
    setSelectedMood("");
    setAiAnalysis(null);
    setError("");
  };

  const resetJournal = async () => {
    if (!(await confirm({ title: "Supprimer tout ton journal ?", text: "Toutes tes entrées seront effacées. Cette action est irréversible.", confirmLabel: "Tout supprimer" }))) return;
    setEntries([]);
    clearCurrentInput();
    try {
      await fetch("/api/journal", { method: "DELETE" });
    } catch (err) {
      console.error("Erreur reset journal :", err);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) handleSubmit();
  };

  return (
    <>
      <Header />

      <main className={`relative min-h-screen overflow-hidden px-3 pb-16 pt-20 transition-colors duration-500 sm:px-5 sm:pt-24 ${t.page}`}>
        {/* Décor de page */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <OrbitGlow className="journal-spin right-[-10%] top-[38%] h-80 w-80 sm:h-[30rem] sm:w-[30rem]" stroke={isDay ? "#8E7AB5" : "#FFFFFF"} />
          <OrbitGlow className="journal-spin-rev left-[-12%] top-[30%] h-72 w-72 sm:h-[26rem] sm:w-[26rem]" stroke={isDay ? "#B79CE0" : "#E9D5FF"} />
          <div className={`absolute -bottom-24 left-0 right-0 h-64 blur-3xl ${isDay ? "bg-white/70" : "bg-violet-700/20"}`} />
        </div>

        <div className="relative z-10 mx-auto max-w-[1500px]">
          {/* ── Bandeau ── */}
          <motion.section
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className={`relative isolate overflow-hidden rounded-[28px] border px-4 pb-8 pt-4 text-center sm:px-6 sm:pb-10 sm:pt-5 ${
              isDay ? "border-white/90 bg-gradient-to-br from-[#e4d6fb] via-[#efe6ff] to-[#dccbf8]" : "border-violet-300/20 bg-gradient-to-br from-[#241052] via-[#1b0d38] to-[#2c1260]"
            }`}
          >
            <div className="absolute inset-0 -z-10">
              <HeroDecor isDay={isDay} />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Link
                href="/vibesphere"
                className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition ${
                  isDay ? "border-white bg-white/80 text-[#4b3d86] hover:bg-white" : "border-white/15 bg-white/10 text-white/85 hover:bg-white/15"
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Link>

              <div className={`flex gap-1 rounded-full border p-1 ${isDay ? "border-white bg-white/80" : "border-white/15 bg-white/10"}`} role="group" aria-label="Thème du journal">
                {(
                  [
                    ["jour", "Jour", Sun],
                    ["nuit", "Nuit", Moon],
                  ] as const
                ).map(([value, label, Icon]) => {
                  const on = period === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPeriod(value)}
                      aria-pressed={on}
                      className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition sm:px-4 ${
                        on ? "bg-gradient-to-r from-[#7c5cf0] to-[#5b3fd6] text-white shadow" : isDay ? "text-[#4b3d86] hover:bg-[#efe7ff]" : "text-white/75 hover:bg-white/10"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm sm:-mt-9 ${isDay ? "border-white bg-white/85 text-[#4b3d86]" : "border-white/15 bg-white/10 text-violet-100"}`}>
              <Sparkles className="h-4 w-4" />
              Espace intime Luna
            </span>

            <h1 className={`${titleFont.className} mt-4 text-4xl font-bold leading-tight sm:text-6xl ${t.title}`}>Journal Émotionnel</h1>
            <p className={`mx-auto mt-2 max-w-xl text-sm leading-relaxed sm:text-lg ${isDay ? "text-[#4b3d86]" : "text-white/80"}`}>
              Dépose tes émotions, observe tes cycles intérieurs et transforme tes ressentis en repères doux.
            </p>
            <div className={`mt-4 flex items-center justify-center gap-3 ${isDay ? "text-[#6f5bb8]" : "text-violet-200"}`} aria-hidden>
              <span className="h-px w-10 bg-current opacity-50" />
              <Sparkles className="h-3 w-3" />
              <Moon className="h-5 w-5 fill-current" />
              <Sparkles className="h-3 w-3" />
              <span className="h-px w-10 bg-current opacity-50" />
            </div>
          </motion.section>

          {/* ── Contenu ── */}
          {!loadedStorage ? (
            <div className="flex flex-col items-center gap-3 py-20">
              <Loader2 className={`h-8 w-8 animate-spin ${isDay ? "text-[#7c5cf0]" : "text-fuchsia-300"}`} />
              <p className={`text-sm ${t.muted}`}>Chargement du journal émotionnel…</p>
            </div>
          ) : (
            <div className="mx-auto mt-5 grid max-w-[1400px] grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1.72fr)_minmax(0,1fr)] lg:gap-5">
              {/* Colonne gauche : écrire */}
              <AccordionSection
                t={t}
                title="Écrire une entrée"
                icon="✏️"
                isOpen={formOpen}
                setIsOpen={setFormOpen}
                serif
                subtitle={selectedMood ? `${isMoodName(selectedMood) ? moodEmojiMap[selectedMood] : "✨"} ${selectedMood}` : "Choisis une humeur ou écris une note."}
              >
                <JournalForm
                  t={t}
                  mood={mood}
                  note={note}
                  isAnalyzing={isAnalyzing}
                  aiAnalysis={aiAnalysis}
                  error={error}
                  setMood={setMood}
                  setNote={setNote}
                  setSelectedMood={setSelectedMood}
                  setError={setError}
                  handleMoodSelect={handleMoodSelect}
                  handleSubmit={handleSubmit}
                  clearCurrentInput={clearCurrentInput}
                  handleKeyDown={handleKeyDown}
                />
              </AccordionSection>

              {/* Colonne droite */}
              <div className="min-w-0 space-y-4">
                <AccordionSection
                  t={t}
                  title={`Timeline (${entries.length})`}
                  icon="🕰️"
                  isOpen={timelineOpen}
                  setIsOpen={setTimelineOpen}
                  subtitle={entries.length > 0 ? "Tes dernières entrées émotionnelles." : "Aucune entrée pour le moment."}
                  rightAction={
                    entries.length > 0 ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          resetJournal();
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                          isDay ? "border-red-200 bg-white text-red-500 hover:bg-red-50" : "border-red-400/25 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                        }`}
                      >
                        <RefreshCw className="h-3 w-3" />
                        Tout effacer
                      </button>
                    ) : null
                  }
                >
                  {entries.length === 0 ? (
                    <div className={`rounded-2xl border px-4 py-6 text-center ${t.soft}`}>
                      <EmptyJournalArt isDay={isDay} />
                      <p className={`mt-3 text-sm font-semibold ${t.title}`}>Aucune entrée pour l’instant</p>
                      <p className={`mt-1 text-sm ${t.muted}`}>Commence par écrire ton premier mood.</p>
                    </div>
                  ) : (
                    <ul className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                      <AnimatePresence>
                        {entries.map((entry) => (
                          <motion.li
                            key={entry.id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className={`rounded-2xl border border-l-4 p-3 ${entry.ritualDone ? "border-l-emerald-500" : "border-l-[#8b5cf6]"} ${t.soft}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 items-start gap-2.5">
                                <span className="text-2xl leading-none">{isMoodName(entry.mood) ? moodEmojiMap[entry.mood] : "📝"}</span>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <h3 className={`truncate text-sm font-semibold ${t.title}`}>{entry.mood}</h3>
                                    <span className="text-xs" title={entry.period === "jour" ? "Écrite de jour" : "Écrite de nuit"}>
                                      {entry.period === "jour" ? "☀️" : "🌙"}
                                    </span>
                                  </div>
                                  <small className={`text-[11px] ${t.muted}`}>{entry.date}</small>
                                </div>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleRitualToggle(entry.id)}
                                  aria-pressed={entry.ritualDone}
                                  title={entry.ritualDone ? "Rituel fait" : "Marquer le rituel comme fait"}
                                  className={`rounded-lg px-2 py-1 text-xs transition ${entry.ritualDone ? "bg-emerald-500/20" : isDay ? "bg-[#efe7ff]" : "bg-white/10"}`}
                                >
                                  {entry.ritualDone ? "✅" : "🌱"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteEntry(entry.id)}
                                  className="rounded-lg bg-red-500/15 px-2 py-1 text-red-500 transition hover:bg-red-500/25"
                                  aria-label="Supprimer l’entrée"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            {entry.note && entry.note !== "Aucune note" && <p className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${t.text}`}>{entry.note}</p>}
                            {entry.aiAnalysis && (
                              <p className={`mt-2 rounded-xl border-l-2 border-[#8b5cf6] px-2.5 py-2 text-xs italic leading-relaxed ${isDay ? "bg-[#f6f1ff] text-[#5b4b8a]" : "bg-white/5 text-white/75"}`}>
                                🌙 {entry.aiAnalysis}
                              </p>
                            )}
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  )}
                </AccordionSection>

                <AccordionSection t={t} title="Playlist Luna" icon="🎵" isOpen={playlistOpen} setIsOpen={setPlaylistOpen} subtitle="Une sélection musicale selon ton mood.">
                  <div className="grid gap-2.5">
                    {filteredPlaylist.map((track) => {
                      const isPlaying = playingTrack?.url === track.url;
                      return (
                        <button
                          key={`${track.title}-${track.mood}`}
                          type="button"
                          onClick={() => setPlayingTrack(track)}
                          className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                            isPlaying ? "border-[#8b5cf6] bg-[#8b5cf6]/15" : `${t.soft} hover:border-[#8b5cf6]/60`
                          }`}
                        >
                          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg ${t.iconBubble}`}>
                            {isPlaying ? (
                              <span className="flex items-end gap-[2px]">
                                {[0, 0.2, 0.4].map((d) => (
                                  <span key={d} className="eq-bar h-4 w-[3px] rounded-full bg-[#8b5cf6]" style={{ animationDelay: `${d}s` }} />
                                ))}
                              </span>
                            ) : isMoodName(track.mood) ? (
                              moodEmojiMap[track.mood]
                            ) : (
                              "🎵"
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block text-sm font-semibold ${t.title}`}>{track.title}</span>
                            <span className={`block text-xs ${t.muted}`}>
                              {track.mood} · {track.description}
                            </span>
                          </span>
                          <Play className="h-4 w-4 shrink-0 text-[#8b5cf6]" fill="currentColor" />
                        </button>
                      );
                    })}
                  </div>
                </AccordionSection>

                <AccordionSection t={t} title="Tes statistiques" icon="📊" isOpen={statsOpen} setIsOpen={setStatsOpen} subtitle="Ton activité émotionnelle en chiffres.">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
                    <StatCard t={t} label="Entrées" value={stats.total} />
                    <StatCard t={t} label="Rituels" value={stats.rituals} />
                    <StatCard t={t} label="Humeurs" value={stats.uniqueMoods} />
                    <StatCard t={t} label="Jour" value={stats.dayEntries} />
                    <StatCard t={t} label="Nuit" value={stats.nightEntries} />
                  </div>
                </AccordionSection>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="hidden sm:block">
        <Footer />
      </div>
      {confirmDialog}

      <MoodPlayer track={playingTrack} onClose={() => setPlayingTrack(null)} />

      <style jsx global>{`
        @keyframes journal-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes journal-spin-rev {
          to {
            transform: rotate(-360deg);
          }
        }
        .journal-spin {
          animation: journal-spin 70s linear infinite;
          transform-origin: center;
        }
        .journal-spin-rev {
          animation: journal-spin-rev 90s linear infinite;
          transform-origin: center;
        }
        @keyframes eq {
          0%,
          100% {
            transform: scaleY(0.35);
          }
          50% {
            transform: scaleY(1);
          }
        }
        .eq-bar {
          display: inline-block;
          transform-origin: bottom;
          animation: eq 0.9s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .journal-spin,
          .journal-spin-rev,
          .eq-bar {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────
// Illustration « journal vide »
// ─────────────────────────────────────────────

function EmptyJournalArt({ isDay }: { isDay: boolean }) {
  return (
    <svg viewBox="0 0 220 110" className="mx-auto h-24 w-48" aria-hidden>
      <ellipse cx="110" cy="92" rx="88" ry="14" fill={isDay ? "#e6dafb" : "#3b2473"} />
      <ellipse cx="70" cy="86" rx="40" ry="12" fill={isDay ? "#efe7ff" : "#4c2f8f"} />
      <ellipse cx="150" cy="88" rx="44" ry="12" fill={isDay ? "#efe7ff" : "#4c2f8f"} />
      <g transform="rotate(-12 110 55)">
        <rect x="82" y="22" width="58" height="66" rx="7" fill="#b89cf2" />
        <rect x="88" y="22" width="52" height="66" rx="6" fill="#cdb8f7" />
        <path d="M121 44a11 11 0 1 0 9 17 9 9 0 0 1-9-17Z" fill="#6d4fd8" />
        {[30, 40, 50, 60, 70, 80].map((y) => (
          <circle key={y} cx="85" cy={y} r="2.6" fill="none" stroke="#6d4fd8" strokeWidth="1.6" />
        ))}
        <rect x="108" y="86" width="5" height="14" fill="#6d4fd8" />
      </g>
      {[
        [40, 40, 5, "#f5c451"], [176, 30, 5, "#f5c451"], [190, 62, 3, "#8b5cf6"], [58, 18, 3, "#8b5cf6"], [150, 12, 3, "#8b5cf6"],
      ].map(([x, y, s, c], i) => (
        <path key={i} d={`M${x} ${Number(y) - Number(s)} L${Number(x) + Number(s) * 0.3} ${Number(y) - Number(s) * 0.3} L${Number(x) + Number(s)} ${y} L${Number(x) + Number(s) * 0.3} ${Number(y) + Number(s) * 0.3} L${x} ${Number(y) + Number(s)} L${Number(x) - Number(s) * 0.3} ${Number(y) + Number(s) * 0.3} L${Number(x) - Number(s)} ${y} L${Number(x) - Number(s) * 0.3} ${Number(y) - Number(s) * 0.3} Z`} fill={String(c)} />
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────
// Carte repliable
// ─────────────────────────────────────────────

function AccordionSection({
  t,
  title,
  subtitle,
  icon,
  isOpen,
  setIsOpen,
  rightAction,
  serif = false,
  children,
}: {
  t: Theme;
  title: string;
  subtitle?: string;
  icon: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  rightAction?: React.ReactNode;
  serif?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`overflow-hidden rounded-3xl border backdrop-blur-md ${t.card}`}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="flex w-full cursor-pointer items-center gap-3.5 px-4 py-4 text-left sm:px-5"
      >
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl ${t.iconBubble}`}>{icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className={`truncate text-lg font-bold sm:text-xl ${serif ? titleFont.className : ""} ${t.title}`}>{title}</h2>
          {subtitle && <p className={`truncate text-sm ${t.muted}`}>{subtitle}</p>}
        </div>
        {rightAction}
        <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${t.isDay ? "text-[#4b3d86]" : "text-white/70"} ${isOpen ? "rotate-180" : ""}`} />
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className={`border-t px-4 pb-5 pt-4 sm:px-5 ${t.divider}`}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// ─────────────────────────────────────────────
// Formulaire
// ─────────────────────────────────────────────

function JournalForm({
  t,
  mood,
  note,
  isAnalyzing,
  aiAnalysis,
  error,
  setMood,
  setNote,
  setSelectedMood,
  setError,
  handleMoodSelect,
  handleSubmit,
  clearCurrentInput,
  handleKeyDown,
}: {
  t: Theme;
  mood: string;
  note: string;
  isAnalyzing: boolean;
  aiAnalysis: string | null;
  error: string;
  setMood: React.Dispatch<React.SetStateAction<string>>;
  setNote: React.Dispatch<React.SetStateAction<string>>;
  setSelectedMood: React.Dispatch<React.SetStateAction<string>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  handleMoodSelect: (selected: MoodName) => void;
  handleSubmit: () => void;
  clearCurrentInput: () => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
}) {
  const field = `w-full rounded-2xl border pl-12 pr-4 text-[15px] outline-none transition focus:ring-2 ${t.field}`;
  return (
    <>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-3 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-500"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className={`mb-2 text-sm font-semibold ${t.title}`}>Choisis ton humeur Luna</p>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {moodSuggestions.map((label) => {
          const selected = mood === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => handleMoodSelect(label)}
              aria-pressed={selected}
              className={`rounded-2xl border px-2 py-3 text-center transition hover:-translate-y-0.5 ${
                selected
                  ? t.isDay
                    ? "border-[#8b5cf6] bg-[#f1e9ff] shadow-[0_10px_24px_-14px_rgba(124,92,240,0.9)]"
                    : "border-fuchsia-300/70 bg-fuchsia-500/15"
                  : `${t.soft} hover:border-[#8b5cf6]/60`
              }`}
            >
              <span className="block text-3xl leading-none sm:text-4xl">{moodEmojiMap[label]}</span>
              <span className={`mt-2 block text-sm ${selected ? t.title : t.text}`}>{label}</span>
            </button>
          );
        })}
      </div>

      <label className="mt-4 block">
        <span className={`text-sm font-semibold ${t.title}`}>Humeur du moment</span>
        <span className="relative mt-1.5 block">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg" aria-hidden>
            🌿
          </span>
          <input
            value={mood}
            onChange={(event) => {
              setMood(event.target.value);
              setSelectedMood("");
              setError("");
            }}
            onKeyDown={handleKeyDown}
            maxLength={40}
            placeholder="ex : Apaisé(e), Énergique…"
            className={`${field} h-12`}
          />
        </span>
      </label>

      <label className="mt-4 block">
        <span className={`text-sm font-semibold ${t.title}`}>Note ou pensée</span>
        <span className="relative mt-1.5 block">
          <span className="pointer-events-none absolute left-4 top-3.5 text-lg" aria-hidden>
            ✏️
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX))}
            onKeyDown={handleKeyDown}
            placeholder="Écris librement…"
            rows={4}
            className={`${field} resize-y py-3.5 pb-7`}
          />
          <span className={`pointer-events-none absolute bottom-3 right-4 text-xs ${t.muted}`}>
            {note.length}/{NOTE_MAX}
          </span>
        </span>
      </label>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isAnalyzing}
          className="flex h-12 shrink-0 sm:flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#8b6cf6] to-[#5b3fd6] px-6 text-base font-semibold text-white shadow-[0_14px_30px_-14px_rgba(91,63,214,0.95)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {isAnalyzing ? "Enregistrement…" : "Ajouter"}
        </button>
        <button
          type="button"
          onClick={clearCurrentInput}
          className={`flex h-12 items-center justify-center gap-2 rounded-full border px-7 text-base font-medium transition ${
            t.isDay ? "border-[#8b5cf6] bg-white text-[#4b3d86] hover:bg-[#f1e9ff]" : "border-violet-300/40 text-white hover:bg-white/10"
          }`}
        >
          <Trash2 className="h-4 w-4" />
          Effacer
        </button>
      </div>

      <AnimatePresence>
        {aiAnalysis && !isAnalyzing && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={`mt-4 rounded-2xl border p-4 ${t.soft}`}>
            <h3 className={`mb-1 flex items-center gap-2 text-sm font-semibold ${t.title}`}>
              <Moon className="h-4 w-4 text-[#8b5cf6]" />
              Le mot de Luna
            </h3>
            <p className={`text-sm leading-relaxed ${t.text}`}>{aiAnalysis}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────
// Chiffre
// ─────────────────────────────────────────────

function StatCard({ t, label, value }: { t: Theme; label: string; value: number }) {
  return (
    <div className={`rounded-2xl border p-3 text-center ${t.soft}`}>
      <p className="text-2xl font-bold text-[#8b5cf6]">{value}</p>
      <p className={`text-xs ${t.muted}`}>{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Lecteur musical intégré (dock bas de page)
// ─────────────────────────────────────────────

function MoodPlayer({
  track,
  onClose,
}: {
  track: PlaylistItem | null;
  onClose: () => void;
}) {
  const videoId = track ? getYouTubeId(track.url) : "";
  const emoji = track && isMoodName(track.mood) ? moodEmojiMap[track.mood] : "🎵";

  return (
    <AnimatePresence>
      {track && videoId && (
        <motion.div
          initial={{ y: 130, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 130, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-4 sm:pb-4"
        >
          <div className="relative mx-auto max-w-3xl">
            {/* Halo dégradé */}
            <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-violet-500/30 opacity-80 blur-xl" />

            <div className="relative flex items-center gap-3 rounded-2xl border border-white/15 bg-[#160a2e]/95 p-2.5 shadow-2xl backdrop-blur-xl sm:gap-4 sm:p-3">
              {/* Lecteur YouTube embarqué */}
              <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15 sm:w-40">
                <iframe
                  key={videoId}
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                  title={track.title}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>

              {/* Infos + égaliseur */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <p className="truncate text-sm font-semibold text-white sm:text-base">
                    {track.title}
                  </p>
                </div>

                <p className="truncate text-[11px] text-white/45 sm:text-xs">
                  Humeur : {track.mood}
                </p>

                <div className="mt-2 flex items-end gap-[3px]">
                  {[0, 0.15, 0.3, 0.45, 0.6, 0.2, 0.4].map((delay, i) => (
                    <span
                      key={i}
                      className="eq-bar h-3.5 w-[3px] rounded-full bg-gradient-to-t from-purple-400 to-pink-400 sm:h-4"
                      style={{ animationDelay: `${delay}s` }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Fermer le lecteur"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
