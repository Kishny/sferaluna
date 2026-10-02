// src/app/mentions-legales/page.tsx

/**
 * Mentions légales (art. 6 III de la loi n° 2004-575 du 21 juin 2004, LCEN).
 * Les informations d'identification ci-dessous ont été fournies par l'éditeur.
 */

import Link from "next/link";
import { Building2, Mail, Scale, Server, UserRound, type LucideIcon } from "lucide-react";

import { Container, SiteShell } from "@/components/site/sections";

export const metadata = {
  title: "Mentions légales",
  description: "Éditeur, direction de la publication et hébergeur du site SferaLuna.",
};

const CONTACT = "contact@sferaluna.com";

function Block({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-violet-300/[0.16] bg-[#1b0d38]/80 p-6 backdrop-blur-xl sm:p-7">
      <h2 className="flex items-center gap-2.5 text-lg font-bold text-white">
        <Icon className="h-5 w-5 text-fuchsia-300" /> {title}
      </h2>
      <div className="mt-3 space-y-2 text-[15px] leading-relaxed text-white/75">{children}</div>
    </section>
  );
}

const B = ({ children }: { children: React.ReactNode }) => <strong className="font-semibold text-white">{children}</strong>;

export default function MentionsLegalesPage() {
  return (
    <SiteShell back>
      <section className="relative pb-16">
        <Container className="max-w-4xl">
          <header className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/50 bg-fuchsia-500/10 px-4 py-1.5 text-sm font-semibold text-fuchsia-100">
              <Scale className="h-4 w-4" /> Mentions légales
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Qui est derrière SferaLuna</h1>
          </header>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Block icon={Building2} title="Éditeur du site">
              <p>
                Le site <B>sferaluna.com</B> est édité par <B>Jean VOLCY, EI — Jeyko.dev</B> (micro-entreprise), en collaboration avec <B>Valene MOKILI</B>, à l’origine du projet.
              </p>
              <p>
                SIRET : <B>820 283 984 00038</B>
                <br />
                Siège : Rue Daniel Mayer, 37100 Tours, France
              </p>
            </Block>

            <Block icon={UserRound} title="Direction de la publication">
              <p>
                <B>Valene MOKILI</B> et <B>Jean VOLCY</B> (Jeyko.dev).
              </p>
            </Block>

            <Block icon={Mail} title="Contact">
              <p>
                E-mail :{" "}
                <a href={`mailto:${CONTACT}`} className="text-pink-300 hover:underline">
                  {CONTACT}
                </a>
              </p>
              <p>
                Ou via le <Link href="/contact" className="text-pink-300 hover:underline">formulaire de contact</Link>.
              </p>
            </Block>

            <Block icon={Server} title="Hébergeur">
              <p>
                <B>Vercel Inc.</B>
                <br />
                440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis
                <br />
                vercel.com
              </p>
            </Block>
          </div>

          <div className="mt-4 space-y-4">
            <Block icon={Scale} title="Propriété intellectuelle">
              <p>
                Le nom SferaLuna, le logo, les textes, les illustrations et le code du site sont protégés. Toute reproduction ou réutilisation sans autorisation écrite est interdite.
                Les photos, vidéos et textes publiés par les membres restent leur propriété.
              </p>
            </Block>

            <Block icon={Scale} title="Données personnelles et conditions">
              <p>
                Le traitement de vos données est décrit dans la <Link href="/confidentialite" className="text-pink-300 hover:underline">politique de confidentialité</Link>. L’utilisation du site est régie par les{" "}
                <Link href="/conditions" className="text-pink-300 hover:underline">conditions d’utilisation</Link>. Les cookies sont détaillés sur la page <Link href="/cookies" className="text-pink-300 hover:underline">Cookies</Link>.
              </p>
            </Block>
          </div>
        </Container>
      </section>
    </SiteShell>
  );
}
