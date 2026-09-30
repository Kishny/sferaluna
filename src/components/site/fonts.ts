// src/components/site/fonts.ts

import { Caveat } from "next/font/google";

/**
 * Écriture manuscrite des petites notes de marque
 * (« Des rencontres qui font du bien, vraiment. ♡ »).
 * Auto-hébergée par next/font : aucun appel externe au runtime.
 */
export const scriptFont = Caveat({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});
