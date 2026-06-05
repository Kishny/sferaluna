// src/app/sitemap.ts

import type { MetadataRoute } from "next";

/**
 * Sitemap officiel SferaLuna.
 *
 * Ce fichier indique aux moteurs de recherche
 * quelles pages publiques doivent être explorées et indexées.
 *
 * Important :
 * On évite d'ajouter ici les pages privées comme :
 * - /mon-compte
 * - /matches
 * - /messages
 * - /admin
 * - /explorer si elle nécessite une connexion
 *
 * Le sitemap doit rester orienté SEO public.
 */

const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sferaluna.fr";

/**
 * Nettoie l'URL de base pour éviter :
 * https://sferaluna.fr//tarifs
 */
const baseUrl = rawBaseUrl.replace(/\/$/, "");

/**
 * Date stable pour la génération du sitemap.
 *
 * Tu peux garder new Date().
 * C'est accepté par Next.js.
 */
const now = new Date();

/**
 * Helper pour construire une URL propre.
 */
function pageUrl(path = "") {
  if (!path) return baseUrl;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Pages publiques importantes pour le référencement.
 */
const publicPages = [
  {
    path: "",
    changeFrequency: "weekly",
    priority: 1.0,
  },
  {
    path: "/commencer",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/tarifs",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/fonctionnalites",
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    path: "/valeurs",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/histoire",
    changeFrequency: "monthly",
    priority: 0.75,
  },
  {
    path: "/equipe",
    changeFrequency: "monthly",
    priority: 0.65,
  },
  {
    path: "/guide",
    changeFrequency: "monthly",
    priority: 0.75,
  },
  {
    path: "/faq",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/contact",
    changeFrequency: "yearly",
    priority: 0.6,
  },

  /**
   * Pages fonctionnalités publiques.
   * Garde-les ici seulement si elles sont accessibles sans connexion
   * ou si elles servent de landing pages publiques.
   */
  {
    path: "/circle",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/mode-fantome",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/vibeplanner",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/vibementor",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/vibesphere",
    changeFrequency: "monthly",
    priority: 0.65,
  },
  {
    path: "/evenements",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: "/communaute",
    changeFrequency: "weekly",
    priority: 0.65,
  },

  /**
   * Pages légales.
   */
  {
    path: "/confidentialite",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/conditions",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/cookies",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/accessibilite",
    changeFrequency: "yearly",
    priority: 0.3,
  },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map((page) => ({
    url: pageUrl(page.path),
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
