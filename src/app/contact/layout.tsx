import { buildMeta } from "@/app/layout-meta";
export const metadata = buildMeta(
  "Contact SferaLuna — Nous écrire",
  "Une question, un signalement ou une suggestion ? Contactez l'équipe SferaLuna, nous répondons sous 48h.",
  "/contact"
);
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
