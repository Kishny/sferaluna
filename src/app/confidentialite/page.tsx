// src/app/confidentialite/page.tsx

/**
 * Politique de confidentialité.
 *
 * Le contenu décrit les traitements réellement effectués par le site
 * (inscription, profil, messagerie, vérifications d'identité et de photos,
 * paiement, e-mails). À faire relire avant toute modification de fond.
 */

import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { Container, SiteShell } from "@/components/site/sections";
import MobileFold from "@/components/site/MobileFold";

export const metadata = {
  title: "Politique de confidentialité",
  description: "Quelles données SferaLuna collecte, pourquoi, avec quels prestataires, et comment exercer vos droits.",
};

const UPDATED = "2 octobre 2026";
const CONTACT = "contact@sferaluna.com";

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="scroll-mt-28" id={`section-${n}`}>
      <h2 className="text-xl font-bold text-white">
        <span className="mr-2 text-fuchsia-300">{n}.</span>
        {title}
      </h2>
      <MobileFold className="mt-3 space-y-3 text-[15px] leading-relaxed text-white/75" label="Lire cette section" hideLabel="Replier" defaultOpen={n === 1} buttonClassName="!mt-1">
        {children}
      </MobileFold>
    </section>
  );
}

const List = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="list-disc space-y-1.5 pl-5 marker:text-fuchsia-300">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

const B = ({ children }: { children: React.ReactNode }) => <strong className="font-semibold text-white">{children}</strong>;

export default function ConfidentialitePage() {
  return (
    <SiteShell back>
      <section className="relative pb-16">
        <Container className="max-w-4xl">
          <header className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/50 bg-fuchsia-500/10 px-4 py-1.5 text-sm font-semibold text-fuchsia-100">
              <ShieldCheck className="h-4 w-4" /> Politique de confidentialité
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Vos données, notre responsabilité</h1>
            <p className="mt-3 text-sm text-white/60">Dernière mise à jour : {UPDATED}</p>
          </header>

          <div className="mt-8 space-y-6 rounded-3xl sm:space-y-9 border border-violet-300/[0.16] bg-[#1b0d38]/80 p-6 backdrop-blur-xl sm:p-10">
            <Section n={1} title="Les données que nous collectons">
              <List
                items={[
                  <><B>Compte :</B> adresse e-mail, mot de passe (stocké chiffré, jamais lisible), ou identifiant Google si vous vous connectez avec Google.</>,
                  <><B>Profil :</B> pseudonyme, âge, ville et département, orientation, intentions, centres d’intérêt, valeurs, langues, profession, bio, photos et vidéos.</>,
                  <><B>Activité :</B> likes, matchs, visites de profils, messages échangés, publications VibeSphere, VibeMentor et Communauté, propositions VibePlanner, inscriptions aux événements.</>,
                  <><B>Journal émotionnel :</B> vos humeurs et notes. Elles sont privées et ne sont visibles par aucune autre membre.</>,
                  <><B>Abonnement :</B> l’offre choisie et l’état de l’abonnement. Vos coordonnées bancaires sont saisies chez Stripe : SferaLuna ne les reçoit jamais.</>,
                  <><B>Sécurité :</B> signalements, blocages et date de dernière connexion.</>,
                ]}
              />
            </Section>

            <Section n={2} title="Vérification d’identité et des photos">
              <p>
                <B>Identité.</B> La vérification d’identité est réalisée par Stripe Identity : votre pièce d’identité et votre selfie sont transmis à Stripe et traités par Stripe.
                SferaLuna ne conserve que le résultat (vérifiée ou non).
              </p>
              <p>
                <B>Photos.</B> Si vous choisissez de vérifier vos photos, un selfie pris en direct est analysé puis comparé à vos photos et vidéos de profil par Amazon Rekognition
                (Amazon Web Services, région Irlande). Il s’agit d’un traitement de <B>données biométriques</B>, effectué uniquement avec votre <B>consentement explicite</B>, donné avant le selfie.
              </p>
              <List
                items={[
                  "Le selfie de référence est conservé chiffré et n’est jamais affiché, ni à vous, ni aux autres membres.",
                  <>Vous pouvez retirer votre consentement et supprimer ce selfie à tout moment depuis la page <Link href="/verification-photo" className="text-pink-300 hover:underline">Vérification des photos</Link>. Le badge « Photo vérifiée » est alors retiré.</>,
                  "Il est supprimé automatiquement si vous supprimez votre compte.",
                ]}
              />
            </Section>

            <Section n={3} title="Pourquoi nous utilisons vos données">
              <List
                items={[
                  "Créer et gérer votre compte, afficher votre profil selon la visibilité que vous avez choisie.",
                  "Vous proposer des profils compatibles (intentions, centres d’intérêt, localisation).",
                  "Faire fonctionner la messagerie, les événements et les espaces communautaires.",
                  "Gérer votre abonnement et vous envoyer les e-mails liés au service (confirmation, mot de passe, paiement).",
                  "Protéger les membres : vérifications, filtre anti-harcèlement de la messagerie, traitement des signalements par l’équipe de modération.",
                ]}
              />
              <p>Nous ne vendons pas vos données et ne les utilisons pas pour de la publicité ciblée.</p>
            </Section>

            <Section n={4} title="Nos prestataires">
              <p>Vos données sont traitées par des prestataires techniques, uniquement pour faire fonctionner le service :</p>
              <List
                items={[
                  <><B>Vercel</B> : hébergement du site et mesure d’audience.</>,
                  <><B>MongoDB</B> : base de données.</>,
                  <><B>Cloudinary</B> : stockage des photos et vidéos.</>,
                  <><B>Stripe</B> : paiement et vérification d’identité.</>,
                  <><B>Amazon Web Services (Rekognition)</B> : vérification des photos par selfie.</>,
                  <><B>Resend</B> : envoi des e-mails.</>,
                  <><B>Pusher</B> : messagerie et notifications en temps réel.</>,
                  <><B>Google</B> : connexion avec un compte Google, si vous l’utilisez.</>,
                ]}
              />
              <p>Certains de ces prestataires sont établis aux États-Unis. Les transferts sont encadrés par les garanties prévues par le RGPD (clauses contractuelles types ou cadre de protection des données UE–États-Unis).</p>
            </Section>

            <Section n={5} title="Durée de conservation">
              <p>
                Vos données sont conservées tant que votre compte existe. Vous pouvez supprimer votre compte à tout moment depuis <B>Mon compte → Sécurité</B> : votre profil, vos photos et vidéos,
                vos matchs, les messages que vous avez envoyés, vos publications, votre journal et votre selfie de vérification sont alors effacés. Un abonnement en cours n’est pas renouvelé.
              </p>
              <p>
                Si c’est SferaLuna qui ferme un compte (non-respect des conditions, compte de test), ses données sont retirées du site immédiatement et conservées 60 jours, le temps de pouvoir
                rétablir le compte en cas d’erreur ou de contestation, puis effacées définitivement. Le selfie de vérification, lui, est effacé tout de suite.
              </p>
              <p>Les données de facturation sont conservées par Stripe pendant la durée imposée par la loi.</p>
            </Section>

            <Section n={6} title="Vos droits">
              <p>Conformément au RGPD, vous pouvez à tout moment :</p>
              <List
                items={[
                  "accéder à vos données et en obtenir une copie ;",
                  "les faire rectifier (la plupart se modifient directement dans Mon profil) ;",
                  "les faire effacer ;",
                  "vous opposer à un traitement ou en demander la limitation ;",
                  "retirer votre consentement, notamment pour la vérification des photos.",
                ]}
              />
              <p>
                Écrivez-nous à{" "}
                <a href={`mailto:${CONTACT}`} className="text-pink-300 hover:underline">
                  {CONTACT}
                </a>{" "}
                ou via la page <Link href="/contact" className="text-pink-300 hover:underline">Contact</Link>. Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL (cnil.fr).
              </p>
            </Section>

            <Section n={7} title="Sécurité">
              <p>
                Mots de passe chiffrés, connexions HTTPS, selfie de vérification chiffré, accès aux données limité à l’équipe de modération pour le traitement des signalements.
                Aucun système n’étant infaillible, signalez-nous sans attendre toute activité suspecte sur votre compte.
              </p>
            </Section>

            <Section n={8} title="Cookies">
              <p>
                Le site utilise des cookies nécessaires à la connexion. La mesure d’audience (Vercel Analytics) fonctionne sans cookie et sans vous identifier. Le détail et vos choix sont sur la page{" "}
                <Link href="/cookies" className="text-pink-300 hover:underline">Cookies</Link>.
              </p>
            </Section>
          </div>

          <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/60">
            <Link href="/conditions" className="hover:text-white">Conditions d’utilisation</Link>
            <span aria-hidden>·</span>
            <Link href="/cookies" className="hover:text-white">Cookies</Link>
            <span aria-hidden>·</span>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </nav>
        </Container>
      </section>
    </SiteShell>
  );
}
