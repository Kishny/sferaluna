// playwright.config.ts
//
// Configuration Playwright pour les tests E2E SferaLuna.
//
// Convention :
// - les tests vivent dans e2e/ (pour ne pas se mélanger aux tests
//   unitaires Vitest présents dans src/__tests__) ;
// - le serveur Next.js est lancé automatiquement en mode dev avant
//   les tests (webServer), sauf si BASE_URL est fourni (CI / staging) ;
// - un seul navigateur (Chromium) par défaut pour rester rapide ；
//   Firefox/WebKit peuvent être activés en local au besoin.

import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Connecte une fois le compte de test (si configuré) et partage l'état
  // de session entre les specs e2e/authenticated/*. Voir ce fichier pour
  // le comportement quand E2E_TEST_EMAIL/PASSWORD ne sont pas définies.
  globalSetup: "./e2e/authenticated/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "html",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "fr-FR",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
      // SferaLuna est mobile-first : on vérifie aussi le rendu mobile
      // sur les parcours critiques (auth, navigation).
      testMatch: /.*\.mobile\.spec\.ts/,
    },
  ],

  // Lance `npm run dev` automatiquement si aucune URL externe n'est fournie.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },
});
