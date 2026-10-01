// src/components/profile/ChipEditor.tsx

"use client";

/**
 * Liste de pastilles modifiable : chaque pastille se retire d'un clic (×),
 * « + Ajouter » ouvre la liste des choix restants et, si autorisé, un champ libre.
 */

import { useEffect, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";

import { cn } from "@/components/site/ui";

type Option = { value: string; label: string };

export default function ChipEditor({
  values,
  onChange,
  options = [],
  allowCustom = false,
  max,
  labelFor = (v) => v,
  placeholder = "Saisir puis Entrée",
  emptyText = "Rien pour l’instant.",
}: {
  values: string[];
  onChange: (next: string[]) => void;
  options?: Option[];
  allowCustom?: boolean;
  max?: number;
  labelFor?: (value: string) => string;
  placeholder?: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const full = max !== undefined && values.length >= max;
  const has = (v: string) => values.some((x) => x.toLowerCase() === v.toLowerCase());
  const remaining = options.filter((o) => !has(o.value));

  useEffect(() => {
    if (open && allowCustom) inputRef.current?.focus();
  }, [open, allowCustom]);

  const add = (value: string) => {
    const v = value.trim();
    if (!v || has(v) || full) return;
    onChange([...values, v]);
  };

  const remove = (value: string) => onChange(values.filter((v) => v !== value));

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {values.length === 0 && !open && <span className="py-1.5 text-sm text-white/40">{emptyText}</span>}

        {values.map((value) => (
          <span
            key={value}
            className="group inline-flex items-center gap-1 rounded-full border border-violet-300/30 bg-white/[0.04] py-1.5 pl-3.5 pr-1.5 text-sm text-white/90"
          >
            {labelFor(value)}
            <button
              type="button"
              onClick={() => remove(value)}
              className="flex h-5 w-5 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
              aria-label={`Retirer ${labelFor(value)}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {!open && !full && (remaining.length > 0 || allowCustom) && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-fuchsia-300/50 px-3.5 py-1.5 text-sm text-fuchsia-100 transition hover:bg-fuchsia-500/10"
          >
            <Plus className="h-3.5 w-3.5" /> Ajouter
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 rounded-2xl border border-violet-300/20 bg-[#140828]/70 p-3">
          {full ? (
            <p className="text-xs text-amber-200/90">Maximum {max} atteint. Retirez-en une pour en ajouter une autre.</p>
          ) : (
            <>
              {remaining.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {remaining.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => add(o.value)}
                      className="inline-flex items-center gap-1 rounded-full border border-dashed border-white/20 px-3 py-1.5 text-sm text-white/70 transition hover:border-fuchsia-300/60 hover:text-white"
                    >
                      <Plus className="h-3 w-3" /> {o.label}
                    </button>
                  ))}
                </div>
              )}
              {allowCustom && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    add(text);
                    setText("");
                  }}
                  className={cn("flex gap-2", remaining.length > 0 && "mt-3")}
                >
                  <input
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
                    maxLength={40}
                    placeholder={placeholder}
                    className="input-luna h-9 flex-1 py-1 text-sm"
                  />
                  <button type="submit" className="rounded-xl border border-fuchsia-300/40 px-3 text-sm text-fuchsia-100 hover:bg-fuchsia-500/10">
                    Ajouter
                  </button>
                </form>
              )}
            </>
          )}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setText("");
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white"
            >
              <Check className="h-3.5 w-3.5" /> Terminé
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
