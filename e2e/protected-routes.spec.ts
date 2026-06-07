// e2e/protected-routes.spec.ts
//
// Vérifie que les pages réservées aux utilisatrices connectées
// redirigent vers /auth quand on y accède sans session.
//
// Ces pages utilisent useSession() côté client et redirigent via
// router.push("/auth?mode=login") quand status === "unauthenticated"
// (voir explorer/page.tsx, mon-compte/page.tsx, matches/page.tsx, etc.).
//
// Note : /vibeplanner est volontairement exclue. C'est une page de
// présentation publique ("bientôt disponible") sans aucun useSession()
// ni redirection — elle ne fait pas partie des routes protégées
// côté client malgré son apparition dans la liste des fonctionnalités.

import { test, expect } from "@playwright/test";

const PROTECTED_PATHS = [
  "/explorer",
  "/matches",
  "/mon-compte",
  "/circle",
  "/mode-fantome",
  "/vibesphere",
  "/vibementor",
];

test.describe("Routes protégées — redirection si non connectée", () => {
  for (const path of PROTECTED_PATHS) {
    test(`${path} redirige vers /auth pour une visiteuse non connectée`, async ({
      page,
    }) => {
      await page.goto(path);

      // En mode dev, la première visite d'une route compile la page à la
      // volée (peut dépasser les 5s par défaut) avant que useSession()
      // ne résolve son statut et ne déclenche la redirection.
      await expect(page).toHaveURL(/\/auth/, { timeout: 15_000 });
    });
  }
});
