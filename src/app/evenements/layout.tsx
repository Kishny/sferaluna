import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Événements Luna — Rencontres & soirées | SferaLuna",
  "Participez aux événements SferaLuna : soirées, ateliers et rencontres en personne organisés pour les membres de la communauté.",
  "/evenements"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
