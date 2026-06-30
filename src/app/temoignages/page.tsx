// src/app/temoignages/page.tsx

import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import TestimonialCard, {
  PublicTestimonial,
} from "@/components/testimonials/TestimonialCard";
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
      .sort({ createdAt: -1 })
      .limit(60)
      .select("authorName age city content rating avatar showAvatar createdAt")
      .lean();

    return docs.map((t: any) => ({
      _id: String(t._id),
      authorName: t.authorName,
      age: t.age,
      city: t.city,
      content: t.content,
      rating: t.rating ?? 5,
      avatar: t.showAvatar ? t.avatar || null : null,
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
      "Site de rencontre premium français pensé pour les femmes qui aiment les femmes.",
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

  return (
    <>
      <Header />
      <JsonLd data={jsonLd} />

      <main className="overflow-hidden bg-gradient-to-b from-[#F5F3F7] to-white pt-16 text-[#1C1C1C] sm:pt-20">
        {/* Hero */}
        <section className="relative px-4 py-8 text-center sm:px-6 sm:py-14">
          <div className="absolute inset-0 bg-gradient-to-b from-[#FDF7FA] via-[#F5F0FF] to-transparent" />

          <div className="relative z-10 mx-auto max-w-3xl">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#8E7AB5]/20 bg-white/80 px-3 py-1.5 text-xs font-medium text-[#5B4B8A] sm:text-sm">
              💜 Paroles de membres
            </span>

            <h1 className="text-2xl font-bold leading-tight text-[#1C1C1C] sm:text-5xl">
              Elles parlent de{" "}
              <span className="bg-gradient-to-r from-[#5B4B8A] via-[#8E7AB5] to-[#D9B8FF] bg-clip-text text-transparent">
                SferaLuna
              </span>
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#666] sm:text-lg">
              Des vrais mots, de vraies femmes. Voici ce que vivent les membres
              de notre communauté — avant même de t&apos;inscrire.
            </p>

            {avgRating && count > 0 && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-[#E8E0FF] bg-white px-4 py-2 text-sm text-[#5B4B8A] shadow-sm">
                <span className="text-amber-400">★</span>
                <span className="font-bold">{avgRating}/5</span>
                <span className="text-[#999]">
                  · {count} témoignage{count > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Grille de témoignages */}
        <section className="relative px-4 pb-10 sm:px-6 sm:pb-16">
          <div className="mx-auto max-w-6xl">
            {count > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((testimonial) => (
                  <TestimonialCard
                    key={testimonial._id}
                    testimonial={testimonial}
                  />
                ))}
              </div>
            ) : (
              <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-[#E8E0FF] bg-white px-4 py-10 text-center">
                <div className="mb-3 text-5xl">💜</div>
                <p className="text-lg font-semibold text-[#5B4B8A]">
                  Les premiers témoignages arrivent bientôt
                </p>
                <p className="mt-1 text-sm text-[#666]">
                  Sois parmi les premières à partager ton expérience.
                </p>
              </div>
            )}

            {/* Partager son expérience */}
            <div className="mt-10 rounded-3xl border border-[#E8E0FF] bg-gradient-to-br from-[#F9F7FC] to-[#F0ECFF] p-5 sm:mt-14 sm:p-8">
              <div className="mb-2 text-center">
                <h2 className="text-lg font-bold text-[#1C1C1C] sm:text-2xl">
                  Tu fais partie de l&apos;aventure ?
                </h2>
                <p className="mt-1 text-sm text-[#666]">
                  Partage ton expérience pour rassurer les futures membres.
                </p>
              </div>

              <TestimonialSubmitSection />
            </div>

            {/* CTA inscription */}
            <div className="mt-10 text-center">
              <Link
                href="/auth?mode=register"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] px-7 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 sm:text-base"
              >
                Rejoindre SferaLuna ✨
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
