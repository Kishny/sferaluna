"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Entry = {
  id: number;
  mood: string;
  note: string;
  date: string;
  ritualDone: boolean;
  period: "jour" | "nuit";
  aiAnalysis?: string;
};

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mood, setMood] = useState("");
  const [note, setNote] = useState("");
  const [period, setPeriod] = useState<"jour" | "nuit">("jour");
  const [selectedMood, setSelectedMood] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [background, setBackground] = useState("");

  const isDay = period === "jour";

  const titleClass = isDay ? "text-[#5B4B8A]" : "text-[#D9B8FF]";
  const textPrimary = isDay ? "text-[#2E2A3A]" : "text-white";
  const textSecondary = isDay ? "text-[#6B5F8E]" : "text-white/80";
  const textMuted = isDay ? "text-[#7A6AA4]" : "text-white/60";
  const cardBg = isDay
    ? "bg-white/70 border-[#D9B8FF]"
    : "bg-white/10 border-white/20";

  const moodEmojiMap: Record<string, string> = {
    Apaisé: "🌿",
    Énergique: "⚡️",
    Triste: "🌧️",
    Amoureux: "💖",
    Pensif: "💭",
    Heureux: "🌞",
  };

  const moodSoundMap: Record<string, string> = {
    Apaisé: "/sounds/apaisé.mp3",
    Énergique: "/sounds/energie.mp3",
    Triste: "/sounds/triste.mp3",
    Amoureux: "/sounds/amour.mp3",
    Pensif: "/sounds/pensif.mp3",
    Heureux: "/sounds/heureux.mp3",
  };

  // Charger les entrées depuis localStorage
  useEffect(() => {
    const data = localStorage.getItem("vibe-journal");

    if (!data || data === "undefined" || data === "null") {
      localStorage.removeItem("vibe-journal");
      return;
    }

    try {
      const parsed = JSON.parse(data);

      if (!Array.isArray(parsed)) {
        localStorage.removeItem("vibe-journal");
        return;
      }

      setEntries(parsed);

      if (parsed.length > 0) {
        const lastEntry = parsed[0];
        setMood(lastEntry.mood || "");
        setAiAnalysis(lastEntry.aiAnalysis || null);
        setSelectedMood(lastEntry.mood || "");
      }
    } catch (error) {
      console.error("Données localStorage invalides:", error);
      localStorage.removeItem("vibe-journal");
    }
  }, []);

  // Sauvegarder les entrées dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem("vibe-journal", JSON.stringify(entries));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  }, [entries]);

  // Changer le fond selon l'humeur
  useEffect(() => {
    switch (mood) {
      case "Apaisé":
        setBackground("bg-gradient-to-br from-[#d0f0c0] to-[#f0fff0]");
        break;
      case "Triste":
        setBackground("bg-gradient-to-br from-[#4b6cb7] to-[#182848]");
        break;
      case "Énergique":
        setBackground("bg-gradient-to-br from-[#ffe259] to-[#ffa751]");
        break;
      case "Amoureux":
        setBackground("bg-gradient-to-br from-[#ff9a9e] to-[#fad0c4]");
        break;
      case "Pensif":
        setBackground("bg-gradient-to-br from-[#a1c4fd] to-[#c2e9fb]");
        break;
      case "Heureux":
        setBackground("bg-gradient-to-br from-[#f6d365] to-[#fda085]");
        break;
      default:
        setBackground("");
        break;
    }
  }, [mood]);

  const simulateAiAnalysis = (mood: string): string => {
    const responses: Record<string, string> = {
      Apaisé:
        "Tu sembles en harmonie. Prends ce moment pour te reconnecter à toi-même 🌿",
      Énergique:
        "Tu débordes d'énergie ! Canalise-la vers un projet positif ⚡️",
      Triste:
        "Tu vis un passage délicat. Accueille cette émotion avec douceur 🌧️",
      Amoureux: "L'amour est dans l'air ! Cultive cette belle énergie 💖",
      Pensif:
        "Tu explores ton monde intérieur. Laisse-toi guider par tes réflexions 💭",
      Heureux: "Profite de cette belle vibration ! Souris à la vie 🌞",
    };
    return (
      responses[mood] ||
      "Ton état d'âme est unique. Écoute ce qu'il cherche à te dire."
    );
  };

  const playMoodSound = (mood: string) => {
    const sound = moodSoundMap[mood];
    if (sound) {
      try {
        const audio = new Audio(sound);
        audio.volume = 0.4;
        audio.play().catch((error) => {
          console.log("Son non joué (normal sur certains navigateurs):", error);
        });
      } catch (error) {
        console.log("Erreur de lecture audio:", error);
      }
    }
  };

  const handleSubmit = () => {
    if (!mood.trim() && !note.trim()) {
      alert("Veuillez saisir une humeur ou une note");
      return;
    }

    setIsAnalyzing(true);
    if (mood) {
      playMoodSound(mood);
    }

    setTimeout(() => {
      const analysis = mood
        ? simulateAiAnalysis(mood)
        : "Aucune humeur détectée. Ta note est précieuse 💫";
      setAiAnalysis(analysis);

      const newEntry: Entry = {
        id: Date.now(),
        mood: mood || "Non spécifié",
        note: note || "Aucune note",
        date: new Date().toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        ritualDone: false,
        period,
        aiAnalysis: analysis,
      };

      setEntries([newEntry, ...entries]);
      setMood("");
      setNote("");
      setSelectedMood("");
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleRitualToggle = (id: number) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ritualDone: !e.ritualDone } : e)),
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  const deleteEntry = (id: number) => {
    if (window.confirm("Supprimer cette entrée ?")) {
      setEntries(entries.filter((entry) => entry.id !== id));
    }
  };

  // Rendu conditionnel du fond
  const getMainBackground = () => {
    if (background && mood) {
      return background;
    }
    return isDay
      ? "bg-gradient-to-br from-[#f6f1ff] via-[#f4ecfc] to-[#e8dbff]"
      : "bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e]";
  };

  return (
    <>
      <Header />

      <main
        className={`min-h-screen px-4 py-20 transition-all duration-500 ${getMainBackground()}`}
      >
        <div className="max-w-3xl mx-auto space-y-16">
          {/* 🧠 Titre */}
          <motion.h1
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className={`text-4xl font-bold text-center ${titleClass}`}
          >
            Ton Journal Émotionnel
          </motion.h1>

          {/* ☀️🌙 Mode jour / nuit */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setPeriod("jour")}
              className={`px-4 py-2 rounded-full border transition ${
                isDay
                  ? "bg-[#8E7AB5] text-white"
                  : "bg-white/20 text-white border-white/30"
              }`}
            >
              ☀️ Mode Jour
            </button>
            <button
              onClick={() => setPeriod("nuit")}
              className={`px-4 py-2 rounded-full border transition ${
                !isDay
                  ? "bg-[#8E7AB5] text-white"
                  : "bg-white/20 text-white border-white/30"
              }`}
            >
              🌙 Mode Nuit
            </button>
          </div>

          {/* ✍️ Formulaire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-6 space-y-4 backdrop-blur-md border ${cardBg}`}
          >
            <label className="block">
              <span className={`text-sm font-medium ${textPrimary}`}>
                Ton humeur du moment
              </span>
              <input
                value={mood}
                onChange={(e) => {
                  setMood(e.target.value);
                  setSelectedMood("");
                }}
                onKeyDown={handleKeyPress}
                placeholder="ex : Apaisé(e), Énergique..."
                className="w-full mt-1 p-2 rounded-md bg-white/80 text-[#1C1C1C] border border-[#8E7AB5]/30 focus:border-[#8E7AB5] focus:outline-none"
              />
            </label>

            <label className="block">
              <span className={`text-sm font-medium ${textPrimary}`}>
                Une note ou une pensée
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Écris librement..."
                rows={4}
                className="w-full mt-1 p-2 rounded-md bg-white/80 text-[#1C1C1C] border border-[#8E7AB5]/30 focus:border-[#8E7AB5] focus:outline-none"
              />
            </label>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={isAnalyzing}
                className="bg-[#8E7AB5] text-white px-6 py-2 rounded-full shadow hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed flex-1"
              >
                {isAnalyzing
                  ? "Analyse en cours..."
                  : "Ajouter à ma timeline ✍️"}
              </button>
              <button
                onClick={() => {
                  setMood("");
                  setNote("");
                  setSelectedMood("");
                  setAiAnalysis(null);
                }}
                className="px-4 py-2 rounded-full border border-[#8E7AB5] text-[#8E7AB5] hover:bg-[#8E7AB5]/10 transition"
              >
                Effacer
              </button>
            </div>

            {isAnalyzing && (
              <p className="text-sm italic text-center animate-pulse mt-2 text-[#8E7AB5]">
                Analyse IA en cours<span className="animate-bounce">...</span>
              </p>
            )}

            {aiAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-4 rounded-lg border ${cardBg}`}
              >
                <h3 className={`font-semibold mb-1 ${textPrimary}`}>
                  🧠 Résultat de l'analyse IA :
                </h3>
                <p className={textSecondary}>{aiAnalysis}</p>
              </motion.div>
            )}
          </motion.div>

          {/* 🎭 Avatars d'humeur */}
          <section className="text-center space-y-6">
            <h2 className={`text-2xl font-semibold ${titleClass}`}>
              🎭 Choisis ton humeur Luna
            </h2>
            <p className={`${textSecondary} max-w-xl mx-auto`}>
              Clique sur une émotion pour définir ton mood. Ton journal, ton
              ambiance, ta vibe.
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 justify-center">
              {Object.entries(moodEmojiMap).map(([label, emoji]) => (
                <button
                  key={label}
                  onClick={() => {
                    setMood(label);
                    setSelectedMood(label);
                  }}
                  className={`text-3xl p-4 rounded-full border backdrop-blur-md transition hover:scale-110 ${
                    mood === label
                      ? "bg-[#8E7AB5]/80 border-white shadow-lg"
                      : cardBg
                  }`}
                  title={label}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {selectedMood && (
              <p className={`${textMuted} italic`}>
                Humeur sélectionnée : <strong>{selectedMood}</strong>
              </p>
            )}
          </section>

          {/* 🌀 Timeline */}
          <section className="space-y-6">
            <h2 className={`text-2xl font-semibold ${titleClass}`}>
              🌀 Timeline émotionnelle ({entries.length})
            </h2>

            {entries.length === 0 ? (
              <p className={`${textMuted} italic text-center py-8`}>
                Aucune entrée pour l'instant. Commence par écrire ton premier
                mood !
              </p>
            ) : (
              <ul className="space-y-4">
                {entries.map((entry) => (
                  <motion.li
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`border-l-4 ${entry.ritualDone ? "border-green-500" : "border-[#8E7AB5]"} pl-4 py-3 ${cardBg} rounded-r-lg`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {moodEmojiMap[entry.mood] || "📝"}
                        </span>
                        <h3 className={`font-medium ${titleClass}`}>
                          {entry.mood}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${entry.period === "jour" ? "bg-yellow-100 text-yellow-800" : "bg-blue-900 text-blue-100"}`}
                        >
                          {entry.period === "jour" ? "☀️" : "🌙"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRitualToggle(entry.id)}
                          className={`text-xs px-2 py-1 rounded ${
                            entry.ritualDone
                              ? "bg-green-500/20 text-green-700"
                              : "bg-[#8E7AB5]/20 text-[#8E7AB5]"
                          }`}
                        >
                          {entry.ritualDone
                            ? "✅ Rituel fait"
                            : "🌱 Faire rituel"}
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-700"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <small className={textMuted}>{entry.date}</small>
                    {entry.note && entry.note !== "Aucune note" && (
                      <p className={`${textPrimary} mt-2`}>{entry.note}</p>
                    )}
                    {entry.aiAnalysis && (
                      <div
                        className={`mt-3 p-3 rounded border-l-2 border-[#8E7AB5] ${isDay ? "bg-[#f8f7ff]" : "bg-white/5"}`}
                      >
                        <p className={`${textSecondary} italic text-sm`}>
                          🧠 {entry.aiAnalysis}
                        </p>
                      </div>
                    )}
                  </motion.li>
                ))}
              </ul>
            )}
          </section>

          {/* 🎵 Playlist Luna */}
          <section className="text-center space-y-6">
            <h2 className={`text-2xl font-semibold ${titleClass}`}>
              🎵 Playlist Luna
            </h2>
            <p className={`${textSecondary} max-w-xl mx-auto`}>
              Une playlist évolutive pour accompagner ton mood.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: "Lunar Chill",
                  url: "https://www.youtube.com/watch?v=5qap5aO4i9A",
                  mood: "Apaisé",
                },
                {
                  title: "Cosmic Flow",
                  url: "https://www.youtube.com/watch?v=DWcJFNfaw9c",
                  mood: "Énergique",
                },
                {
                  title: "Emotional Release",
                  url: "https://www.youtube.com/watch?v=hHW1oY26kxQ",
                  mood: "Triste",
                },
                {
                  title: "Inner Peace",
                  url: "https://www.youtube.com/watch?v=MkNeIUgNPQ8",
                  mood: "Pensif",
                },
              ].map((track, i) => (
                <a
                  key={i}
                  href={track.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block p-4 rounded-lg border backdrop-blur-md transition hover:scale-105 ${cardBg}`}
                >
                  <h3 className={`text-lg font-medium ${textPrimary}`}>
                    {track.title}
                  </h3>
                  <p className={`text-sm ${textMuted}`}>
                    Humeur : {track.mood}
                  </p>
                  <p className={`text-xs mt-1 ${textMuted}`}>
                    Clique pour écouter sur YouTube
                  </p>
                </a>
              ))}
            </div>
          </section>

          {/* 📊 Statistiques */}
          <section className={`rounded-xl p-6 ${cardBg}`}>
            <h2 className={`text-2xl font-semibold mb-4 ${titleClass}`}>
              📊 Tes statistiques
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-white/30">
                <p className="text-2xl font-bold text-[#8E7AB5]">
                  {entries.length}
                </p>
                <p className={textSecondary}>Total entrées</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/30">
                <p className="text-2xl font-bold text-[#8E7AB5]">
                  {entries.filter((e) => e.ritualDone).length}
                </p>
                <p className={textSecondary}>Rituels complétés</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/30">
                <p className="text-2xl font-bold text-[#8E7AB5]">
                  {[...new Set(entries.map((e) => e.mood))].length}
                </p>
                <p className={textSecondary}>Humeurs différentes</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-white/30">
                <p className="text-2xl font-bold text-[#8E7AB5]">
                  {entries.filter((e) => e.period === "jour").length}
                </p>
                <p className={textSecondary}>Entrées jour</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
