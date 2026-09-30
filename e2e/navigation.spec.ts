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

    // Header présent avec accès direct à la connexion (lien vers /auth).
    await expect(
      page.locator("header").getByRole("link", { name: /^connexion$/i })
    ).toBeVisible();

    // Au moins un appel à l'action vers l'inscription
    await expect(
      page.getByRole("link", { name: /créer mon profil/i }).first()
    ).toBeVisible();

    // Footer présent (newsletter ou liens légaux)
    await expect(page.locator("footer")).toBeVisible();
  });

  test("la page tarifs affiche les quatre offres", async ({ page }) => {
    await page.goto("/tarifs");

    // Une carte par offre, avec le nom de l'offre en titre (h2).
    for (const name of [/^gratuit$/i, /^essentiel$/i, /^premium$/i, /^elite$/i]) {
      await expect(page.getByRole("heading", { level: 2, name })).toBeVisible();
    }
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

    // "Connexion" est un lien direct du header (visible à partir de 1024 px).
    await page.locator("header").getByRole("link", { name: /^connexion$/i }).click();

    await expect(page).toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { name: /heureuse de vous revoir/i })
    ).toBeVisible();
  });

  test("le robots.txt et le sitemap sont accessibles", async ({ page }) => {
    const robots = await page.goto("/robots.txt");
    expect(robots?.status()).toBe(200);

    const sitemap = await page.goto("/sitemap.xml");
    expect(sitemap?.status()).toBe(200);
  });
});
