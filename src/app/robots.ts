// src/app/robots.ts

import type { MetadataRoute } from "next";

/**
 * Robots.txt officiel SferaLuna.
 *
 * Objectif :
 * - autoriser l'indexation des pages publiques marketing ;
 * - bloquer les routes privées, sensibles ou inutiles au SEO ;
 * - déclarer le sitemap proprement.
 */

export default function robots(): MetadataRoute.Robots {
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sferaluna.fr";

  /**
   * Évite les doubles slashs si NEXT_PUBLIC_APP_URL finit par "/".
   */
  const baseUrl = rawBaseUrl.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",

        /**
         * On autorise le crawl global du site public.
         */
        allow: "/",

        /**
         * On bloque les zones qui ne doivent pas être indexées :
         * - API
         * - admin
         * - compte utilisateur
         * - paiement
         * - pages app connectées
         * - conversations / matches
         * - callbacks OAuth / auth si besoin
         */
        disallow: [
          "/api/",
          "/admin/",
          "/mon-compte",
          "/paiement",
          "/checkout",
          "/success",
          "/cancel",
          "/explorer",
          "/matches",
          "/messages",
          "/profil/",
          "/auth",
          "/auth/",
        ],
      },
    ],

    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
