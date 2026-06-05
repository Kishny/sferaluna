// src/app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import ClientProvider from "./ClientProvider";
import JsonLd from "@/components/JsonLd";

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
 * NEXT_PUBLIC_APP_URL=https://sferaluna.fr
 */
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sferaluna.fr";

/**
 * Métadonnées globales du site.
 *
 * Les pages peuvent ensuite surcharger ces données
 * avec le helper buildMeta dans src/app/layout-meta.ts.
 */
export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),

  title: {
    default: "SferaLuna — Site de rencontres premium pour femmes",
    template: "%s | SferaLuna",
  },

  description:
    "SferaLuna est le site de rencontres premium pensé pour les femmes françaises. Sécurité, authenticité et affinités profondes. Rejoignez une communauté bienveillante.",

  keywords: [
    "site de rencontres",
    "rencontres femmes",
    "rencontres lesbiennes",
    "rencontres WLW",
    "site de rencontres premium",
    "rencontres authentiques",
    "SferaLuna",
    "rencontres sécurisées",
    "rencontres France",
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
    title: "SferaLuna — Site de rencontres premium pour femmes",
    description:
      "SferaLuna est le site de rencontres premium pensé pour les femmes françaises. Sécurité, authenticité et affinités profondes.",
    url: baseUrl,
    siteName: "SferaLuna",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SferaLuna — Site de rencontres premium",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "SferaLuna — Site de rencontres premium pour femmes",
    description:
      "Rejoignez SferaLuna, la communauté de rencontres premium pensée pour les femmes françaises.",
    images: ["/og-image.png"],
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

  category: "dating",
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
    "Site de rencontres premium pensé pour les femmes françaises. Sécurité, authenticité et affinités profondes.",
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
  description: "Site de rencontres premium pour femmes — France",
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
      </body>
    </html>
  );
}