import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "VibeMentor — Conseils & Q&A communauté | SferaLuna",
  "Posez vos questions, partagez vos expériences et obtenez des conseils bienveillants de la communauté SferaLuna.",
  "/vibementor"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
