// src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import ClientProvider from "./ClientProvider";
import JsonLd from "@/components/JsonLd";
import CookieConsent from "@/components/CookieConsent";
import ConsentAnalytics from "@/components/ConsentAnalytics";

/**
 * Police principale du site.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Police monospace utilisée si besoin.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * URL publique du site.
 *
 * En production, mets bien dans ton .env :
 * NEXT_PUBLIC_APP_URL=https://sferaluna.com
 */
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sferaluna.com";

/**
 * Métadonnées globales du site.
 *
 * Les pages peuvent ensuite surcharger ces données
 * avec le helper buildMeta dans src/app/layout-meta.ts.
 */
export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),

  title: {
    default: "SferaLuna — Le réseau social premium entre femmes",
    template: "%s | SferaLuna",
  },

  description:
    "SferaLuna est le réseau social premium pensé pour les femmes françaises : communauté, entraide, événements et affinités, dans un espace vérifié et bienveillant.",

  keywords: [
    "réseau social femmes",
    "communauté de femmes",
    "communauté lesbienne",
    "communauté WLW",
    "réseau social premium",
    "événements entre femmes",
    "SferaLuna",
    "entraide entre femmes",
    "communauté vérifiée",
  ],

  authors: [{ name: "SferaLuna", url: baseUrl }],
  creator: "SferaLuna",
  publisher: "SferaLuna",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: [{ url: "/logo-sferaluna.png", type: "image/png" }],
    apple: [{ url: "/logo-sferaluna.png" }],
  },

  manifest: "/site.webmanifest",

  openGraph: {
    title: "SferaLuna — Le réseau social premium entre femmes",
    description:
      "SferaLuna est le réseau social premium pensé pour les femmes françaises : communauté, entraide, événements et affinités, dans un espace vérifié et bienveillant.",
    url: baseUrl,
    siteName: "SferaLuna",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SferaLuna — Le réseau social premium entre femmes",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "SferaLuna — Le réseau social premium entre femmes",
    description:
      "Rejoignez SferaLuna, le réseau social premium pensé pour les femmes françaises.",
    images: ["/og-image.jpg"],
    creator: "@sferaluna",
  },

  alternates: {
    canonical: baseUrl,
    languages: {
      "fr-FR": baseUrl,
    },
  },

  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "",
  },

  category: "social networking",
};

/**
 * JSON-LD Organization.
 *
 * Sert à améliorer la compréhension du site par Google.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SferaLuna",
  url: baseUrl,
  logo: `${baseUrl}/logo-sferaluna.png`,
  description:
    "Réseau social premium pensé pour les femmes françaises : communauté, entraide, événements et affinités.",
  foundingDate: "2024",
  address: {
    "@type": "PostalAddress",
    addressCountry: "FR",
  },
  sameAs: [],
};

/**
 * JSON-LD WebSite.
 */
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SferaLuna",
  url: baseUrl,
  description: "Réseau social premium entre femmes — France",
  inLanguage: "fr-FR",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${baseUrl}/explorer?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

/**
 * Layout racine obligatoire de Next.js.
 *
 * Important :
 * - src/app/layout.tsx doit toujours exporter un composant React par défaut.
 * - C'est ici qu'on met <html>, <body>, providers globaux, fonts, etc.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClientProvider>{children}</ClientProvider>
        <CookieConsent />
        <ConsentAnalytics />
      </body>
    </html>
  );
}