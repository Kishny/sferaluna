import { buildMeta } from "../layout-meta";

export const metadata = buildMeta(
  "Sécurité — Des rencontres sereines entre femmes",
  "Vérification d'identité, Mode Fantôme, modération active, signalement et blocage : découvrez comment SferaLuna protège ses membres.",
  "/securite"
);

export default function SecuriteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
