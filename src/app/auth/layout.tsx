import fs from "fs";
import path from "path";
import type { CSSProperties } from "react";

import { buildMeta } from "@/app/layout-meta";

export const metadata = buildMeta(
  "Connexion & Inscription — SferaLuna",
  "Connectez-vous ou créez votre compte SferaLuna. Rejoignez le réseau social premium pensé pour les femmes.",
  "/auth"
);

/**
 * Image de fond des pages de connexion / inscription.
 *
 * Déposez l'illustration dans public/images sous l'un de ces noms : elle est
 * détectée au build et affichée en plein écran. Sans fichier, la scène
 * lunaire vectorielle (MoonHorizon) sert de fond.
 */
const CANDIDATES = ["auth-bg.webp", "auth-bg.jpg", "auth-bg.jpeg", "auth-bg.png"];

function authBackground() {
  const found = CANDIDATES.find((file) => fs.existsSync(path.join(process.cwd(), "public", "images", file)));
  return found ? `url(/images/${found})` : "none";
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div style={{ "--auth-bg": authBackground() } as CSSProperties}>{children}</div>;
}
