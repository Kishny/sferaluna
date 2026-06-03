// Helper to build consistent OG metadata per page
const base = process.env.NEXT_PUBLIC_APP_URL || "https://sferaluna.fr";

export function buildMeta(title: string, description: string, path: string = "") {
  const url = `${base}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "SferaLuna",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: title }],
      locale: "fr_FR",
      type: "website" as const,
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}
