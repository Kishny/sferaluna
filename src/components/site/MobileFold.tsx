// src/components/site/MobileFold.tsx

"use client";

/**
 * Repli réservé au téléphone : sous 640 px, le contenu est masqué derrière un
 * bouton « Voir le détail » ; à partir de 640 px il est toujours affiché et le
 * bouton disparaît. Sert à raccourcir les pages longues sur mobile sans rien
 * retirer sur grand écran.
 */

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export default function MobileFold({
  children,
  label = "Voir le détail",
  hideLabel = "Masquer le détail",
  defaultOpen = false,
  className = "",
  buttonClassName = "",
}: {
  children: ReactNode;
  label?: string;
  hideLabel?: string;
  defaultOpen?: boolean;
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className={`mt-3 inline-flex h-10 items-center gap-1.5 text-sm font-semibold text-pink-300 sm:hidden ${buttonClassName}`}
      >
        {open ? hideLabel : label}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div id={id} className={`${open ? "block" : "hidden"} sm:block ${className}`}>
        {children}
      </div>
    </>
  );
}
