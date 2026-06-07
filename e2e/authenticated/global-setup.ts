// e2e/authenticated/global-setup.ts
//
// Se connecte une seule fois avec le compte de test (E2E_TEST_EMAIL /
// E2E_TEST_PASSWORD) via le vrai formulaire /auth, puis sauvegarde
// l'état de session pour que tous les tests authentifiés le réutilisent
// (storageState) sans repasser par le formulaire à chaque fois.
//
// Si les variables d'environnement ne sont pas définies, on n'écrit
// aucun état : les specs détecteront son absence et s'auto-ignoreront
// (voir helpers.ts -> requireTestAccount).

import { chromium, type FullConfig } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// __dirname n'existe pas en ESM (package.json a "type": "module") :
// on le reconstruit depuis import.meta.url.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AUTH_DIR = path.join(__dirname, ".auth");
export const STORAGE_STATE_PATH = path.join(AUTH_DIR, "state.json");

export default async function globalSetup(config: FullConfig) {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    console.warn(
      "[e2e] E2E_TEST_EMAIL / E2E_TEST_PASSWORD non définies — " +
        "la suite e2e/authenticated sera ignorée."
    );
    return;
  }

  const baseURL =
    config.projects[0]?.use?.baseURL || "http://localhost:3000";

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });

  await page.goto("/auth");

  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /se connecter/i }).click();

  // On attend la redirection post-connexion (mon-compte ou explorer
  // selon que l'onboarding est terminé ou non).
  await page.waitForURL(/\/(mon-compte|explorer|inscription)/, {
    timeout: 30_000,
  });

  await page.context().storageState({ path: STORAGE_STATE_PATH });
  await browser.close();
}
