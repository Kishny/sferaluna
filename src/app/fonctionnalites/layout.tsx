import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Fonctionnalités SferaLuna — Découverte, Matchs & Messagerie",
  "Explorez toutes les fonctionnalités de SferaLuna : explorer des profils, liker, matcher, envoyer des messages et bien plus encore.",
  "/fonctionnalites"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
