// src/app/auth/reset-password/page.tsx
"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Moon, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Demande de reset (envoi email)
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur serveur."); return; }
      setSent(true);
    } catch {
      setError("Erreur de connexion. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  // Nouveau mot de passe (avec token)
  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }
    if (password.length < 8) { setError("Au moins 8 caractères requis."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Lien invalide ou expiré."); return; }
      setSuccess(true);
      setTimeout(() => router.push("/auth"), 2500);
    } catch {
      setError("Erreur de connexion. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff] flex items-center justify-center px-4 pt-16 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-6">
            <Moon className="h-7 w-7 text-[#8E7AB5]" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[#5B4B8A] to-[#8E7AB5] bg-clip-text text-transparent">SferaLuna</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1C1C1C] mb-2">
            {token ? "Nouveau mot de passe" : "Mot de passe oublié"}
          </h1>
          <p className="text-[#666] text-sm">
            {token ? "Choisis un nouveau mot de passe pour ton compte." : "Saisis ton email pour recevoir un lien de réinitialisation."}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-[#f0ecff] p-8">

          {/* Email envoyé */}
          {sent && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="font-semibold text-[#1C1C1C] mb-2">Email envoyé !</p>
              <p className="text-sm text-[#666]">Si un compte existe pour <strong>{email}</strong>, tu recevras un lien sous peu. Vérifie aussi tes spams.</p>
              <Link href="/auth" className="mt-6 inline-block text-[#8E7AB5] text-sm font-medium hover:underline">← Retour à la connexion</Link>
            </div>
          )}

          {/* Mot de passe changé */}
          {success && (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="font-semibold text-[#1C1C1C] mb-2">Mot de passe mis à jour !</p>
              <p className="text-sm text-[#666]">Redirection vers la connexion…</p>
            </div>
          )}

          {/* Formulaire demande de reset */}
          {!sent && !token && !success && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 rounded-xl p-3 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-[#666] block mb-1.5">Adresse email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-[#e8e0ff] focus:outline-none focus:ring-2 focus:ring-[#8E7AB5] text-[#1C1C1C] text-sm" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#5B4B8A] to-[#8E7AB5] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
                {loading ? "Envoi en cours…" : "Envoyer le lien"}
              </button>
              <p className="text-center text-sm text-[#666]">
                <Link href="/auth" className="text-[#8E7AB5] font-medium hover:underline">← Retour à la connexion</Link>
              </p>
            </form>
          )}

          {/* Formulaire nouveau mot de passe */}
          {token && !success && (
            <form onSubmit={handleNewPassword} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 rounded-xl p-3 text-sm">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-[#666] block mb-1.5">Nouveau mot de passe</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Au moins 8 caractères"
                    className="w-full px-4 py-3 rounded-xl border border-[#e8e0ff] focus:outline-none focus:ring-2 focus:ring-[#8E7AB5] text-[#1C1C1C] text-sm pr-12" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999]">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-[#666] block mb-1.5">Confirmer le mot de passe</label>
                <input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Répète ton mot de passe"
                  className="w-full px-4 py-3 rounded-xl border border-[#e8e0ff] focus:outline-none focus:ring-2 focus:ring-[#8E7AB5] text-[#1C1C1C] text-sm" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#5B4B8A] to-[#8E7AB5] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
                {loading ? "Mise à jour…" : "Changer mon mot de passe"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </main>
  );
}
