import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "VibePlanner — Idées de rendez-vous | SferaLuna",
  "Trouvez l'idée de rendez-vous parfaite avec VibePlanner : café, balade, culture, bien-être… et proposez-la à votre match.",
  "/vibeplanner"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
