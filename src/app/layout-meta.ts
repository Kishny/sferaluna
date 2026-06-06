// src/app/layout-meta.ts

import type { Metadata } from "next";

/**
 * Helper SEO SferaLuna.
 *
 * Ce fichier permet de générer des métadonnées cohérentes
 * pour toutes les pages publiques du site :
 * - title
 * - description
 * - canonical
 * - Open Graph
 * - Twitter Card
 *
 * Exemple d'utilisation dans une page ou un layout :
 *
 * export const metadata = buildMeta(
 *   "Notre histoire — Comment SferaLuna est née",
 *   "Découvre l'histoire de SferaLuna, le site de rencontres premium pensé pour les femmes.",
 *   "/histoire"
 * );
 */

/**
 * URL publique du site.
 *
 * Important :
 * NEXT_PUBLIC_APP_URL doit idéalement être :
 * https://sferaluna.com
 *
 * Sans slash final.
 */
const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sferaluna.com";

/**
 * Nettoie l'URL de base pour éviter :
 * https://sferaluna.com//histoire
 */
const baseUrl = rawBaseUrl.replace(/\/$/, "");

/**
 * Image Open Graph par défaut.
 *
 * Elle doit exister dans :
 * public/og-image.png
 */
const defaultOgImage = "/og-image.png";

/**
 * Nom officiel du site.
 */
const siteName = "SferaLuna";

/**
 * Construit une URL absolue propre.
 *
 * Exemples :
 * buildAbsoluteUrl("") => https://sferaluna.com
 * buildAbsoluteUrl("/") => https://sferaluna.com
 * buildAbsoluteUrl("/histoire") => https://sferaluna.com/histoire
 * buildAbsoluteUrl("histoire") => https://sferaluna.com/histoire
 */
function buildAbsoluteUrl(path: string = "") {
  if (!path || path === "/") return baseUrl;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${cleanPath}`;
}

/**
 * Génère les métadonnées SEO d'une page.
 */
export function buildMeta(
  title: string,
  description: string,
  path: string = "",
  options?: {
    /**
     * Image Open Graph personnalisée.
     * Exemple : "/og-histoire.png"
     */
    image?: string;

    /**
     * Permet de désindexer une page si nécessaire.
     * Exemple : noIndex: true pour une page privée.
     */
    noIndex?: boolean;
  }
): Metadata {
  const url = buildAbsoluteUrl(path);
  const image = options?.image || defaultOgImage;

  return {
    title,
    description,

    alternates: {
      canonical: url,
    },

    robots: options?.noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },

    openGraph: {
      title,
      description,
      url,
      siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "fr_FR",
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
