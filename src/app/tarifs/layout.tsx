import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Tarifs SferaLuna — Offres Essentiel, Premium & Elite",
  "Découvrez les offres SferaLuna : Essentiel à 9,99€/mois, Premium à 19,99€/mois, Elite à 34,99€/mois. Sans engagement.",
  "/tarifs"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
