// e2e/auth.spec.ts
//
// Parcours E2E de la page /auth (connexion + inscription).
//
// Important : ces tests ne créent PAS de compte réel (pour ne pas polluer
// la base MongoDB de dev/prod). Ils valident :
// - le rendu et le basculement Connexion <-> Inscription ;
// - la validation client (messages d'erreur) avant tout appel réseau ;
// - la présence des méthodes de connexion sociales (Google / Apple).
//
// Les parcours « compte réel » (login réussi, onboarding, etc.) sont
// documentés dans e2e/authenticated/README.md et nécessitent un compte
// de test dédié (variables E2E_TEST_EMAIL / E2E_TEST_PASSWORD).

import { test, expect } from "@playwright/test";

test.describe("Page d'authentification — UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth");
  });

  test("affiche le formulaire de connexion par défaut", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /bienvenue de retour/i })
    ).toBeVisible();

    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /se connecter/i })).toBeVisible();
  });

  test("bascule vers le formulaire d'inscription", async ({ page }) => {
    await page.getByRole("button", { name: /^inscription$/i }).click();

    await expect(
      page.getByRole("heading", { name: /rejoignez l'aventure/i })
    ).toBeVisible();

    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /créer mon compte/i })).toBeVisible();
  });

  test("revient au formulaire de connexion depuis l'inscription", async ({ page }) => {
    await page.getByRole("button", { name: /^inscription$/i }).click();
    await page.getByRole("button", { name: /^connexion$/i }).click();

    await expect(
      page.getByRole("heading", { name: /bienvenue de retour/i })
    ).toBeVisible();
  });

  test("affiche une erreur de validation pour un email invalide à la connexion", async ({
    page,
  }) => {
    // "invalide@email" passe la validation native du <input type="email">
    // (qui n'exige pas de TLD/point) mais échoue la regex stricte de
    // l'app (/^\S+@\S+\.\S+$/) → l'erreur React s'affiche bien, contrairement
    // à une valeur sans "@" qui serait bloquée par le navigateur avant
    // même d'atteindre le code de validation.
    await page.locator('input[name="email"]').fill("invalide@email");
    await page.locator('input[name="password"]').fill("motdepasse123");

    await page.getByRole("button", { name: /se connecter/i }).click();

    await expect(page.getByText(/adresse email invalide/i)).toBeVisible();
  });

  test("affiche une erreur de validation pour un mot de passe trop court à l'inscription", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /^inscription$/i }).click();

    await page.locator('input[name="name"]').fill("Jeanne Dupont");
    await page.locator('input[name="email"]').fill("jeanne@example.com");
    await page.locator('input[name="password"]').fill("123");
    await page.locator('input[name="confirmPassword"]').fill("123");
    // La case "conditions d'utilisation" est requise (HTML5 required) :
    // sans elle, le navigateur bloque la soumission avant que la
    // validation React ne s'exécute, et aucun message n'apparaît.
    await page.locator('input[name="terms"]').check();

    await page.getByRole("button", { name: /créer mon compte/i }).click();

    await expect(
      page.getByText(/le mot de passe doit contenir au moins 6 caractères/i)
    ).toBeVisible();
  });

  test("affiche une erreur si le nom est trop court à l'inscription", async ({ page }) => {
    await page.getByRole("button", { name: /^inscription$/i }).click();

    await page.locator('input[name="name"]').fill("J");
    await page.locator('input[name="email"]').fill("jeanne@example.com");
    await page.locator('input[name="password"]').fill("motdepasse123");
    await page.locator('input[name="confirmPassword"]').fill("motdepasse123");
    await page.locator('input[name="terms"]').check();

    await page.getByRole("button", { name: /créer mon compte/i }).click();

    await expect(
      page.getByText(/le nom doit contenir au moins 2 caractères/i)
    ).toBeVisible();
  });

  test("propose les connexions sociales Google et Apple", async ({ page }) => {
    // Les boutons sociaux sont dans un accordéon fermé par défaut (mobile-first)
    await page
      .getByRole("button", { name: /autres méthodes de connexion/i })
      .click();

    // Le bouton d'accordéon contient déjà les mots "Google ou Apple" dans
    // sa description, donc getByRole('button', { name: /google/i }) matche
    // aussi ce bouton (violation strict mode). On cible plutôt les icônes
    // des boutons sociaux via leur attribut alt, unique et stable.
    await expect(page.locator('img[alt="Google"]')).toBeVisible();
    await expect(page.locator('img[alt="Continuer avec Apple"]')).toBeVisible();
  });

  test("le lien mot de passe oublié mène à la page de réinitialisation", async ({
    page,
  }) => {
    await page.getByRole("link", { name: /mot de passe oublié/i }).click();

    // Première visite de /auth/reset-password en mode dev : la compilation
    // à la volée peut dépasser les 5s par défaut (observé ~4980ms dans les
    // logs serveur), comme pour /circle dans protected-routes.spec.ts.
    await expect(page).toHaveURL(/\/auth\/reset-password/, { timeout: 15_000 });
  });
});
