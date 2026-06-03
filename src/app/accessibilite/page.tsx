// src/app/accessibilite/page.tsx

import Link from "next/link";
import { Moon, Heart } from "lucide-react";

export const metadata = { title: "Accessibilité — SferaLuna" };

export default function AccessibilitePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff] pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8E7AB5]/10 border border-[#8E7AB5]/20 text-[#8E7AB5] text-sm font-medium mb-6">
            ♿ Accessibilité
          </div>
          <h1 className="text-3xl font-bold text-[#1C1C1C] mb-3">Engagement accessibilité ♿</h1>
          <p className="text-[#666]">SferaLuna s&apos;engage à rendre sa plateforme accessible à toutes.</p>
        </div>

        <div className="rounded-3xl border border-[#8E7AB5]/15 bg-white p-8 md:p-12 shadow-lg space-y-8 text-[#444] leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">Notre engagement</h2>
            <p>SferaLuna s&apos;engage à rendre son service numérique accessible conformément à la loi française n° 2005-102 pour l&apos;égalité des droits et des chances. Nous visons la conformité avec les Règles pour l&apos;Accessibilité des Contenus Web (WCAG) 2.1, niveau AA.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">Mesures prises</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Contrastes de couleurs conformes aux recommandations WCAG 2.1</li>
              <li>Navigation au clavier sur l&apos;ensemble des interfaces</li>
              <li>Textes alternatifs sur toutes les images significatives</li>
              <li>Structure de pages sémantique (titres hiérarchiques, landmarks ARIA)</li>
              <li>Formulaires labellisés et messages d&apos;erreur explicites</li>
              <li>Compatibilité avec les lecteurs d&apos;écran (VoiceOver, NVDA)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">Limitations connues</h2>
            <p>Certaines fonctionnalités en cours de développement peuvent présenter des limitations d&apos;accessibilité. Nous travaillons à les améliorer en continu. Si vous rencontrez une difficulté, signalez-la nous.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">Signaler un problème</h2>
            <p>Si vous rencontrez un obstacle d&apos;accessibilité sur SferaLuna, veuillez nous contacter :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Email : <a href="mailto:accessibilite@sferaluna.com" className="text-[#8E7AB5] hover:underline">accessibilite@sferaluna.com</a></li>
              <li>Via notre <Link href="/contact" className="text-[#8E7AB5] hover:underline">formulaire de contact</Link></li>
            </ul>
            <p className="mt-3">Nous nous engageons à vous répondre dans un délai de 5 jours ouvrables.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">Voies de recours</h2>
            <p>Si vous n&apos;obtenez pas de réponse satisfaisante, vous pouvez contacter le Défenseur des droits (defenseurdesdroits.fr).</p>
          </section>
        </div>

        <div className="text-center mt-8 flex items-center justify-center gap-6 text-sm text-[#999]">
          <Link href="/confidentialite" className="hover:text-[#8E7AB5] transition">Confidentialité</Link>
          <span>·</span>
          <Link href="/conditions" className="hover:text-[#8E7AB5] transition">CGU</Link>
          <span>·</span>
          <Link href="/contact" className="hover:text-[#8E7AB5] transition">Contact</Link>
          <span>·</span>
          <Link href="/" className="hover:text-[#8E7AB5] transition flex items-center gap-1">
            <Moon size={13} /> Accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
