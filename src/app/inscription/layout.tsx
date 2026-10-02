import fs from "fs";
import path from "path";
import type { CSSProperties } from "react";

import { buildMeta } from "@/app/layout-meta";

export const metadata = buildMeta(
  "Création du profil — SferaLuna",
  "Complétez votre profil SferaLuna : informations de base, intentions, localisation, centres d’intérêt et vérification d’identité.",
  "/inscription"
);

/**
 * Image de fond du parcours de création du profil.
 *
 * Déposez l'illustration dans public/images sous l'un de ces noms : elle est
 * détectée au build et affichée en plein écran. Sans fichier, le décor
 * spatial vectoriel de la page sert de fond.
 */
const CANDIDATES = ["inscription-bg.webp", "inscription-bg.jpg", "inscription-bg.jpeg", "inscription-bg.png"];

function background() {
  const found = CANDIDATES.find((file) => fs.existsSync(path.join(process.cwd(), "public", "images", file)));
  return found ? `url(/images/${found})` : "none";
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div style={{ "--inscription-bg": background() } as CSSProperties}>{children}</div>;
}
