// e2e/authenticated/helpers.ts
//
// Petit helper partagé par les specs authentifiées : si le compte de
// test n'est pas configuré (pas de E2E_TEST_EMAIL/PASSWORD, donc pas
// d'état de session sauvegardé par global-setup.ts), on saute la suite
// au lieu de la faire échouer — pratique pour les runs locaux "rapides"
// qui ne couvrent que les pages publiques.

import { test } from "@playwright/test";
import fs from "node:fs";
import { STORAGE_STATE_PATH } from "./global-setup";

export function hasStoredSession() {
  return (
    Boolean(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD) &&
    fs.existsSync(STORAGE_STATE_PATH)
  );
}

/**
 * Charge l'état de session sauvegardé par global-setup.ts s'il existe,
 * sinon ne fait rien (storageState par défaut = pas de session).
 *
 * À appeler en tête de fichier, au niveau du describe :
 *   useStoredSessionIfAvailable();
 */
export function useStoredSessionIfAvailable() {
  if (fs.existsSync(STORAGE_STATE_PATH)) {
    test.use({ storageState: STORAGE_STATE_PATH });
  }
}

export function requireTestAccount() {
  test.skip(
    !hasStoredSession(),
    "Compte de test E2E non configuré — voir e2e/authenticated/README.md"
  );
}
