import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Communauté Luna — Forum & échanges | SferaLuna",
  "Rejoignez la communauté SferaLuna : partagez, échangez et trouvez du soutien dans un espace sécurisé réservé aux femmes.",
  "/communaute"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
