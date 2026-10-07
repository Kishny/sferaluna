import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Guide SferaLuna — Comment bien commencer",
  "Notre guide complet pour créer votre profil, rejoindre la communauté et nouer des liens authentiques sur SferaLuna.",
  "/guide"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
