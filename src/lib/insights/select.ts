// src/lib/insights/select.ts

/**
 * Choix de la connaissance du jour — fonctions pures, sans base de données.
 */

/** Jour civil à Paris, au format AAAA-MM-JJ. Le « jour » change à minuit, heure de Paris. */
export function parisDayKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isDayKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export interface InsightCandidate {
  id: string;
  createdAt: Date | string | number;
  /** Jour imposé par l'équipe, s'il y en a un. */
  publishOn?: string | null;
  /** Dernier jour où elle a été montrée, s'il y en a un. */
  lastShownDay?: string | null;
}

/**
 * Quelle connaissance montrer aujourd'hui ?
 *
 * 1. Celle que l'équipe a programmée pour ce jour, s'il y en a une.
 * 2. Sinon, une connaissance jamais montrée, la plus ancienne d'abord.
 * 3. Sinon, celle qui n'a pas été montrée depuis le plus longtemps : la série
 *    recommence, dans le même ordre.
 *
 * Les connaissances programmées pour un autre jour attendent leur date et ne
 * sont pas prises dans la rotation.
 */
export function chooseInsight(candidates: InsightCandidate[], day: string): string | null {
  const byAge = (a: InsightCandidate, b: InsightCandidate) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() || a.id.localeCompare(b.id);

  const scheduled = candidates.filter((item) => item.publishOn === day).sort(byAge);
  if (scheduled.length > 0) return scheduled[0].id;

  const rotation = candidates.filter((item) => !item.publishOn);
  if (rotation.length === 0) return null;

  const neverShown = rotation.filter((item) => !item.lastShownDay).sort(byAge);
  if (neverShown.length > 0) return neverShown[0].id;

  return [...rotation].sort(
    (a, b) => (a.lastShownDay as string).localeCompare(b.lastShownDay as string) || byAge(a, b)
  )[0].id;
}
