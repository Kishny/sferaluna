"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Flag, MapPin, Heart, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReportModal from "@/components/ReportModal";

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

const orientationLabels: Record<string, string> = {
  hetero: "Hétérosexuelle",
  homo: "Lesbienne / Homosexuelle",
  bi: "Bisexuelle",
  pan: "Pansexuelle",
  curieuse: "Curieuse — souhaite découvrir",
  other: "Autre",
};

export default function ProfilPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/profiles/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) setProfile(data.profile);
        else setError(data.error || "Profil introuvable.");
      })
      .catch(() => setError("Impossible de charger le profil."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-[#1a0b2e] text-white flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Bouton retour + signaler */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 text-white/50 hover:text-white transition text-sm"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Retour
            </button>
            {profile && (
              <button
                onClick={() => setReportId(profile._id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-400/20 text-red-300 text-xs hover:bg-red-500/20 transition"
              >
                <Flag className="h-3.5 w-3.5" /> Signaler
              </button>
            )}
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-center py-20 text-white/50">{error}</div>
          )}

          {profile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header profil */}
              <div className="rounded-3xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-white/10 p-8 flex flex-col sm:flex-row items-center gap-6">
                <div className="h-28 w-28 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-5xl font-bold flex-shrink-0 overflow-hidden border-4 border-purple-400/30">
                  {profile.image
                    ? <img src={profile.image} alt={profile.pseudonyme} className="h-full w-full object-cover" />
                    : profile.pseudonyme.charAt(0).toUpperCase()
                  }
                </div>

                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                    <h1 className="text-2xl font-bold">{profile.pseudonyme}</h1>
                    {profile.identityVerified && (
                      <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-300 border border-green-400/20 rounded-full px-2 py-0.5">
                        <CheckCircle2 className="h-3 w-3" /> Vérifiée
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-white/50 text-sm justify-center sm:justify-start flex-wrap">
                    {profile.age && <span>{profile.age} ans</span>}
                    {profile.localisation && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {profile.localisation}
                      </span>
                    )}
                    {profile.orientation && (
                      <span>{orientationLabels[profile.orientation] || profile.orientation}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-sm font-semibold text-white/40 mb-2 uppercase tracking-wide">À propos</h2>
                  <p className="text-white/80 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Intentions */}
              {profile.intentions?.length > 0 && (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-sm font-semibold text-white/40 mb-3 uppercase tracking-wide">Recherche</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.intentions.map((i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-pink-500/15 border border-pink-400/20 text-pink-200 text-sm">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Intérêts */}
              {profile.interets?.length > 0 && (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                  <h2 className="text-sm font-semibold text-white/40 mb-3 uppercase tracking-wide">Centres d&apos;intérêt</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.interets.map((i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-400/20 text-purple-200 text-sm">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA like */}
              <div className="rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-400/20 p-6 flex items-center justify-between">
                <p className="text-white/70 text-sm">Ce profil vous intéresse ?</p>
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:opacity-90 transition"
                >
                  <Heart className="h-4 w-4" />
                  Liker ce profil
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />

      {reportId && (
        <ReportModal
          targetId={reportId}
          targetType="user"
          onClose={() => setReportId(null)}
        />
      )}
    </div>
  );
}
