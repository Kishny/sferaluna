import { buildMeta } from "@/app/layout-meta";

export const metadata = buildMeta(
  "La connaissance du jour — SferaLuna",
  "Chaque jour, une connaissance à découvrir : un mot rare, une femme pionnière, un fait sur le monde ou sur l’amour.",
  "/connaissance"
);

export default function ConnaissanceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
