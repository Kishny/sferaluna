// src/app/conditions/page.tsx

import Link from "next/link";
import { FileText, Moon } from "lucide-react";

export const metadata = { title: "Conditions d'utilisation — SferaLuna" };

export default function ConditionsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff] pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8E7AB5]/10 border border-[#8E7AB5]/20 text-[#8E7AB5] text-sm font-medium mb-6">
            <FileText size={15} /> Conditions d&apos;utilisation
          </div>
          <h1 className="text-3xl font-bold text-[#1C1C1C] mb-3">CGU — SferaLuna 📋</h1>
          <p className="text-[#666]">Dernière mise à jour : juin 2025</p>
        </div>

        <div className="rounded-3xl border border-[#8E7AB5]/15 bg-white p-8 md:p-12 shadow-lg space-y-8 text-[#444] leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">1. Objet</h2>
            <p>Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;utilisation de la plateforme SferaLuna, accessible à l&apos;adresse sferaluna.com. En créant un compte, vous acceptez pleinement et sans réserve les présentes CGU.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">2. Accès au service</h2>
            <p>SferaLuna est une plateforme de rencontre destinée aux femmes âgées de 18 ans et plus. L&apos;inscription est réservée aux personnes majeures. Toute inscription implique de fournir des informations exactes et à jour. SferaLuna se réserve le droit de suspendre ou supprimer tout compte contenant de fausses informations.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">3. Comportement attendu</h2>
            <p>Les utilisateurs s&apos;engagent à :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Respecter les autres membres en toutes circonstances</li>
              <li>Ne pas publier de contenu offensant, illégal ou trompeur</li>
              <li>Ne pas harceler ou intimider d&apos;autres utilisateurs</li>
              <li>Ne pas utiliser la plateforme à des fins commerciales sans accord</li>
              <li>Signaler tout comportement inapproprié via les outils prévus</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">4. Abonnements et paiements</h2>
            <p>SferaLuna propose des abonnements payants (Essentiel, Premium, Elite) gérés via Stripe. Les abonnements sont renouvelés automatiquement chaque mois. Vous pouvez annuler à tout moment depuis votre espace « Mon compte ». Aucun remboursement n&apos;est effectué pour les périodes entamées, sauf obligation légale.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">5. Propriété intellectuelle</h2>
            <p>L&apos;ensemble des contenus de SferaLuna (logo, design, textes, code) est protégé par le droit de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">6. Résiliation</h2>
            <p>Vous pouvez supprimer votre compte à tout moment depuis votre espace personnel. SferaLuna peut également résilier un compte en cas de non-respect des présentes CGU, sans préavis.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">7. Limitation de responsabilité</h2>
            <p>SferaLuna ne peut être tenu responsable des interactions entre utilisateurs. La plateforme met en œuvre des moyens raisonnables pour assurer la sécurité des échanges, mais ne peut garantir l&apos;absence totale de comportements malveillants.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">8. Droit applicable</h2>
            <p>Les présentes CGU sont soumises au droit français. En cas de litige, les parties s&apos;engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, le tribunal compétent sera celui du ressort du siège social de SferaLuna.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">9. Contact</h2>
            <p>Pour toute question relative aux présentes CGU : <a href="mailto:legal@sferaluna.com" className="text-[#8E7AB5] hover:underline">legal@sferaluna.com</a></p>
          </section>
        </div>

        <div className="text-center mt-8 flex items-center justify-center gap-6 text-sm text-[#999]">
          <Link href="/confidentialite" className="hover:text-[#8E7AB5] transition">Confidentialité</Link>
          <span>·</span>
          <Link href="/cookies" className="hover:text-[#8E7AB5] transition">Cookies</Link>
          <span>·</span>
          <Link href="/" className="hover:text-[#8E7AB5] transition flex items-center gap-1">
            <Moon size={13} /> Accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
