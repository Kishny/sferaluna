"use client";

// src/components/admin/InsightsAdmin.tsx

/**
 * Administration de la connaissance du jour : importer la série de départ,
 * ajouter, corriger, mettre en pause, programmer pour un jour précis, supprimer.
 * Composant autonome, branché dans l'onglet « Connaissance du jour » de
 * src/app/admin/page.tsx.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, Download, Lightbulb, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import { useConfirm } from "@/components/ConfirmDialog";
import { CATEGORY_META, CategoryBadge, type InsightCategory } from "@/components/insights/DailyInsight";

interface AdminInsight {
  id: string;
  category: InsightCategory;
  title: string;
  text: string;
  source: string;
  active: boolean;
  publishOn: string | null;
  fromStarter: boolean;
  lastShownDay: string | null;
  timesShown: number;
}

interface FormState {
  id: string | null;
  category: InsightCategory;
  title: string;
  text: string;
  source: string;
  active: boolean;
  publishOn: string;
}

const CATEGORIES = Object.keys(CATEGORY_META) as InsightCategory[];
const EMPTY_FORM: FormState = { id: null, category: "mot", title: "", text: "", source: "", active: true, publishOn: "" };
const FIELD =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-fuchsia-300/50 focus:outline-none";
const LABEL = "mb-1.5 block text-xs font-medium text-white/60";

function shortDay(day: string | null) {
  if (!day) return null;
  const [year, month, date] = day.split("-");
  return `${date}/${month}/${year}`;
}

export default function InsightsAdmin() {
  const [insights, setInsights] = useState<AdminInsight[]>([]);
  const [today, setToday] = useState("");
  const [todayInsightId, setTodayInsightId] = useState<string | null>(null);
  const [starterRemaining, setStarterRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [filter, setFilter] = useState<InsightCategory | "all">("all");
  const [form, setForm] = useState<FormState | null>(null);
  const [confirm, confirmDialog] = useConfirm();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/insights", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setInsights(data.insights);
      setToday(data.today);
      setTodayInsightId(data.todayInsightId);
      setStarterRemaining(data.starterRemaining);
    } catch {
      setMessage({ ok: false, text: "Impossible de charger les connaissances." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () => (filter === "all" ? insights : insights.filter((item) => item.category === filter)),
    [insights, filter]
  );
  const activeCount = insights.filter((item) => item.active).length;

  /** Appelle une route d'administration et recharge la liste si tout s'est bien passé. */
  const call = async (key: string, url: string, init: RequestInit, done: string) => {
    setBusy(key);
    setMessage(null);
    try {
      const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setMessage({ ok: false, text: data.error || "L’opération a échoué." });
        return false;
      }
      setMessage({ ok: true, text: typeof data.added === "number" ? `${data.added} connaissance(s) importée(s).` : done });
      await load();
      return true;
    } catch {
      setMessage({ ok: false, text: "Connexion impossible. Réessayez." });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    const ok = await confirm({
      title: `Importer ${starterRemaining} connaissance(s) ?`,
      text: "Elles seront actives tout de suite : la première s’affichera aux membres dès aujourd’hui. Vous pourrez ensuite les corriger, les mettre en pause ou les supprimer une à une.",
      confirmLabel: "Importer",
      danger: false,
    });
    if (ok) await call("import", "/api/admin/insights/import-starter", { method: "POST" }, "Série importée.");
  };

  const handleSave = async () => {
    if (!form) return;
    const body = JSON.stringify({
      category: form.category,
      title: form.title,
      text: form.text,
      source: form.source,
      active: form.active,
      publishOn: form.publishOn || null,
    });
    const ok = form.id
      ? await call("save", `/api/admin/insights/${form.id}`, { method: "PATCH", body }, "Connaissance mise à jour.")
      : await call("save", "/api/admin/insights", { method: "POST", body }, "Connaissance ajoutée.");
    if (ok) setForm(null);
  };

  const handleToggle = (item: AdminInsight) =>
    call(
      `toggle-${item.id}`,
      `/api/admin/insights/${item.id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ ...item, active: !item.active }),
      },
      item.active ? "Connaissance mise en pause." : "Connaissance réactivée."
    );

  const handleDelete = async (item: AdminInsight) => {
    const ok = await confirm({
      title: `Supprimer « ${item.title} » ?`,
      text:
        item.id === todayInsightId
          ? "C’est la connaissance affichée aujourd’hui : une autre prendra sa place. Elle disparaîtra aussi des jours précédents. Pour la garder sans plus la montrer, mettez-la plutôt en pause."
          : "Elle disparaîtra aussi de l’historique des jours précédents. Pour la garder sans plus la montrer, mettez-la plutôt en pause.",
      confirmLabel: "Supprimer",
    });
    if (ok) await call(`delete-${item.id}`, `/api/admin/insights/${item.id}`, { method: "DELETE" }, "Connaissance supprimée.");
  };

  return (
    <div className="space-y-4">
      {confirmDialog}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          <Lightbulb className="h-4 w-4 text-fuchsia-300" />
          Une connaissance par jour, la même pour toutes
        </p>
        <p className="mt-1 text-xs leading-relaxed text-white/50">
          Chaque jour, le site et l’application présentent une connaissance active : d’abord celles qui n’ont jamais été
          montrées, dans l’ordre de la liste, puis la série recommence. Une connaissance programmée pour une date précise
          passe ce jour-là. La source est une note pour l’équipe : les membres ne la voient pas. Vérifiez chaque fait
          avant de le publier.
        </p>
        <p className="mt-2 text-xs text-white/60">
          {insights.length} connaissance(s), dont {activeCount} active(s).
          {activeCount > 0 && ` De quoi tenir ${activeCount} jour(s) sans répétition.`}
        </p>
      </div>

      {message && (
        <div
          role="status"
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            message.ok ? "border-green-400/20 bg-green-500/10 text-green-200" : "border-red-400/25 bg-red-500/10 text-red-200"
          }`}
        >
          {message.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage(null)} aria-label="Fermer le message" className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setForm({ ...EMPTY_FORM })}
          className="flex min-h-[40px] items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-4 text-xs font-semibold text-white transition hover:brightness-110"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter une connaissance
        </button>
        {starterRemaining > 0 && (
          <button
            onClick={handleImport}
            disabled={busy !== null}
            className="flex min-h-[40px] items-center gap-2 rounded-xl border border-fuchsia-300/30 bg-fuchsia-500/15 px-4 text-xs font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/25 disabled:opacity-50"
          >
            {busy === "import" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Importer la série de départ ({starterRemaining})
          </button>
        )}
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as InsightCategory | "all")}
          aria-label="Filtrer par catégorie"
          className="ml-auto min-h-[40px] rounded-xl border border-white/10 bg-[#1a0d2e] px-3 text-xs text-white"
        >
          <option value="all">Toutes les catégories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_META[category].label}
            </option>
          ))}
        </select>
      </div>

      {form && (
        <div className="rounded-2xl border border-fuchsia-300/25 bg-[#1a0d2e] p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">{form.id ? "Corriger la connaissance" : "Nouvelle connaissance"}</p>
            <button onClick={() => setForm(null)} aria-label="Fermer le formulaire" className="rounded-lg p-2 text-white/60 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="insight-category" className={LABEL}>Catégorie</label>
              <select
                id="insight-category"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value as InsightCategory })}
                className={`${FIELD} bg-[#1a0d2e]`}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_META[category].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="insight-title" className={LABEL}>Titre ({form.title.length}/80)</label>
              <input
                id="insight-title"
                value={form.title}
                maxLength={80}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Hexade"
                className={FIELD}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="insight-text" className={LABEL}>Texte montré aux membres ({form.text.length}/600)</label>
              <textarea
                id="insight-text"
                value={form.text}
                maxLength={600}
                rows={4}
                onChange={(event) => setForm({ ...form, text: event.target.value })}
                placeholder="Deux ou trois phrases, exactes et vérifiées."
                className={FIELD}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="insight-source" className={LABEL}>Source (note interne, non montrée)</label>
              <input
                id="insight-source"
                value={form.source}
                maxLength={300}
                onChange={(event) => setForm({ ...form, source: event.target.value })}
                placeholder="Adresse de la page où le fait a été vérifié"
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="insight-date" className={LABEL}>Jour imposé (facultatif)</label>
              <input
                id="insight-date"
                type="date"
                value={form.publishOn}
                min={today}
                onChange={(event) => setForm({ ...form, publishOn: event.target.value })}
                className={`${FIELD} [color-scheme:dark]`}
              />
            </div>
            <label className="flex min-h-[44px] items-center gap-3 self-end text-sm text-white/80">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm({ ...form, active: event.target.checked })}
                className="h-4 w-4 accent-fuchsia-500"
              />
              Active (peut être montrée aux membres)
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setForm(null)} className="min-h-[40px] rounded-xl border border-white/15 px-4 text-xs font-medium text-white/80 hover:bg-white/10">
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={busy !== null || !form.title.trim() || !form.text.trim()}
              className="flex min-h-[40px] items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {busy === "save" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-fuchsia-300" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-12 text-center">
          <Lightbulb className="mx-auto h-8 w-8 text-white/30" />
          <p className="mt-3 text-sm font-semibold text-white">
            {insights.length === 0 ? "Aucune connaissance pour l’instant" : "Aucune connaissance dans cette catégorie"}
          </p>
          {insights.length === 0 && (
            <p className="mt-1 text-xs text-white/50">
              Rien ne s’affiche aux membres tant que la liste est vide. Importez la série de départ ou ajoutez la vôtre.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <div key={item.id} className={`rounded-2xl border border-white/10 bg-white/5 p-4 ${item.active ? "" : "opacity-60"}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge category={item.category} />
                    {item.id === todayInsightId && (
                      <span className="rounded-full border border-green-400/30 bg-green-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-green-200">
                        Affichée aujourd’hui
                      </span>
                    )}
                    {!item.active && (
                      <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] text-white/60">En pause</span>
                    )}
                    {item.publishOn && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] text-amber-200">
                        <CalendarDays className="h-3 w-3" /> Programmée le {shortDay(item.publishOn)}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/70">{item.text}</p>
                  <p className="mt-2 break-all text-xs text-white/40">
                    {item.source ? `Source : ${item.source}` : "Source non renseignée"}
                    {" · "}
                    {item.lastShownDay ? `Montrée ${item.timesShown} fois, la dernière le ${shortDay(item.lastShownDay)}` : "Jamais montrée"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() =>
                      setForm({
                        id: item.id,
                        category: item.category,
                        title: item.title,
                        text: item.text,
                        source: item.source,
                        active: item.active,
                        publishOn: item.publishOn ?? "",
                      })
                    }
                    disabled={busy !== null}
                    className="flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-medium text-white/85 transition hover:bg-white/10 disabled:opacity-50 lg:flex-none"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Corriger
                  </button>
                  <button
                    onClick={() => handleToggle(item)}
                    disabled={busy !== null}
                    className="flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-medium text-white/85 transition hover:bg-white/10 disabled:opacity-50 lg:flex-none"
                  >
                    {busy === `toggle-${item.id}` && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {item.active ? "Mettre en pause" : "Réactiver"}
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={busy !== null}
                    aria-label={`Supprimer ${item.title}`}
                    className="flex min-h-[40px] items-center justify-center rounded-xl border border-red-400/30 bg-red-600/15 px-3 text-red-200 transition hover:bg-red-600/25 disabled:opacity-50"
                  >
                    {busy === `delete-${item.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
