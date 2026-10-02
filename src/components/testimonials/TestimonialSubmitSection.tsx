"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ArrowRight, Send } from "lucide-react";

import TestimonialForm, { TestimonialFormInitial } from "./TestimonialForm";

const BUTTON =
  "inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 font-semibold text-white shadow-lg transition hover:brightness-110";

/**
 * Bandeau « Tu fais partie de l'aventure ? » (session-aware).
 *
 * - Visiteuse non connectée : bouton vers la connexion.
 * - Membre connectée : bouton qui révèle le formulaire, pré-rempli si elle
 *   a déjà témoigné (modification).
 */
export default function TestimonialSubmitSection() {
  const { data: session, status } = useSession();
  const sessionUser = session?.user as { id?: string } | undefined;

  const [open, setOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [initial, setInitial] = useState<TestimonialFormInitial | undefined>();
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/users/profile", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d.user?.image) setProfileImage(d.user.image);
      })
      .catch(() => {});

    fetch("/api/testimonials/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d.testimonial) {
          setAlreadySubmitted(true);
          setInitial({
            content: d.testimonial.content,
            age: d.testimonial.age,
            city: d.testimonial.city,
            rating: d.testimonial.rating,
            showAvatar: d.testimonial.showAvatar,
          });
        }
      })
      .catch(() => {});
  }, [status]);

  const loggedIn = Boolean(sessionUser?.id);

  return (
    <div className="rounded-3xl border border-violet-300/[0.16] bg-gradient-to-r from-[#2a1158]/85 to-[#1b0d38]/85 p-5 backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-500/25 ring-1 ring-violet-300/25">
            <Send className="h-6 w-6 text-fuchsia-300" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-white sm:text-xl">Tu fais partie de l’aventure ?</h2>
            <p className="mt-0.5 text-sm leading-relaxed text-white/70">
              Ton avis compte ! Partage ton expérience pour aider d’autres femmes à découvrir un espace de rencontres plus sûr, plus respectueux et plus authentique.
            </p>
          </div>
        </div>

        {!open &&
          status !== "loading" &&
          (loggedIn ? (
            <button type="button" onClick={() => setOpen(true)} className={BUTTON}>
              {alreadySubmitted ? "Modifier mon témoignage" : "Partager mon expérience"} <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <Link href="/auth?mode=login" className={BUTTON}>
              Me connecter pour témoigner <ArrowRight className="h-4 w-4" />
            </Link>
          ))}
      </div>

      {open && loggedIn && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-5 max-w-2xl">
          <TestimonialForm profileImage={profileImage} initial={initial} onCancel={() => setOpen(false)} />
        </motion.div>
      )}
    </div>
  );
}
