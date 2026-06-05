// src/app/profil/[id]/page.tsx

"use client";

/**
 * Page de détail d'un profil SferaLuna.
 *
 * Cette page permet :
 * - d'afficher le profil public d'un utilisateur ;
 * - de revenir intelligemment vers la page précédente selon le paramètre ?from= ;
 * - de signaler un profil via ReportModal ;
 * - d'afficher les infos principales : avatar, âge, ville, orientation, bio, intentions, intérêts ;
 * - de garder un design cohérent avec Explorer / Matches / Mon Compte.
 *
 * Correction importante :
 * ReportModal exige la prop `isOpen`.
 * L'erreur TypeScript venait du fait qu'elle n'était pas passée.
 */

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Flag,
  MapPin,
  Heart,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  User,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReportModal from "@/components/ReportModal";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Profile {
  _id: string;
  pseudonyme: string;
  age?: number;
  localisation?: string;
  bio?: string;
  image?: string;
  interets: string[];
  intentions: string[];
  orientation?: string;
  identityVerified?: boolean;
  createdAt?: string;
}

// ─────────────────────────────────────────────
// Labels
// ─────────────────────────────────────────────

const orientationLabels: Record<string, string> = {
  hetero: "Hétérosexuelle",
  homo: "Lesbienne / Homosexuelle",
  bi: "Bisexuelle",
  pan: "Pansexuelle",
  curieuse: "Curieuse — souhaite découvrir",
  other: "Autre",
};

const intentionLabels: Record<string, string> = {
  "rencontre-serieuse": "Rencontre sérieuse",
  amitie: "Amitié",
  aventure: "Aventure",
  reseautage: "Réseautage",
  discussion: "Discussion",
};

// ─────────────────────────────────────────────
// Contenu principal
// ─────────────────────────────────────────────

function ProfilContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * Permet de savoir d'où vient l'utilisateur.
   *
   * Exemples :
   * /profil/123?from=explorer
   * /profil/123?from=matches
   * /profil/123?from=connexions
   * /profil/123?from=messages
   */
  const from = searchParams.get("from");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * ID du profil signalé.
   * Si reportId contient une valeur, on ouvre la modale.
   */
  const [reportId, setReportId] = useState<string | null>(null);

  /**
   * Retour intelligent selon la source.
   */
  const handleBack = () => {
    if (from === "connexions") {
      router.push("/mon-compte?tab=connexions");
      return;
    }

    if (from === "explorer") {
      router.push("/explorer");
      return;
    }

    if (from === "matches") {
      router.push("/matches");
      return;
    }

    if (from === "messages") {
      router.back();
      return;
    }

    router.back();
  };

  /**
   * Chargement du profil public.
   */
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError("");

    fetch(`/api/profiles/${id}`, {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          return;
        }

        setError(data.error || "Profil introuvable.");
      })
      .catch(() => {
        setError("Impossible de charger le profil.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  /**
   * Action du bouton "Liker ce profil".
   *
   * Pour l'instant, je garde ta logique :
   * retour à la page précédente.
   *
   * Plus tard, si tu veux, on pourra le connecter directement à /api/likes.
   */
  const handleLikeFromProfile = () => {
    router.back();
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
      <Header />

      <main className="flex-1 px-3 pb-12 pt-20 sm:px-4 sm:pb-16 sm:pt-24">
        <div className="mx-auto max-w-2xl">
          {/* Bouton retour + signaler */}
          <div className="mb-5 flex items-center justify-between gap-3 sm:mb-6">
            <button
              onClick={handleBack}
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Retour
            </button>

            {profile && (
              <button
                onClick={() => setReportId(profile._id)}
                className="flex items-center gap-1.5 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/20"
              >
                <Flag className="h-3.5 w-3.5" />
                Signaler
              </button>
            )}
          </div>

          {/* Chargement */}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-purple-300" />

              <p className="text-sm text-white/50">
                Chargement du profil...
              </p>
            </div>
          )}

          {/* Erreur */}
          {!loading && error && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-red-400/20 bg-red-500/10 px-6 py-16 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
                <AlertCircle className="h-8 w-8 text-red-300" />
              </div>

              <div>
                <h1 className="mb-2 text-xl font-bold text-white">
                  Profil indisponible
                </h1>

                <p className="mx-auto max-w-sm text-sm text-white/50">
                  {error}
                </p>
              </div>

              <button
                onClick={handleBack}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Revenir en arrière
              </button>
            </motion.div>
          )}

          {/* Profil */}
          <AnimatePresence>
            {!loading && profile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="space-y-5 sm:space-y-6"
              >
                {/* Header profil */}
                <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-900/40 to-pink-900/20">
                  {/* Bandeau décoratif */}
                  <div className="h-24 bg-gradient-to-r from-purple-600/40 via-pink-500/30 to-purple-800/40 sm:h-28" />

                  <div className="-mt-14 flex flex-col items-center gap-4 px-5 pb-6 text-center sm:flex-row sm:items-end sm:gap-6 sm:px-8 sm:pb-8 sm:text-left">
                    {/* Avatar */}
                    <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[#1a0b2e] bg-gradient-to-br from-purple-500 to-pink-500 text-5xl font-bold shadow-xl shadow-purple-950/30">
                      {profile.image ? (
                        <img
                          src={profile.image}
                          alt={profile.pseudonyme}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        profile.pseudonyme.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Infos principales */}
                    <div className="min-w-0 flex-1 pb-1">
                      <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <h1 className="max-w-full truncate text-2xl font-bold sm:text-3xl">
                          {profile.pseudonyme}
                        </h1>

                        {profile.identityVerified && (
                          <span className="flex items-center gap-1 rounded-full border border-green-400/20 bg-green-500/20 px-2 py-0.5 text-xs text-green-300">
                            <CheckCircle2 className="h-3 w-3" />
                            Vérifiée
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/50 sm:justify-start">
                        {profile.age && <span>{profile.age} ans</span>}

                        {profile.localisation && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {profile.localisation}
                          </span>
                        )}

                        {profile.orientation && (
                          <span>
                            {orientationLabels[profile.orientation] ||
                              profile.orientation}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Bio */}
                {profile.bio && (
                  <ProfileSection title="À propos" icon="✨">
                    <p className="leading-relaxed text-white/80">
                      {profile.bio}
                    </p>
                  </ProfileSection>
                )}

                {/* Intentions */}
                {profile.intentions?.length > 0 && (
                  <ProfileSection title="Recherche" icon="💞">
                    <div className="flex flex-wrap gap-2">
                      {profile.intentions.map((intention) => (
                        <span
                          key={intention}
                          className="rounded-full border border-pink-400/20 bg-pink-500/15 px-3 py-1.5 text-sm text-pink-200"
                        >
                          {intentionLabels[intention] || intention}
                        </span>
                      ))}
                    </div>
                  </ProfileSection>
                )}

                {/* Intérêts */}
                {profile.interets?.length > 0 && (
                  <ProfileSection title="Centres d'intérêt" icon="🌙">
                    <div className="flex flex-wrap gap-2">
                      {profile.interets.map((interet) => (
                        <span
                          key={interet}
                          className="rounded-full border border-purple-400/20 bg-purple-500/15 px-3 py-1.5 text-sm text-purple-200"
                        >
                          {interet}
                        </span>
                      ))}
                    </div>
                  </ProfileSection>
                )}

                {/* Si profil très vide */}
                {!profile.bio &&
                  (!profile.intentions || profile.intentions.length === 0) &&
                  (!profile.interets || profile.interets.length === 0) && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/15">
                        <User className="h-7 w-7 text-purple-300" />
                      </div>

                      <p className="font-semibold text-white">
                        Profil encore discret
                      </p>

                      <p className="mt-1 text-sm text-white/50">
                        Cette personne n'a pas encore complété tous les détails
                        de son profil.
                      </p>
                    </div>
                  )}

                {/* CTA like */}
                <div className="flex flex-col gap-4 rounded-2xl border border-purple-400/20 bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <p className="font-semibold text-white">
                      Ce profil vous intéresse ?
                    </p>

                    <p className="mt-1 text-sm text-white/60">
                      Revenez à l'exploration pour liker et continuer vos
                      découvertes.
                    </p>
                  </div>

                  <button
                    onClick={handleLikeFromProfile}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
                  >
                    <Heart className="h-4 w-4" />
                    Liker ce profil
                  </button>
                </div>

                {/* Petit rappel */}
                <div className="flex items-center justify-center gap-2 text-center text-xs text-white/35">
                  <Sparkles className="h-4 w-4 text-purple-300/70" />
                  Les profils vérifiés aident à renforcer la confiance sur
                  SferaLuna.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />

      {/* 
        Modale signalement.
        
        Correction TypeScript :
        ReportModal exige isOpen.
      */}
      <ReportModal
        isOpen={!!reportId}
        targetId={reportId ?? ""}
        targetType="user"
        onClose={() => setReportId(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Petit composant de section réutilisable
// ─────────────────────────────────────────────

function ProfileSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-white/40">
        <span>{icon}</span>
        {title}
      </h2>

      {children}
    </section>
  );
}

// ─────────────────────────────────────────────
// Export avec Suspense
// ─────────────────────────────────────────────

export default function ProfilPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#1a0b2e] text-white">
          <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
        </div>
      }
    >
      <ProfilContent />
    </Suspense>
  );
}
