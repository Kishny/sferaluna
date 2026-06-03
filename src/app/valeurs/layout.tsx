import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Nos valeurs — Sécurité, authenticité & bienveillance | SferaLuna",
  "SferaLuna est fondée sur trois piliers : la sécurité de chaque membre, l'authenticité des profils et la bienveillance de la communauté.",
  "/valeurs"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
