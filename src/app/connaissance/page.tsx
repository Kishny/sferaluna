"use client";

// src/app/connaissance/page.tsx

/**
 * La connaissance du jour — celle d'aujourd'hui, puis celles des jours
 * précédents. Page réservée aux membres connectées (voir src/middleware.ts).
 */

import BackButton from "@/components/BackButton";
import { Lightbulb } from "lucide-react";

import { ExplorerShell, PANEL } from "@/components/explorer/shared";
import { EmptyState, ErrorBanner, Eyebrow, GradientText, LoadingBlock, PANEL_FEATURED } from "@/components/app/kit";
import { InsightCard, useDailyInsight } from "@/components/insights/DailyInsight";

/** « mardi 6 octobre » à partir de AAAA-MM-JJ, sans décalage de fuseau. */
function dayLabel(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  const label = new Date(Date.UTC(year, month - 1, date, 12)).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function ConnaissancePage() {
  const { today, previous, isLoading, error, reload } = useDailyInsight();

  return (
    <ExplorerShell>
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <BackButton fallbackHref="/mon-compte" fallbackLabel="Retour au tableau de bord" />

        <div className="pt-4">
          <Eyebrow icon={Lightbulb}>Un rendez-vous quotidien</Eyebrow>
          <h1 className="mt-4 text-[34px] font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            La connaissance <GradientText>du jour</GradientText>
          </h1>
          <p className="mt-3 text-base leading-relaxed text-white/75 sm:text-lg">
            Un mot rare, une femme pionnière, un fait sur le monde ou sur l’amour : chaque jour, quelque chose à apprendre.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {isLoading && <LoadingBlock label="Chargement de la connaissance du jour…" />}

          {!isLoading && error && (
            <ErrorBanner message="Impossible de charger la connaissance du jour." onRetry={reload} />
          )}

          {!isLoading && !error && !today && (
            <EmptyState
              icon={Lightbulb}
              title="Bientôt ici"
              text="La première connaissance du jour arrive très vite. Revenez demain."
            />
          )}

          {!isLoading && !error && today && (
            <>
              <section aria-label="Aujourd’hui" className={`${PANEL_FEATURED} p-6 sm:p-8`}>
                <InsightCard insight={today.insight} large dateLabel={`Aujourd’hui · ${dayLabel(today.day)}`} />
              </section>

              {previous.length > 0 && (
                <section aria-labelledby="precedentes">
                  <h2 id="precedentes" className="mb-3 mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-white/60">
                    Les jours précédents
                  </h2>
                  <ul className="space-y-4">
                    {previous.map((entry) => (
                      <li key={entry.day} className={`${PANEL} p-5 sm:p-6`}>
                        <InsightCard insight={entry.insight} dateLabel={dayLabel(entry.day)} />
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </ExplorerShell>
  );
}
