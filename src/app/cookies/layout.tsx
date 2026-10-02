import { buildMeta } from "@/app/layout-meta";

export const metadata = buildMeta(
  "Politique des cookies",
  "Quels cookies SferaLuna utilise, pourquoi, et comment gérer vos préférences.",
  "/cookies"
);

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
