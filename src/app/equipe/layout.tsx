import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "L'équipe SferaLuna — Celles qui font la différence",
  "Découvrez l'équipe derrière SferaLuna, passionnée par la création d'un espace de rencontres sûr, authentique et bienveillant pour les femmes.",
  "/equipe"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
