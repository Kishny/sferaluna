// src/app/temoignages/page.tsx

import Link from "next/link";
import { ArrowRight, MessageCircle, ShieldCheck, Star, UsersRound } from "lucide-react";

import { SiteShell } from "@/components/site/sections";
import { BAND_GHOST, BAND_PRIMARY, CtaBand, PageBody, PageHero, PANEL, PhotoBackdrop, Pink } from "@/components/site/pagekit";
import JsonLd from "@/components/JsonLd";
import { PublicTestimonial } from "@/components/testimonials/TestimonialCard";
import TestimonialsExplorer from "@/components/testimonials/TestimonialsExplorer";
import TestimonialSubmitSection from "@/components/testimonials/TestimonialSubmitSection";
import { buildMeta } from "@/app/layout-meta";
import { connectDB } from "@/lib/db";
import { Testimonial } from "@/models/Testimonial";

export const metadata = buildMeta(
  "Témoignages — Elles parlent de SferaLuna",
  "Découvre les témoignages authentiques des membres de SferaLuna : des femmes qui ont trouvé des rencontres sincères, sûres et bienveillantes.",
  "/temoignages"
);

// Revalidation toutes les 5 minutes (les témoignages changent peu).
export const revalidate = 300;

const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "https://sferaluna.com"
).replace(/\/$/, "");

/**
 * Récupère les témoignages approuvés directement en base (rendu serveur),
 * pour un bon référencement (contenu présent dans le HTML).
 */
async function getApprovedTestimonials(): Promise<PublicTestimonial[]> {
  try {
    await connectDB();

    const docs = await Testimonial.find({ status: "approved" })
      .sort({ featured: -1, createdAt: -1 })
      .limit(300)
      .select(
        "authorName age city content rating avatar showAvatar featured createdAt"
      )
      .lean();

    return docs.map((t: any) => ({
      _id: String(t._id),
      authorName: t.authorName,
      age: t.age,
      city: t.city,
      content: t.content,
      rating: t.rating ?? 5,
      avatar: t.showAvatar ? t.avatar || null : null,
      featured: Boolean(t.featured),
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : undefined,
    }));
  } catch (error) {
    console.error("[/temoignages] getApprovedTestimonials", error);
    return [];
  }
}

export default async function TemoignagesPage() {
  const testimonials = await getApprovedTestimonials();

  const count = testimonials.length;
  const avgRating =
    count > 0
      ? Math.round(
          (testimonials.reduce((sum, t) => sum + (t.rating || 5), 0) / count) *
            10
        ) / 10
      : null;

  // JSON-LD : Organisation + note moyenne + avis (SEO "rich results").
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SferaLuna",
    url: baseUrl,
    description:
      "Réseau social premium français pensé pour les femmes qui aiment les femmes.",
    ...(avgRating && count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating,
            reviewCount: count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    review: testimonials.slice(0, 20).map((t) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: t.rating || 5,
        bestRating: 5,
        worstRating: 1,
      },
      author: {
        "@type": "Person",
        name: t.authorName,
      },
      reviewBody: t.content,
      ...(t.createdAt ? { datePublished: t.createdAt.slice(0, 10) } : {}),
    })),
  };

  const facts = [
    {
      icon: Star,
      gold: true,
      title: avgRating ? `${String(avgRating).replace(".", ",")}/5` : "—",
      line: "Note moyenne",
      hint: "Basée sur les témoignages publiés",
    },
    {
      icon: MessageCircle,
      title: String(count),
      line: `Témoignage${count > 1 ? "s" : ""} publié${count > 1 ? "s" : ""}`,
      hint: "Relus avant publication",
    },
    { icon: ShieldCheck, title: "Profils vérifiés", line: "Identité confirmée", hint: "Pièce d’identité et selfie" },
    { icon: UsersRound, title: "Modération active", line: "Un espace respectueux", hint: "et bienveillant" },
  ];

  return (
    <SiteShell back moon={false}>
      <PageBody>
        <PhotoBackdrop src="/images/guide-accessibilite-bg.webp" />

        <PageHero
          scene={false}
          id="tem"
          pill="Paroles de membres"
          pillIcon={MessageCircle}
          title={
            <>
              Elles parlent de <Pink>SferaLuna</Pink>
            </>
          }
          text="Des mots sincères, des expériences réelles. Découvre ce que les femmes de notre communauté pensent de SferaLuna."
        />

        {/* Repères */}
        <div className={`${PANEL} !mt-10 grid gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4 xl:divide-x xl:divide-violet-300/15`}>
          {facts.map(({ icon: Icon, gold, title, line, hint }) => (
            <div key={line} className="flex items-center gap-4 xl:pl-6 xl:first:pl-0">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20 ring-1 ring-violet-300/20">
                <Icon className={gold ? "h-7 w-7 fill-amber-300 text-amber-300" : "h-7 w-7 text-fuchsia-300"} />
              </span>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-tight text-white">{title}</p>
                <p className="text-sm text-white/85">{line}</p>
                <p className="text-xs text-white/55">{hint}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="!mt-8">
          <TestimonialsExplorer testimonials={testimonials} pageSize={12} />
        </div>

        <TestimonialSubmitSection />

        <CtaBand title="Prête à rejoindre la vibe ?" text="Des rencontres plus vraies, dans un espace bienveillant et sécurisé.">
          <Link href="/fonctionnalites" className={BAND_GHOST}>
            Découvrir les fonctionnalités
          </Link>
          <Link href="/auth?mode=register" className={BAND_PRIMARY}>
            Créer mon profil gratuit <ArrowRight className="h-4 w-4" />
          </Link>
        </CtaBand>
      </PageBody>

      <JsonLd data={jsonLd} />
    </SiteShell>
  );
}
