// src/components/dashboard/fonts.ts

import { Cormorant_Garamond } from "next/font/google";

/** Serif italique pour la citation du hero (auto-hébergée par next/font). */
export const quoteFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic"],
  display: "swap",
});
