import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProvider from "./ClientProvider";
import JsonLd from "@/components/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sferaluna.fr";

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
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
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
    languages: { "fr-FR": baseUrl },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "",
  },
  category: "dating",
};

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

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SferaLuna",
  url: baseUrl,
  description: "Site de rencontres premium pour femmes — France",
  inLanguage: "fr-FR",
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${baseUrl}/explorer?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
