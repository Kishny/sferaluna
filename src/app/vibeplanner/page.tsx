"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronDown, ChevronUp } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Bibliothèque d'idées hardcodée
const IDEAS_LIBRARY = [
  { category: "créatif", categoryEmoji: "🎨", title: "Atelier peinture & vin", emoji: "🍷", description: "Peignez ensemble en dégustant un verre de vin dans une ambiance détendue." },
  { category: "créatif", categoryEmoji: "🎨", title: "Poterie ensemble", emoji: "🏺", description: "Modelez l'argile côte à côte pour créer quelque chose d'unique." },
  { category: "créatif", categoryEmoji: "🎨", title: "Escape game", emoji: "🔐", description: "Résolvez des énigmes ensemble sous pression — révélateur de personnalité !" },
  { category: "aventure", categoryEmoji: "🏕️", title: "Randonnée au coucher du soleil", emoji: "🌅", description: "Marchez vers un panorama magique et regardez le soleil se coucher." },
  { category: "aventure", categoryEmoji: "🏕️", title: "Pique-nique surprise", emoji: "🧺", description: "Préparez un panier garni dans un endroit secret que vous avez choisi." },
  { category: "aventure", categoryEmoji: "🏕️", title: "Vélo en forêt", emoji: "🚵", description: "Une balade à vélo sur des sentiers forestiers pour s'évader." },
  { category: "cosy", categoryEmoji: "🛋️", title: "Soirée films", emoji: "🎬", description: "Choisissez chacun un film et regardez-les avec pop-corn maison." },
  { category: "cosy", categoryEmoji: "🛋️", title: "Blind test musical", emoji: "🎵", description: "Testez vos connaissances musicales à la maison avec une playlist surprise." },
  { category: "cosy", categoryEmoji: "🛋️", title: "Jeux de société", emoji: "🎲", description: "Une soirée jeux de société pour rire et se challenger." },
  { category: "culture", categoryEmoji: "🏛️", title: "Visite de musée", emoji: "🖼️", description: "Explorez une exposition qui vous inspire et échangez vos impressions." },
  { category: "culture", categoryEmoji: "🏛️", title: "Concert acoustique", emoji: "🎸", description: "Un concert intimiste dans une petite salle pour vivre la musique autrement." },
  { category: "culture", categoryEmoji: "🏛️", title: "Expo photo", emoji: "📸", description: "Découvrez l'œil d'un artiste et partagez vos émotions devant les clichés." },
  { category: "sport", categoryEmoji: "🏊", title: "Cours de danse", emoji: "💃", description: "Apprenez quelques pas ensemble — salsa, bachata ou rock." },
  { category: "sport", categoryEmoji: "🏊", title: "Yoga en plein air", emoji: "🧘", description: "Un cours de yoga au parc pour commencer la journée en douceur." },
  { category: "sport", categoryEmoji: "🏊", title: "Natation", emoji: "🏊", description: "Quelques longueurs ensemble dans une ambiance légère et rafraîchissante." },
  { category: "gastronomie", categoryEmoji: "🍷", title: "Cours de cuisine", emoji: "👩‍🍳", description: "Apprenez à cuisiner un plat du monde sous la guidance d'un chef." },
  { category: "gastronomie", categoryEmoji: "🍷", title: "Dégustation de vins", emoji: "🍾", description: "Initiez-vous à l'œnologie avec une dégustation commentée." },
  { category: "gastronomie", categoryEmoji: "🍷", title: "Brunch découverte", emoji: "🥞", description: "Explorez un nouveau resto brunch pour commencer le week-end ensemble." },
];

const CATEGORIES = ["créatif", "aventure", "cosy", "culture", "sport", "gastronomie"] as const;

interface Match {
  _id: string;
  user1Id: { _id: string; pseudonyme: string };
  user2Id: { _id: string; pseudonyme: string };
}

interface VibePlan {
  _id: string;
  matchId: { _id: string; user1Id: string; user2Id: string } | string;
  proposedById: { _id: string; pseudonyme: string; image?: string };
  title: string;
  description: string;
  category: string;
  emoji: string;
  status: "pending" | "accepted" | "rejected";
  scheduledAt?: string;
  createdAt: string;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function VibePlannerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"idees" | "plans">("idees");
  const [plans, setPlans] = useState<VibePlan[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal proposition
  const [proposalModal, setProposalModal] = useState<{ idea: typeof IDEAS_LIBRARY[0] } | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [proposing, setProposing] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState(false);

  // Expanded categories
  const [expandedCat, setExpandedCat] = useState<string | null>("créatif");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vibeplanner");
      const data = await res.json();
      if (data.success) setPlans(data.plans);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches");
      const data = await res.json();
      if (data.success) setMatches(data.matches ?? []);
    } catch {
      // silencieux
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPlans();
      fetchMatches();
    }
  }, [status, fetchPlans, fetchMatches]);

  const handlePropose = async () => {
    if (!proposalModal || !selectedMatchId) return;
    setProposing(true);
    try {
      const idea = proposalModal.idea;
      const res = await fetch("/api/vibeplanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedMatchId,
          title: idea.title,
          description: idea.description,
          category: idea.category,
          emoji: idea.emoji,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProposalSuccess(true);
        setPlans((prev) => [data.plan, ...prev]);
        setTimeout(() => {
          setProposalModal(null);
          setProposalSuccess(false);
          setSelectedMatchId("");
        }, 1500);
      }
    } catch {
      // silencieux
    } finally {
      setProposing(false);
    }
  };

  const handleRespond = async (planId: string, status: "accepted" | "rejected") => {
    try {
      const res = await fetch("/api/vibeplanner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setPlans((prev) => prev.map((p) => (p._id === planId ? { ...p, status } : p)));
      }
    } catch {
      // silencieux
    }
  };

  const currentUserId = (session?.user as any)?._id ?? (session?.user as any)?.id;

  const statusBadge = (s: VibePlan["status"]) => {
    if (s === "pending") return <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200">🟡 En attente</span>;
    if (s === "accepted") return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-200">✅ Accepté</span>;
    return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200">❌ Refusé</span>;
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff]">
        <Header />
        <main className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-bold text-[#2d1b69]">VibePlanner 📅</h1>
            <p className="text-[#8E7AB5] mt-1">Planifiez des moments inoubliables avec vos matchs</p>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-white rounded-2xl p-1 shadow-sm border border-[#e8e0f5] w-fit">
            <button
              onClick={() => setActiveTab("idees")}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === "idees" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow" : "text-[#5B4B8A] hover:bg-purple-50"
              }`}
            >
              💡 Idées
            </button>
            <button
              onClick={() => setActiveTab("plans")}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === "plans" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow" : "text-[#5B4B8A] hover:bg-purple-50"
              }`}
            >
              📋 Mes Plans
            </button>
          </div>

          {/* Tab Idées */}
          {activeTab === "idees" && (
            <div className="space-y-4">
              {CATEGORIES.map((cat) => {
                const catIdeas = IDEAS_LIBRARY.filter((i) => i.category === cat);
                const catEmoji = catIdeas[0]?.categoryEmoji ?? "";
                const isOpen = expandedCat === cat;
                return (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-[#e8e0f5] shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedCat(isOpen ? null : cat)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-purple-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{catEmoji}</span>
                        <span className="font-semibold text-[#2d1b69] capitalize">{cat}</span>
                        <span className="text-xs text-[#8E7AB5] bg-purple-50 px-2 py-0.5 rounded-full">{catIdeas.length} idées</span>
                      </div>
                      {isOpen ? <ChevronUp size={16} className="text-[#8E7AB5]" /> : <ChevronDown size={16} className="text-[#8E7AB5]" />}
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid sm:grid-cols-3 gap-3 px-5 pb-5">
                            {catIdeas.map((idea) => (
                              <div
                                key={idea.title}
                                className="bg-gradient-to-br from-[#faf9ff] to-[#f0ecff] rounded-xl p-4 border border-[#e8e0f5]"
                              >
                                <div className="text-2xl mb-2">{idea.emoji}</div>
                                <h3 className="font-semibold text-[#2d1b69] text-sm mb-1">{idea.title}</h3>
                                <p className="text-[#8E7AB5] text-xs leading-relaxed mb-3">{idea.description}</p>
                                <button
                                  onClick={() => { setProposalModal({ idea }); setSelectedMatchId(""); setProposalSuccess(false); }}
                                  className="w-full text-xs py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-500 hover:to-pink-500 transition-all"
                                >
                                  Proposer à un match
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Tab Plans */}
          {activeTab === "plans" && (
            <div>
              {loading ? (
                <p className="text-center text-[#8E7AB5] py-12">Chargement des plans…</p>
              ) : plans.length === 0 ? (
                <div className="text-center py-6 md:py-12 text-[#8E7AB5]">
                  <p className="text-4xl mb-3">📋</p>
                  <p>Aucun plan pour le moment. Proposez une idée à un match !</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {plans.map((plan) => {
                    const isProposer = plan.proposedById?._id === currentUserId;
                    return (
                      <motion.div
                        key={plan._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-5 border border-[#e8e0f5] shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">{plan.emoji}</span>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-[#2d1b69]">{plan.title}</h3>
                                {statusBadge(plan.status)}
                              </div>
                              <p className="text-[#8E7AB5] text-sm mt-1">{plan.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0">
                                  {plan.proposedById?.image ? (
                                    <img src={plan.proposedById.image} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    getInitials(plan.proposedById?.pseudonyme ?? "?")
                                  )}
                                </div>
                                <span className="text-xs text-[#8E7AB5]">
                                  Proposé par{" "}
                                  <span className="font-medium text-[#5B4B8A]">
                                    {isProposer ? "vous" : plan.proposedById?.pseudonyme}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* Accepter/refuser si pending et pas le proposant */}
                          {plan.status === "pending" && !isProposer && (
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleRespond(plan._id, "accepted")}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors"
                              >
                                <Check size={12} />
                                Accepter
                              </button>
                              <button
                                onClick={() => handleRespond(plan._id, "rejected")}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                              >
                                <X size={12} />
                                Refuser
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <Footer />

      {/* Modal proposition */}
      <AnimatePresence>
        {proposalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setProposalModal(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              {proposalSuccess ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">✅</div>
                  <h3 className="font-bold text-[#2d1b69] text-lg">Proposition envoyée !</h3>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-[#2d1b69] text-lg mb-1">
                    {proposalModal.idea.emoji} {proposalModal.idea.title}
                  </h3>
                  <p className="text-[#8E7AB5] text-sm mb-4">{proposalModal.idea.description}</p>

                  <label className="block text-sm font-medium text-[#5B4B8A] mb-2">Proposer à quel match ?</label>
                  {matches.length === 0 ? (
                    <p className="text-[#8E7AB5] text-sm">Vous n&apos;avez pas encore de match. Allez explorer des profils !</p>
                  ) : (
                    <select
                      value={selectedMatchId}
                      onChange={(e) => setSelectedMatchId(e.target.value)}
                      className="w-full border border-[#e8e0f5] rounded-xl px-3 py-2.5 text-[#2d1b69] focus:outline-none focus:border-purple-400 mb-4"
                    >
                      <option value="">Choisir un match…</option>
                      {matches.map((m: any) => {
                        const other = m.user1Id?._id === currentUserId ? m.user2Id : m.user1Id;
                        return (
                          <option key={m._id} value={m._id}>
                            {other?.pseudonyme ?? "Match"}
                          </option>
                        );
                      })}
                    </select>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setProposalModal(null)}
                      className="flex-1 py-2.5 rounded-xl border border-[#e8e0f5] text-[#8E7AB5] text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handlePropose}
                      disabled={!selectedMatchId || proposing}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium disabled:opacity-40 hover:from-purple-500 hover:to-pink-500 transition-all"
                    >
                      {proposing ? "Envoi…" : "Proposer"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
