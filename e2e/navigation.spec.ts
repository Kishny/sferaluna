// e2e/navigation.spec.ts
//
// Parcours de fumée (smoke tests) sur les pages publiques principales.
// Objectif : s'assurer qu'aucune page marketing/légale ne plante au
// chargement et que la navigation globale (header/footer) fonctionne.

import { test, expect } from "@playwright/test";

test.describe("Pages publiques — chargement", () => {
  test("la page d'accueil affiche le header, le footer et un CTA d'inscription", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/SferaLuna/i);

    // Header présent avec accès à la connexion (bouton qui ouvre un menu
    // déroulant ou redirige vers /auth — ce n'est pas un <a>/<Link>).
    await expect(page.getByRole("button", { name: /connexion/i }).first()).toBeVisible();

    // Au moins un appel à l'action vers l'inscription / la découverte
    await expect(
      page.getByRole("link", { name: /rejoindre sferaluna|commencer|s'inscrire/i }).first()
    ).toBeVisible();

    // Footer présent (newsletter ou liens légaux)
    await expect(page.locator("footer")).toBeVisible();
  });

  test("la page tarifs affiche les trois offres", async ({ page }) => {
    await page.goto("/tarifs");

    // La page rend deux variantes du nom de chaque offre dans un <h3>
    // (accordéons mobiles "sm:hidden" + cards desktop "hidden sm:grid").
    // Sur le viewport desktop du projet "chromium", la version mobile
    // reste dans le DOM mais cachée — getByText(...).first() peut donc
    // tomber sur un élément invisible. On combine le sélecteur ciblé
    // (h3 exact) avec le pseudo-sélecteur Playwright :visible.
    await expect(
      page.locator("h3:visible", { hasText: /^essentiel$/i }).first()
    ).toBeVisible();
    await expect(
      page.locator("h3:visible", { hasText: /^premium$/i }).first()
    ).toBeVisible();
    await expect(
      page.locator("h3:visible", { hasText: /^elite$/i }).first()
    ).toBeVisible();
  });

  test("la page FAQ affiche des questions/réponses", async ({ page }) => {
    await page.goto("/faq");

    await expect(page.locator("h1")).toBeVisible();
    // Au moins un élément de question (accordéon ou texte)
    await expect(page.getByText(/\?/).first()).toBeVisible();
  });

  test("la page contact affiche un formulaire", async ({ page }) => {
    await page.goto("/contact");

    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
  });

  for (const path of [
    "/confidentialite",
    "/conditions",
    "/cookies",
    "/accessibilite",
  ]) {
    test(`la page légale ${path} se charge sans erreur`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response?.status()).toBeLessThan(400);
      await expect(page.locator("h1")).toBeVisible();
    });
  }
});

test.describe("Navigation globale", () => {
  test("le bouton Connexion du header mène à la page d'authentification", async ({
    page,
  }) => {
    await page.goto("/");

    // Sur desktop, "Connexion" est un bouton qui ouvre un menu déroulant
    // (pas un lien direct) ; le menu propose ensuite "Se connecter".
    await page.getByRole("button", { name: /^connexion$/i }).first().click();
    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page).toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { name: /bienvenue de retour|rejoignez l'aventure/i })
    ).toBeVisible();
  });

  test("le robots.txt et le sitemap sont accessibles", async ({ page }) => {
    const robots = await page.goto("/robots.txt");
    expect(robots?.status()).toBe(200);

    const sitemap = await page.goto("/sitemap.xml");
    expect(sitemap?.status()).toBe(200);
  });
});
