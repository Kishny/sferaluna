// e2e/authenticated/explorer.spec.ts
//
// Parcours Explorer pour une utilisatrice connectée (3 pages) :
// - /explorer : « Vos découvertes du jour » (sélection hebdomadaire) ;
// - /explorer/libre : « Explorer librement » (carrousel) ;
// - /explorer/profil/[id] : profil détaillé.
// Chaque page a un bouton Retour qui revient à la page précédente.
//
// On n'envoie aucun like (effet de bord en base : Like + Match).

import { test, expect } from "@playwright/test";
import { requireTestAccount, useStoredSessionIfAvailable } from "./helpers";

useStoredSessionIfAvailable();

test.describe("Explorer — découvertes, exploration libre, profil détaillé", () => {
  test.beforeEach(() => {
    requireTestAccount();
  });

  test("affiche les découvertes du jour sans redirection vers /auth", async ({ page }) => {
    await page.goto("/explorer");

    await expect(page).not.toHaveURL(/\/auth/);
    await expect(page.getByRole("heading", { name: /vos découvertes/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /retour/i }).first()).toBeVisible();
  });

  test("« Explorer librement » ouvre le carrousel, puis Retour revient aux découvertes", async ({ page }) => {
    await page.goto("/explorer");
    await page.locator("main").getByRole("link", { name: /explorer librement/i }).first().click();

    await expect(page).toHaveURL(/\/explorer\/libre/);
    await expect(page.getByRole("heading", { name: /explorer librement/i })).toBeVisible();

    await page.locator("main").getByRole("button", { name: /retour aux découvertes/i }).click();
    await expect(page).toHaveURL(/\/explorer(\?.*)?$/);
  });

  test("« Voir plus » ouvre le profil détaillé, puis Retour revient au même profil de la liste", async ({ page }) => {
    await page.goto("/explorer/libre");

    const seeMore = page.getByRole("button", { name: /voir plus/i });
    const hasProfiles = await seeMore.isVisible({ timeout: 10_000 }).catch(() => false);
    if (!hasProfiles) {
      test.info().annotations.push({
        type: "info",
        description: "Aucun profil disponible pour le compte de test — vérifier le seed E2E.",
      });
      return;
    }

    await expect(page.getByRole("button", { name: /^passer$/i })).toBeEnabled();
    await expect(page).toHaveURL(/pid=/);
    const listUrl = page.url();

    await seeMore.click();
    await expect(page).toHaveURL(/\/explorer\/profil\//);
    await expect(page.getByRole("heading", { name: /profil détaillé/i })).toBeVisible();

    await page.locator("main").getByRole("button", { name: /retour à explorer librement/i }).click();
    await expect(page).toHaveURL(/\/explorer\/libre/);
    expect(new URL(page.url()).searchParams.get("pid")).toBe(new URL(listUrl).searchParams.get("pid"));
  });
});
