"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Heart,
  MessageCircle,
  MapPin,
  Sparkles,
  Loader2,
  Search,
  RefreshCw,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

interface MatchUser {
  _id: string;
  pseudonyme: string;
  age?: number;
  localisation?: string;
  interets: string[];
  intentions: string[];
  image?: string;
}

interface MatchItem {
  matchId: string;
  createdAt: string;
  lastMessageAt: string | null;
  user: MatchUser | null;
}

export default function MatchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchMatches();
    }
  }, [status]);

  const fetchMatches = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/matches", { cache: "no-store" });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Impossible de charger les matches.");
        return;
      }

      setMatches(data.matches ?? []);
    } catch (err) {
      console.error("Erreur fetchMatches :", err);
      setError("Erreur de connexion au serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMatches = matches.filter((m) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      m.user?.pseudonyme?.toLowerCase().includes(term) ||
      m.user?.localisation?.toLowerCase().includes(term)
    );
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return d.toLocaleDateString("fr-FR");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82]">
        <Loader2 className="h-10 w-10 text-purple-300 animate-spin" />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              Mes Matches
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {isLoading
                ? "Chargement..."
                : `${matches.length} match${matches.length > 1 ? "s" : ""}`}
            </p>
          </div>

          <button
            onClick={fetchMatches}
            className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            title="Rafraîchir"
          >
            <RefreshCw className="h-5 w-5 text-gray-300" />
          </button>
        </div>

        {/* Recherche */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un match..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-400 transition"
          />
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Loader */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 text-purple-300 animate-spin" />
            <p className="text-gray-400">Chargement de vos matches...</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          /* État vide */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-6 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Heart className="h-10 w-10 text-pink-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">
                {searchTerm ? "Aucun résultat" : "Pas encore de matches"}
              </h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                {searchTerm
                  ? "Essayez un autre terme de recherche."
                  : "Commencez à explorer des profils pour créer vos premiers matches !"}
              </p>
            </div>
            {!searchTerm && (
              <Link
                href="/explorer"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition flex items-center gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Explorer des profils
              </Link>
            )}
          </motion.div>
        ) : (
          /* Liste des matches */
          <div className="space-y-3">
            {filteredMatches.map((match, index) => {
              const user = match.user;
              if (!user) return null;

              return (
                <motion.div
                  key={match.matchId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold overflow-hidden">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.pseudonyme}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          user.pseudonyme.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-[#1a0b2e]" />
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h3 className="font-bold text-white truncate">{user.pseudonyme}</h3>
                        {user.age && (
                          <span className="text-gray-400 text-sm flex-shrink-0">
                            {user.age} ans
                          </span>
                        )}
                      </div>

                      {user.localisation && (
                        <p className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {user.localisation}
                        </p>
                      )}

                      {user.interets?.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {user.interets.slice(0, 3).map((interet) => (
                            <span
                              key={interet}
                              className="px-2 py-0.5 rounded-full bg-white/10 text-gray-300 text-xs"
                            >
                              {interet}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {match.lastMessageAt && (
                        <span className="text-gray-500 text-xs">
                          {formatDate(match.lastMessageAt)}
                        </span>
                      )}

                      <div className="flex gap-2">
                        <span className="text-xs text-gray-500 self-center">
                          Match {formatDate(match.createdAt)}
                        </span>
                        <Link
                          href={`/messages/${match.matchId}`}
                          className="p-2 rounded-xl bg-purple-500/20 border border-purple-400/20 text-purple-300 hover:bg-purple-500/30 transition"
                          title="Ouvrir la conversation"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
    <Footer />
    </>
  );
}
