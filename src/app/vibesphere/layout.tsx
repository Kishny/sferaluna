import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "VibeSphere — Partagez vos humeurs | SferaLuna",
  "Exprimez-vous sur VibeSphere : partagez vos moods, découvrez ceux des autres membres et créez des connexions authentiques.",
  "/vibesphere"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
