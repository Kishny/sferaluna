// src/components/site/SafetyGuide.tsx

"use client";

/**
 * Page /securite — deux sections explicatives :
 *   #moderation  → comment fonctionne la modération (filtre + équipe)
 *   #signalement → différence entre signaler et bloquer
 *
 * Le contenu décrit le fonctionnement réel du produit (filtre
 * anti-harcèlement de la messagerie, signalements examinés par l'équipe en
 * journée, suspension de compte, blocage mutuel qui ferme la conversation).
 */

import type { ElementType, ReactNode } from "react";
import { motion } from "framer-motion";

import MobileFold from "@/components/site/MobileFold";
import {
  Ban,
  BellOff,
  CircleAlert,
  Flag,
  Lightbulb,
  MapPin,
  MessageSquareWarning,
  MoreHorizontal,
  Phone,
  ShieldCheck,
  Target,
  UsersRound,
} from "lucide-react";

import { Container, reveal } from "@/components/site/sections";
import { GLASS, GLASS_INNER, IconBadge, SectionHeading, cn } from "@/components/site/ui";

// ─────────────────────────────────────────────
// Modération
// ─────────────────────────────────────────────

const MODERATION_STEPS: { icon: ElementType; tone: "violet" | "pink" | "gold" | "green"; title: string; text: string; points: string[] }[] = [
  {
    icon: MessageSquareWarning,
    tone: "pink",
    title: "1. Le filtre automatique",
    text: "Dans la messagerie, un message clairement abusif n’est jamais envoyé. Son autrice est prévenue et un signalement est créé automatiquement.",
    points: ["Insultes graves", "Propos misogynes ou homophobes", "Menaces"],
  },
  {
    icon: UsersRound,
    tone: "violet",
    title: "2. L’examen par l’équipe",
    text: "Chaque signalement, qu’il vienne d’une membre ou du filtre, est examiné par une personne de notre équipe de modération, en journée.",
    points: ["Signalements de profils", "Messages et publications", "Signalements automatiques"],
  },
  {
    icon: ShieldCheck,
    tone: "green",
    title: "3. La décision",
    text: "Selon la situation, le signalement est classé ou le compte en cause est suspendu. Un compte suspendu ne peut plus se connecter et son profil disparaît du site.",
    points: ["Signalement classé", "Compte suspendu si besoin"],
  },
];

export function ModerationSection() {
  return (
    <section id="moderation" className="relative scroll-mt-24 py-10 lg:py-14">
      <Container>
        <SectionHeading
          icon="moon"
          title="La modération, comment ça marche ?"
          subtitle="Un filtre automatique dans la messagerie et une équipe humaine qui examine chaque signalement."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {MODERATION_STEPS.map((step, i) => (
            <motion.div key={step.title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }} className={cn(GLASS, "flex flex-col p-5 sm:p-6")}>
              <div className="flex items-center gap-3">
                <IconBadge icon={step.icon} tone={step.tone} />
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/75">{step.text}</p>
              <MobileFold className="mt-auto pt-3" label="Voir les exemples" hideLabel="Masquer les exemples">
                <ul className={cn(GLASS_INNER, "space-y-1.5 p-3")}>
                  {step.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-[13px] text-white/85">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-300" />
                      {p}
                    </li>
                  ))}
                </ul>
              </MobileFold>
            </motion.div>
          ))}
        </div>

        <motion.div
          {...reveal}
          className="mt-4 flex flex-col gap-3 rounded-3xl border border-red-300/25 bg-red-950/30 p-5 backdrop-blur-xl sm:flex-row sm:items-center"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/20">
            <Phone className="h-5 w-5 text-red-200" />
          </span>
          <p className="text-sm leading-relaxed text-white/80">
            <span className="font-semibold text-white">En cas de danger immédiat</span>, n’attendez pas la modération : appelez le{" "}
            <a href="tel:17" className="font-semibold text-white underline-offset-2 hover:underline">17</a> ou le{" "}
            <a href="tel:112" className="font-semibold text-white underline-offset-2 hover:underline">112</a>. Violences Femmes Info :{" "}
            <a href="tel:3919" className="font-semibold text-white underline-offset-2 hover:underline">3919</a>, gratuit et anonyme.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}

// ─────────────────────────────────────────────
// Signaler ou bloquer
// ─────────────────────────────────────────────

type Row = { icon: ElementType; label: string; content: ReactNode };

function Where({ items }: { items: { place: string; how: ReactNode }[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((it) => (
        <li key={it.place} className="text-white/85">
          <span className="font-semibold text-white">{it.place} :</span> {it.how}
        </li>
      ))}
    </ul>
  );
}

const Dots = () => <MoreHorizontal className="inline h-4 w-4 align-[-3px]" aria-label="menu ⋯" />;

const REPORT_ROWS: Row[] = [
  {
    icon: Target,
    label: "À quoi ça sert",
    content: "Alerter l’équipe d’un comportement qui enfreint nos règles : harcèlement, faux profil, spam, contenu inapproprié.",
  },
  {
    icon: MapPin,
    label: "Où le trouver",
    content: (
      <Where
        items={[
          { place: "Sur un profil", how: <>menu <Dots /> puis « Signaler ce profil »</> },
          { place: "Dans une conversation", how: <>l’icône <Flag className="inline h-3.5 w-3.5 align-[-2px]" aria-hidden /> sur le message</> },
          { place: "Dans VibeSphere", how: "« Signaler » sous la publication" },
        ]}
      />
    ),
  },
  {
    icon: CircleAlert,
    label: "Ce qui se passe",
    content: "Vous choisissez un motif et pouvez ajouter des détails. L’équipe examine votre signalement en journée et prend les mesures nécessaires.",
  },
  {
    icon: BellOff,
    label: "La personne est-elle prévenue ?",
    content: "Non. Votre signalement reste confidentiel.",
  },
];

const BLOCK_ROWS: Row[] = [
  {
    icon: Target,
    label: "À quoi ça sert",
    content: "Ne plus voir une membre et ne plus être vue par elle, même si elle n’a enfreint aucune règle.",
  },
  {
    icon: MapPin,
    label: "Où le trouver",
    content: <Where items={[{ place: "Sur un profil", how: <>menu <Dots /> puis « Bloquer cette membre »</> }]} />,
  },
  {
    icon: CircleAlert,
    label: "Ce qui se passe",
    content:
      "Vous disparaissez l’une pour l’autre des découvertes, de la recherche et des suggestions. Si vous aviez matché, la conversation est fermée : elle ne peut plus vous écrire.",
  },
  {
    icon: BellOff,
    label: "La personne est-elle prévenue ?",
    content: "Non, aucune notification ne lui est envoyée.",
  },
];

function ActionCard({
  icon,
  tone,
  title,
  tagline,
  rows,
  accent,
  index,
}: {
  icon: ElementType;
  tone: "violet" | "pink";
  title: string;
  tagline: string;
  rows: Row[];
  accent: string;
  index: number;
}) {
  return (
    <motion.div {...reveal} transition={{ ...reveal.transition, delay: index * 0.08 }} className={cn(GLASS, "flex flex-col p-5 sm:p-6", accent)}>
      <div className="flex items-center gap-3">
        <IconBadge icon={icon} tone={tone} size="lg" />
        <div>
          <h3 className="text-2xl font-bold text-white">{title}</h3>
          <p className="text-sm text-white/65">{tagline}</p>
        </div>
      </div>
      <MobileFold className="mt-5 sm:mt-5" label="Comment ça se passe" hideLabel="Masquer">
      <dl className="space-y-3">
        {rows.map(({ icon: Icon, label, content }) => (
          <div key={label} className={cn(GLASS_INNER, "p-3.5")}>
            <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/55">
              <Icon className="h-3.5 w-3.5 text-violet-300" /> {label}
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-white/85">{content}</dd>
          </div>
        ))}
      </dl>
      </MobileFold>
    </motion.div>
  );
}

export function ReportBlockSection() {
  return (
    <section id="signalement" className="relative scroll-mt-24 py-10 lg:py-14">
      <Container>
        <SectionHeading
          title="Signaler ou bloquer : quelle différence ?"
          subtitle="Deux gestes distincts, que vous pouvez combiner."
        />

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <ActionCard
            index={0}
            icon={Flag}
            tone="pink"
            title="Signaler"
            tagline="Pour que l’équipe intervienne."
            rows={REPORT_ROWS}
            accent="border-fuchsia-300/30"
          />
          <ActionCard
            index={1}
            icon={Ban}
            tone="violet"
            title="Bloquer"
            tagline="Pour couper tout contact, tout de suite."
            rows={BLOCK_ROWS}
            accent="border-violet-300/30"
          />
        </div>

        <motion.div {...reveal} className={cn(GLASS, "mt-4 flex flex-col gap-3 p-5 sm:flex-row sm:items-center")}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15">
            <Lightbulb className="h-5 w-5 text-amber-200" />
          </span>
          <p className="text-sm leading-relaxed text-white/80">
            <span className="font-semibold text-white">Un comportement grave ?</span> Signalez d’abord, puis bloquez : l’équipe pourra examiner la
            situation, et vous n’aurez plus aucun contact avec la personne.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
