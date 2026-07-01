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
  BarChart3,
  ChevronDown,
  Loader2,
  Moon,
  Music,
  Play,
  RefreshCw,
  Sparkles,
  Sun,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

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

const moodSoundMap: Record<MoodName, string> = {
  Apaisé: "/sounds/apaisé.mp3",
  Énergique: "/sounds/energie.mp3",
  Triste: "/sounds/triste.mp3",
  Amoureux: "/sounds/amour.mp3",
  Pensif: "/sounds/pensif.mp3",
  Heureux: "/sounds/heureux.mp3",
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
    title: "Lunar Chill",
    url: "https://www.youtube.com/watch?v=nSD7qJm1Dr0",
    mood: "Apaisé",
    description: "Une ambiance douce pour ralentir et respirer.",
  },
  {
    title: "Cosmic Flow",
    url: "https://www.youtube.com/watch?v=DOIekJF3fUk",
    mood: "Énergique",
    description: "Pour canaliser ton énergie dans une vibe positive.",
  },
  {
    title: "Emotional Release",
    url: "https://www.youtube.com/watch?v=PmSFj5onIOk",
    mood: "Triste",
    description: "Un espace sonore pour laisser sortir ce qui pèse.",
  },
  {
    title: "Inner Peace",
    url: "https://www.youtube.com/watch?v=5F0sP7n1cBQ",
    mood: "Pensif",
    description: "Parfait pour accompagner tes réflexions intérieures.",
  },
  {
    title: "Love Frequency",
    url: "https://www.youtube.com/watch?v=YUlU-u3DD1E",
    mood: "Amoureux",
    description: "R&B tendre et enveloppant pour les moments doux.",
  },
  {
    title: "Sunny Morning",
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
    title: "Good Vibes",
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
// Page principale
// ─────────────────────────────────────────────

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);

  const [mood, setMood] = useState("");
  const [note, setNote] = useState("");
  const [period, setPeriod] = useState<Period>("jour");

  const [selectedMood, setSelectedMood] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [loadedStorage, setLoadedStorage] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * Accordéons mobile.
   */
  const [formOpen, setFormOpen] = useState(true);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  /** Morceau en cours de lecture dans le lecteur intégré (dock bas de page). */
  const [playingTrack, setPlayingTrack] = useState<PlaylistItem | null>(null);

  const isDay = period === "jour";

  // ─────────────────────────────────────────────
  // Classes dynamiques
  // ─────────────────────────────────────────────

  const titleClass = isDay ? "text-[#5B4B8A]" : "text-[#D9B8FF]";
  const textPrimary = isDay ? "text-[#2E2A3A]" : "text-white";
  const textSecondary = isDay ? "text-[#6B5F8E]" : "text-white/80";
  const textMuted = isDay ? "text-[#7A6AA4]" : "text-white/60";

  const cardBg = isDay
    ? "bg-white/75 border-[#D9B8FF]/80"
    : "bg-white/10 border-white/20";

  const softCardBg = isDay
    ? "bg-white/55 border-[#D9B8FF]/60"
    : "bg-white/5 border-white/10";

  const moodBackground = useMemo(() => {
    switch (mood) {
      case "Apaisé":
        return "bg-gradient-to-br from-[#d0f0c0] via-[#f0fff0] to-[#f6f1ff]";
      case "Triste":
        return "bg-gradient-to-br from-[#4b6cb7] via-[#28395f] to-[#182848]";
      case "Énergique":
        return "bg-gradient-to-br from-[#ffe259] via-[#ffc371] to-[#ffa751]";
      case "Amoureux":
        return "bg-gradient-to-br from-[#ff9a9e] via-[#fad0c4] to-[#f6f1ff]";
      case "Pensif":
        return "bg-gradient-to-br from-[#a1c4fd] via-[#c2e9fb] to-[#f6f1ff]";
      case "Heureux":
        return "bg-gradient-to-br from-[#f6d365] via-[#fda085] to-[#f6f1ff]";
      default:
        return "";
    }
  }, [mood]);

  const mainBackground =
    moodBackground ||
    (isDay
      ? "bg-gradient-to-br from-[#f6f1ff] via-[#f4ecfc] to-[#e8dbff]"
      : "bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e]");

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

  // ─────────────────────────────────────────────
  // Chargement initial depuis l'API
  // ─────────────────────────────────────────────

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/journal", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !Array.isArray(data.entries)) return;

      setEntries(data.entries);

      if (data.entries.length > 0) {
        const last = data.entries[0] as Entry;
        setMood(last.mood || "");
        setSelectedMood(last.mood || "");
        setAiAnalysis(last.aiAnalysis || null);
        setPeriod(last.period || "jour");
      }
    } catch (err) {
      console.error("Erreur chargement journal :", err);
    } finally {
      setLoadedStorage(true);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // ─────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────

  const playMoodSound = (selected: string) => {
    if (!isMoodName(selected)) return;

    const sound = moodSoundMap[selected];

    if (!sound) return;

    try {
      const audio = new Audio(sound);
      audio.volume = 0.35;

      audio.play().catch((audioError) => {
        console.log(
          "Son non joué, probablement bloqué par le navigateur :",
          audioError
        );
      });
    } catch (audioError) {
      console.log("Erreur de lecture audio :", audioError);
    }
  };

  const handleMoodSelect = (selected: MoodName) => {
    setMood(selected);
    setSelectedMood(selected);
    setError("");
  };

  const handleSubmit = async () => {
    if (!mood.trim() && !note.trim()) {
      setError("Veuillez sélectionner une humeur ou écrire une note.");
      return;
    }

    setError("");
    setIsAnalyzing(true);

    if (mood) {
      playMoodSound(mood);
    }

    // Simuler l'analyse IA (délai visuel 1,2s)
    await new Promise((resolve) => window.setTimeout(resolve, 1200));

    const analysis = mood
      ? simulateAiAnalysis(mood)
      : "Aucune humeur détectée. Ta note reste précieuse 💫";

    setAiAnalysis(analysis);

    try {
      setSaving(true);
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

      if (res.ok && data?.success && data.entry) {
        setEntries((prev) => [data.entry, ...prev]);
      }
    } catch (err) {
      console.error("Erreur sauvegarde entrée :", err);
    } finally {
      setSaving(false);
    }

    setMood("");
    setNote("");
    setSelectedMood("");
    setIsAnalyzing(false);
    setTimelineOpen(true);
  };

  const handleRitualToggle = async (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;

    const newValue = !entry.ritualDone;

    // Optimistic update
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ritualDone: newValue } : e))
    );

    try {
      await fetch(`/api/journal/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ritualDone: newValue }),
      });
    } catch (err) {
      console.error("Erreur toggle ritual :", err);
      // Rollback
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ritualDone: !newValue } : e))
      );
    }
  };

  const deleteEntry = async (id: string) => {
    const confirmed = window.confirm("Supprimer cette entrée ?");
    if (!confirmed) return;

    setEntries((prev) => prev.filter((e) => e.id !== id));

    try {
      await fetch(`/api/journal/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Erreur suppression entrée :", err);
      await loadEntries(); // Recharger si erreur
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
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer tout votre journal ?"
    );
    if (!confirmed) return;

    setEntries([]);
    setMood("");
    setNote("");
    setSelectedMood("");
    setAiAnalysis(null);
    setError("");

    try {
      await fetch("/api/journal", { method: "DELETE" });
    } catch (err) {
      console.error("Erreur reset journal :", err);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      handleSubmit();
    }
  };

  if (!loadedStorage) {
    return (
      <>
        <Header />

        <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f6f1ff] via-[#f4ecfc] to-[#e8dbff] px-4">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#8E7AB5]" />
            <p className="text-sm text-[#6B5F8E]">
              Chargement du journal émotionnel...
            </p>
          </div>
        </main>

        <div className="hidden sm:block">
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      <main
        className={`relative min-h-screen overflow-hidden px-3 py-20 transition-all duration-500 sm:px-4 sm:py-24 ${mainBackground}`}
      >
        {/* Décor immersif : sphères en orbite + halos flottants animés */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <OrbitGlow
            className="journal-spin right-[-14%] top-16 h-72 w-72 sm:h-[26rem] sm:w-[26rem]"
            stroke={isDay ? "#8E7AB5" : "#FFFFFF"}
          />
          <OrbitGlow
            className="journal-spin-rev left-[-16%] top-[52%] h-80 w-80 sm:h-[32rem] sm:w-[32rem]"
            stroke={isDay ? "#B79CE0" : "#E9D5FF"}
          />
          <div
            className={`journal-float absolute left-1/4 top-24 h-56 w-56 rounded-full blur-[120px] sm:h-72 sm:w-72 ${
              isDay ? "bg-purple-300/40" : "bg-violet-600/25"
            }`}
          />
          <div
            className={`journal-float-slow absolute bottom-10 right-[12%] h-64 w-64 rounded-full blur-[130px] sm:h-80 sm:w-80 ${
              isDay ? "bg-pink-200/50" : "bg-pink-600/20"
            }`}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl space-y-4 sm:space-y-10">
          {/* Hero compact */}
          <motion.section
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`rounded-3xl border p-4 text-center backdrop-blur-md sm:p-6 ${cardBg}`}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <Link
                href="/vibesphere"
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                  isDay
                    ? "border-[#D9B8FF] bg-white/55 text-[#6B5F8E] hover:bg-white"
                    : "border-white/15 bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour
              </Link>

              <div
                className={`grid grid-cols-2 gap-1 rounded-full border p-1 ${
                  isDay
                    ? "border-[#D9B8FF] bg-white/55"
                    : "border-white/20 bg-white/10"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setPeriod("jour")}
                  className={`flex items-center justify-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
                    isDay
                      ? "bg-[#8E7AB5] text-white shadow"
                      : "text-white/70 hover:bg-white/10"
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  Jour
                </button>

                <button
                  type="button"
                  onClick={() => setPeriod("nuit")}
                  className={`flex items-center justify-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
                    !isDay
                      ? "bg-[#8E7AB5] text-white shadow"
                      : "text-[#6B5F8E] hover:bg-white/30"
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  Nuit
                </button>
              </div>
            </div>

            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#8E7AB5]/30 bg-white/35 px-3 py-1.5 text-xs text-[#8E7AB5] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Espace intime Luna
            </div>

            <h1 className={`text-2xl font-black leading-tight sm:text-4xl ${titleClass}`}>
              Journal Émotionnel
            </h1>

            <p className={`mx-auto mt-1.5 max-w-xl text-xs leading-relaxed sm:text-sm ${textSecondary}`}>
              Dépose tes émotions, observe tes cycles intérieurs et transforme
              tes ressentis en repères doux.
            </p>
          </motion.section>

          {/* Formulaire accordéon */}
          <AccordionSection
            title="Écrire une entrée"
            icon="✍️"
            isOpen={formOpen}
            setIsOpen={setFormOpen}
            className={cardBg}
            titleClass={textPrimary}
            mutedClass={textMuted}
            subtitle={
              selectedMood
                ? `${isMoodName(selectedMood) ? moodEmojiMap[selectedMood] : "✨"} ${selectedMood}`
                : "Choisis une humeur ou écris une note."
            }
          >
            <JournalForm
              mood={mood}
              note={note}
              selectedMood={selectedMood}
              isAnalyzing={isAnalyzing}
              aiAnalysis={aiAnalysis}
              error={error}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              textMuted={textMuted}
              softCardBg={softCardBg}
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

          {/* Timeline accordéon */}
          <AccordionSection
            title={`Timeline (${entries.length})`}
            icon="🕰️"
            isOpen={timelineOpen}
            setIsOpen={setTimelineOpen}
            className={cardBg}
            titleClass={textPrimary}
            mutedClass={textMuted}
            subtitle={
              entries.length > 0
                ? "Tes dernières entrées émotionnelles."
                : "Aucune entrée pour le moment."
            }
            rightAction={
              entries.length > 0 ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    resetJournal();
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-2 py-1 text-[10px] transition ${
                    isDay
                      ? "border-red-200 bg-white/45 text-red-500 hover:bg-red-50"
                      : "border-red-400/20 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                  }`}
                >
                  <RefreshCw className="h-3 w-3" />
                  Reset
                </button>
              ) : null
            }
          >
            {entries.length === 0 ? (
              <div className={`rounded-2xl border p-6 text-center ${softCardBg}`}>
                <p className="mb-2 text-4xl">💭</p>

                <p className={`text-sm font-medium ${textPrimary}`}>
                  Aucune entrée pour l’instant
                </p>

                <p className={`mt-1 text-xs ${textMuted}`}>
                  Commence par écrire ton premier mood.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                <AnimatePresence>
                  {entries.map((entry) => (
                    <motion.li
                      key={entry.id}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className={`rounded-2xl border border-l-4 p-3 ${
                        entry.ritualDone
                          ? "border-l-green-500"
                          : "border-l-[#8E7AB5]"
                      } ${softCardBg}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <span className="text-xl">
                            {isMoodName(entry.mood)
                              ? moodEmojiMap[entry.mood]
                              : "📝"}
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className={`truncate text-sm font-semibold ${titleClass}`}>
                                {entry.mood}
                              </h3>

                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] ${
                                  entry.period === "jour"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-900 text-blue-100"
                                }`}
                              >
                                {entry.period === "jour" ? "☀️" : "🌙"}
                              </span>
                            </div>

                            <small className={`text-[10px] ${textMuted}`}>
                              {entry.date}
                            </small>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => handleRitualToggle(entry.id)}
                            className={`rounded-lg px-2 py-1 text-[10px] transition ${
                              entry.ritualDone
                                ? "bg-green-500/20 text-green-700"
                                : "bg-[#8E7AB5]/20 text-[#8E7AB5]"
                            }`}
                          >
                            {entry.ritualDone ? "✅" : "🌱"}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteEntry(entry.id)}
                            className="rounded-lg bg-red-500/15 px-2 py-1 text-xs text-red-600 transition hover:bg-red-500/25"
                            aria-label="Supprimer l'entrée"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {entry.note && entry.note !== "Aucune note" && (
                        <p className={`mt-2 whitespace-pre-wrap text-xs leading-relaxed sm:text-sm ${textPrimary}`}>
                          {entry.note}
                        </p>
                      )}

                      {entry.aiAnalysis && (
                        <div
                          className={`mt-2 rounded-xl border-l-2 border-[#8E7AB5] p-2 ${
                            isDay ? "bg-[#f8f7ff]" : "bg-white/5"
                          }`}
                        >
                          <p className={`text-xs italic leading-relaxed ${textSecondary}`}>
                            🧠 {entry.aiAnalysis}
                          </p>
                        </div>
                      )}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </AccordionSection>

          {/* Playlist accordéon */}
          <AccordionSection
            title="Playlist Luna"
            icon="🎵"
            isOpen={playlistOpen}
            setIsOpen={setPlaylistOpen}
            className={cardBg}
            titleClass={textPrimary}
            mutedClass={textMuted}
            subtitle="Une sélection musicale selon ton mood."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {filteredPlaylist.map((track) => {
                const isPlaying = playingTrack?.url === track.url;

                return (
                  <button
                    key={`${track.title}-${track.mood}`}
                    type="button"
                    onClick={() => setPlayingTrack(track)}
                    className={`group relative w-full overflow-hidden rounded-2xl border p-3 text-left backdrop-blur-md transition hover:scale-[1.02] ${
                      isPlaying
                        ? "border-[#8E7AB5] bg-[#8E7AB5]/15 ring-1 ring-[#8E7AB5]/40"
                        : softCardBg
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Pochette / bouton lecture */}
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#8E7AB5]/35 to-[#5B4B8A]/20 text-lg">
                        <span
                          className={
                            isPlaying
                              ? "opacity-0"
                              : "transition group-hover:opacity-0"
                          }
                        >
                          {isMoodName(track.mood) ? moodEmojiMap[track.mood] : "🎵"}
                        </span>

                        <span
                          className={`absolute inset-0 flex items-center justify-center ${
                            isPlaying
                              ? "opacity-100"
                              : "opacity-0 transition group-hover:opacity-100"
                          }`}
                        >
                          {isPlaying ? (
                            <span className="flex items-end gap-[2px]">
                              <span className="eq-bar h-4 w-[3px] rounded-full bg-[#8E7AB5]" />
                              <span
                                className="eq-bar h-4 w-[3px] rounded-full bg-[#8E7AB5]"
                                style={{ animationDelay: "0.2s" }}
                              />
                              <span
                                className="eq-bar h-4 w-[3px] rounded-full bg-[#8E7AB5]"
                                style={{ animationDelay: "0.4s" }}
                              />
                            </span>
                          ) : (
                            <Play
                              className="h-4 w-4 text-[#8E7AB5]"
                              fill="currentColor"
                            />
                          )}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h3 className={`text-sm font-semibold ${textPrimary}`}>
                          {track.title}
                        </h3>

                        <p className={`text-xs ${textMuted}`}>
                          Humeur : {track.mood}
                        </p>

                        <p className={`mt-1 text-xs leading-relaxed ${textMuted}`}>
                          {track.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </AccordionSection>

          {/* Stats accordéon */}
          <AccordionSection
            title="Tes statistiques"
            icon="📊"
            isOpen={statsOpen}
            setIsOpen={setStatsOpen}
            className={cardBg}
            titleClass={textPrimary}
            mutedClass={textMuted}
            subtitle="Ton activité émotionnelle locale."
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
              <StatCard label="Entrées" value={stats.total} />
              <StatCard label="Rituels" value={stats.rituals} />
              <StatCard label="Humeurs" value={stats.uniqueMoods} />
              <StatCard label="Jour" value={stats.dayEntries} />
              <StatCard label="Nuit" value={stats.nightEntries} />
            </div>
          </AccordionSection>
        </div>
      </main>

      <div className="hidden sm:block">
        <Footer />
      </div>

      {/* Lecteur musical intégré (dock bas de page, style Spotify) */}
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
        @keyframes journal-float {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-26px);
            opacity: 1;
          }
        }
        @keyframes journal-float-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(26px);
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
        .journal-float {
          animation: journal-float 12s ease-in-out infinite;
        }
        .journal-float-slow {
          animation: journal-float-slow 16s ease-in-out infinite;
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
          .journal-float,
          .journal-float-slow,
          .eq-bar {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────
// Composant accordéon générique
// ─────────────────────────────────────────────

function AccordionSection({
  title,
  subtitle,
  icon,
  isOpen,
  setIsOpen,
  className,
  titleClass,
  mutedClass,
  rightAction,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  className: string;
  titleClass: string;
  mutedClass: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`overflow-hidden rounded-3xl border shadow-xl backdrop-blur-md ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left sm:px-5 sm:py-4"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#8E7AB5]/15 text-lg">
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <h2 className={`truncate text-sm font-bold sm:text-xl ${titleClass}`}>
            {title}
          </h2>

          {subtitle && (
            <p className={`truncate text-[11px] sm:text-sm ${mutedClass}`}>
              {subtitle}
            </p>
          )}
        </div>

        {rightAction}

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#8E7AB5] transition-transform ${
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
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/20 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

// ─────────────────────────────────────────────
// Formulaire du journal
// ─────────────────────────────────────────────

function JournalForm({
  mood,
  note,
  selectedMood,
  isAnalyzing,
  aiAnalysis,
  error,
  textPrimary,
  textSecondary,
  textMuted,
  softCardBg,
  setMood,
  setNote,
  setSelectedMood,
  setError,
  handleMoodSelect,
  handleSubmit,
  clearCurrentInput,
  handleKeyDown,
}: {
  mood: string;
  note: string;
  selectedMood: string;
  isAnalyzing: boolean;
  aiAnalysis: string | null;
  error: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  softCardBg: string;
  setMood: React.Dispatch<React.SetStateAction<string>>;
  setNote: React.Dispatch<React.SetStateAction<string>>;
  setSelectedMood: React.Dispatch<React.SetStateAction<string>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  handleMoodSelect: (selected: MoodName) => void;
  handleSubmit: () => void;
  clearCurrentInput: () => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
}) {
  return (
    <>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-3 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-500 sm:text-sm"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>

            <button type="button" onClick={() => setError("")}>
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Moods */}
      <div className="mb-4">
        <p className={`mb-2 text-xs font-semibold sm:text-sm ${textPrimary}`}>
          Choisis ton humeur Luna
        </p>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
          {moodSuggestions.map((label) => {
            const selected = mood === label;

            return (
              <button
                key={label}
                type="button"
                onClick={() => handleMoodSelect(label)}
                className={`rounded-2xl border p-2 text-center transition hover:scale-[1.03] sm:p-3 ${
                  selected
                    ? "border-[#8E7AB5] bg-[#8E7AB5]/30 shadow-lg"
                    : `${softCardBg} hover:bg-white/20`
                }`}
                title={label}
              >
                <span className="block text-xl sm:text-3xl">
                  {moodEmojiMap[label]}
                </span>

                <span className={`mt-1 block text-[10px] sm:text-[11px] ${textMuted}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className={`text-xs font-medium sm:text-sm ${textPrimary}`}>
            Humeur du moment
          </span>

          <input
            value={mood}
            onChange={(event) => {
              setMood(event.target.value);
              setSelectedMood("");
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="ex : Apaisé(e), Énergique..."
            className="mt-1 w-full rounded-xl border border-[#8E7AB5]/30 bg-white/85 p-2.5 text-sm text-[#1C1C1C] outline-none transition focus:border-[#8E7AB5] sm:p-3"
          />
        </label>

        <label className="block">
          <span className={`text-xs font-medium sm:text-sm ${textPrimary}`}>
            Note ou pensée
          </span>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écris librement..."
            rows={3}
            className="mt-1 w-full resize-none rounded-xl border border-[#8E7AB5]/30 bg-white/85 p-2.5 text-sm text-[#1C1C1C] outline-none transition focus:border-[#8E7AB5] sm:p-3"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isAnalyzing}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#8E7AB5] px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyse...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Ajouter
            </>
          )}
        </button>

        <button
          type="button"
          onClick={clearCurrentInput}
          className="rounded-full border border-[#8E7AB5] px-5 py-2.5 text-sm font-medium text-[#8E7AB5] transition hover:bg-[#8E7AB5]/10"
        >
          Effacer
        </button>
      </div>

      {isAnalyzing && (
        <p className="mt-3 animate-pulse text-center text-xs italic text-[#8E7AB5] sm:text-sm">
          Analyse IA en cours...
        </p>
      )}

      <AnimatePresence>
        {aiAnalysis && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mt-4 rounded-xl border p-3 sm:p-4 ${softCardBg}`}
          >
            <h3 className={`mb-1 flex items-center gap-2 text-sm font-semibold ${textPrimary}`}>
              <Sparkles className="h-4 w-4 text-[#8E7AB5]" />
              Analyse IA
            </h3>

            <p className={`text-xs leading-relaxed sm:text-sm ${textSecondary}`}>
              {aiAnalysis}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────
// Card statistique
// ─────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/35 p-3 text-center sm:p-4">
      <p className="text-xl font-bold text-[#8E7AB5] sm:text-2xl">{value}</p>
      <p className="text-xs text-[#6B5F8E] sm:text-sm">{label}</p>
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
