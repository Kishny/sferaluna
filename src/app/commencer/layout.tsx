import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Commencer sur SferaLuna — Rejoignez la communauté",
  "Créez votre profil SferaLuna en quelques minutes et rencontrez des femmes qui vous correspondent vraiment.",
  "/commencer"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
