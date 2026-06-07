# Tests E2E authentifiés

Les parcours qui nécessitent une session connectée (Explorer, Matches,
Messagerie, Mon Compte, Mode Fantôme…) ont besoin d'un **compte de test
dédié** dans MongoDB — on ne crée jamais de compte ni on ne touche aux
comptes réels depuis les tests E2E.

## Pré-requis

1. Créer une utilisatrice de test dans la base (email/mot de passe,
   `hasCompletedProfile: true`, `emailVerified: true`, profil complet)
   — par exemple via le script `scripts/seed.ts` ou directement dans
   MongoDB Atlas.
2. Définir les variables d'environnement avant de lancer les tests :

   ```bash
   export E2E_TEST_EMAIL="e2e.testeuse@sferaluna.test"
   export E2E_TEST_PASSWORD="MotDePasseDeTest123!"
   ```

3. Lancer uniquement la suite authentifiée :

   ```bash
   npx playwright test e2e/authenticated
   ```

## Pourquoi ce découpage ?

- `global-setup.ts` se connecte une seule fois via le formulaire
  `/auth`, sauvegarde l'état de session (cookies + localStorage) dans
  `e2e/authenticated/.auth/state.json`, et chaque test réutilise cet
  état (`storageState`) — on évite de relancer tout le flux OAuth/
  credentials à chaque test, ce qui serait lent et fragile.
- Si `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` ne sont pas définies, la
  suite est **automatiquement ignorée** (`test.skip`) plutôt que de
  faire échouer le run global — pratique en local quand on ne veut
  tester que les pages publiques.

## Fichier `.auth/state.json`

Ce fichier contient un cookie de session valide : il est ignoré par
git (voir `.gitignore` — section "tests E2E") et ne doit jamais être
commité.
