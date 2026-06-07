// e2e/authenticated/mon-compte.spec.ts
//
// Vérifie que le tableau de bord « Mon Compte » se charge pour une
// utilisatrice connectée et que la navigation entre onglets fonctionne
// (Accueil, Profil, Préférences, Premium, Sécurité, Connexions).
//
// On ne modifie aucune donnée ici (pas de submit de formulaire) pour
// ne pas polluer le compte de test.

import { test, expect } from "@playwright/test";
import { requireTestAccount, useStoredSessionIfAvailable } from "./helpers";

useStoredSessionIfAvailable();

test.describe("Mon Compte — tableau de bord", () => {
  test.beforeEach(() => {
    requireTestAccount();
  });

  test("affiche le pseudonyme et les onglets principaux", async ({ page }) => {
    await page.goto("/mon-compte");

    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page.locator("h1")).toBeVisible();

    for (const label of ["Accueil", "Profil", "Préférences", "Premium", "Sécurité", "Connexions"]) {
      await expect(page.getByRole("button", { name: label, exact: false })).toBeVisible();
    }
  });

  test("permet de naviguer vers l'onglet Premium via l'URL", async ({ page }) => {
    await page.goto("/mon-compte?tab=premium");

    await expect(page).not.toHaveURL(/\/auth/);
    // L'onglet Premium met en avant le plan actuel / les offres
    await expect(page.getByText(/plan actuel|abonnement/i).first()).toBeVisible();
  });

  test("permet de basculer vers l'onglet Sécurité", async ({ page }) => {
    await page.goto("/mon-compte");

    await page.getByRole("button", { name: /sécurité/i }).click();

    await expect(page.getByText(/connexion google sécurisée|adresse email enregistrée|question de sécurité/i).first()).toBeVisible();
  });
});
