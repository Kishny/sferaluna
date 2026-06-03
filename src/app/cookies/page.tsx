// src/app/cookies/page.tsx

import Link from "next/link";
import { Moon } from "lucide-react";

export const metadata = { title: "Politique des cookies — SferaLuna" };

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff] pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8E7AB5]/10 border border-[#8E7AB5]/20 text-[#8E7AB5] text-sm font-medium mb-6">
            🍪 Politique des cookies
          </div>
          <h1 className="text-3xl font-bold text-[#1C1C1C] mb-3">Utilisation des cookies 🍪</h1>
          <p className="text-[#666]">Dernière mise à jour : juin 2025</p>
        </div>

        <div className="rounded-3xl border border-[#8E7AB5]/15 bg-white p-8 md:p-12 shadow-lg space-y-8 text-[#444] leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">Qu&apos;est-ce qu&apos;un cookie ?</h2>
            <p>Un cookie est un petit fichier texte stocké sur votre appareil lors de votre visite sur SferaLuna. Il nous permet de mémoriser certaines informations vous concernant pour améliorer votre expérience.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">Cookies utilisés</h2>
            <div className="space-y-4">
              {[
                { emoji: "🔐", name: "Cookies d'authentification", desc: "Gèrent votre session de connexion (NextAuth). Indispensables au fonctionnement du site.", type: "Essentiels", duree: "Session" },
                { emoji: "⚙️", name: "Cookies de préférences", desc: "Mémorisent vos paramètres (langue, préférences d'affichage).", type: "Fonctionnels", duree: "1 an" },
                { emoji: "📊", name: "Cookies analytiques", desc: "Nous aident à comprendre comment vous utilisez SferaLuna (pages visitées, temps passé). Ces données sont anonymisées.", type: "Analytiques", duree: "6 mois" },
              ].map((c) => (
                <div key={c.name} className="rounded-xl border border-[#E8E0FF] bg-[#FDFCFF] p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{c.emoji}</span>
                    <span className="font-semibold text-[#5B4B8A]">{c.name}</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#8E7AB5]/10 text-[#8E7AB5]">{c.type}</span>
                  </div>
                  <p className="text-sm text-[#666]">{c.desc}</p>
                  <p className="text-xs text-[#999] mt-1">Durée : {c.duree}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">Gestion des cookies</h2>
            <p>Vous pouvez configurer votre navigateur pour refuser les cookies ou être alerté de leur dépôt. Cependant, certaines fonctionnalités de SferaLuna (notamment la connexion) nécessitent des cookies essentiels pour fonctionner correctement.</p>
            <p className="mt-3">Instructions pour les principaux navigateurs :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
              <li>Chrome : Paramètres → Confidentialité et sécurité → Cookies</li>
              <li>Firefox : Options → Vie privée et sécurité</li>
              <li>Safari : Préférences → Confidentialité</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">Contact</h2>
            <p>Pour toute question : <a href="mailto:privacy@sferaluna.com" className="text-[#8E7AB5] hover:underline">privacy@sferaluna.com</a></p>
          </section>
        </div>

        <div className="text-center mt-8 flex items-center justify-center gap-6 text-sm text-[#999]">
          <Link href="/confidentialite" className="hover:text-[#8E7AB5] transition">Confidentialité</Link>
          <span>·</span>
          <Link href="/conditions" className="hover:text-[#8E7AB5] transition">CGU</Link>
          <span>·</span>
          <Link href="/" className="hover:text-[#8E7AB5] transition flex items-center gap-1">
            <Moon size={13} /> Accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
