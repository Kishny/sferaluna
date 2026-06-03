import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Guide SferaLuna — Comment bien commencer",
  "Notre guide complet pour créer un profil attractif, trouver des matchs de qualité et vivre des rencontres authentiques sur SferaLuna.",
  "/guide"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
