import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Connexion & Inscription — SferaLuna",
  "Connectez-vous ou créez votre compte SferaLuna. Rejoignez une communauté premium de rencontres pour femmes.",
  "/auth"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
