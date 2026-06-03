// src/app/confidentialite/page.tsx

import Link from "next/link";
import { Shield, Moon } from "lucide-react";

export const metadata = { title: "Politique de confidentialité — SferaLuna" };

export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff] pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8E7AB5]/10 border border-[#8E7AB5]/20 text-[#8E7AB5] text-sm font-medium mb-6">
            <Shield size={15} /> Politique de confidentialité
          </div>
          <h1 className="text-3xl font-bold text-[#1C1C1C] mb-3">Vos données, notre responsabilité 🔒</h1>
          <p className="text-[#666]">Dernière mise à jour : juin 2025</p>
        </div>

        <div className="rounded-3xl border border-[#8E7AB5]/15 bg-white p-8 md:p-12 shadow-lg space-y-8 text-[#444] leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">1. Données collectées</h2>
            <p>SferaLuna collecte les données que vous nous fournissez lors de votre inscription : adresse e-mail, pseudonyme, âge, localisation, centre d'intérêts et préférences relationnelles. Nous collectons également les données d'utilisation de la plateforme (connexions, interactions, matches) afin d'améliorer votre expérience.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">2. Utilisation des données</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Fournir et améliorer les services SferaLuna</li>
              <li>Vous suggérer des profils compatibles</li>
              <li>Gérer votre abonnement et les paiements via Stripe</li>
              <li>Envoyer des communications liées au service (jamais de spam)</li>
              <li>Assurer la sécurité de la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">3. Partage des données</h2>
            <p>Nous ne vendons jamais vos données personnelles. Elles peuvent être partagées avec nos prestataires de services techniques (hébergement, paiement Stripe, authentification Google) uniquement dans le cadre de la fourniture du service, et toujours dans le respect du RGPD.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">4. Conservation des données</h2>
            <p>Vos données sont conservées pendant toute la durée de votre compte actif, puis supprimées dans un délai de 30 jours après la fermeture du compte, sauf obligation légale contraire.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">5. Vos droits (RGPD)</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement (« droit à l'oubli »)</li>
              <li>Droit à la portabilité</li>
              <li>Droit d'opposition au traitement</li>
            </ul>
            <p className="mt-3">Pour exercer ces droits, contactez-nous à : <a href="mailto:privacy@sferaluna.com" className="text-[#8E7AB5] hover:underline">privacy@sferaluna.com</a></p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">6. Sécurité</h2>
            <p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement bcrypt des mots de passe, connexions HTTPS, authentification OAuth sécurisée et accès restreint aux données sensibles.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#5B4B8A] mb-3">7. Contact</h2>
            <p>Pour toute question relative à la protection de vos données, vous pouvez contacter notre délégué à la protection des données à l'adresse : <a href="mailto:privacy@sferaluna.com" className="text-[#8E7AB5] hover:underline">privacy@sferaluna.com</a></p>
          </section>
        </div>

        <div className="text-center mt-8 flex items-center justify-center gap-6 text-sm text-[#999]">
          <Link href="/conditions" className="hover:text-[#8E7AB5] transition">Conditions d'utilisation</Link>
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
