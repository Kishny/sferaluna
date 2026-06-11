# Prompt complet — Application mobile SferaLuna

> Ce document est un prompt prêt à l'emploi pour générer ou cadrer le développement d'une application mobile (iOS/Android) reprenant le site web SferaLuna. Copie-colle l'intégralité du contenu ci-dessous dans l'outil de ton choix (Claude, autre LLM, brief pour une équipe de dev…).

---

## PROMPT

Je veux développer une application mobile (iOS + Android) pour **SferaLuna**, un site de rencontre premium français déjà existant en version web (Next.js / React / TypeScript). L'application mobile doit reprendre l'expérience, les fonctionnalités et l'identité du site, en l'adaptant aux usages mobiles natifs (notifications push, géolocalisation, appareil photo, etc.).

### 1. Positionnement et public cible

* **Concept** : site/app de rencontre premium, orientée sécurité, authenticité et expérience féminine.
* **Cible principale** : femmes de 28 ans et plus, en recherche de relations sérieuses et authentiques, dans un cadre rassurant et modéré.
* **Ton** : chaleureux, élégant, rassurant, jamais superficiel. Univers visuel "lunaire"/nocturne, premium, apaisant — à l'opposé des apps de rencontre "speed dating" agressives.
* **Langue de l'interface** : français.

### 2. Identité visuelle

**Palette sombre (thème principal)**
* `#1a0b2e`, `#2d1b69`, `#3a2a82`
* Dégradés purple-600 → pink-600 pour les accents et CTA

**Palette claire (sections secondaires / textes)**
* `#faf9ff`, `#f0ecff`, `#8E7AB5`, `#5B4B8A`

**Style** : interfaces glassmorphism (fonds translucides, flou d'arrière-plan), animations douces type Framer Motion, icônes line-art (Lucide), typographie élégante, beaucoup d'espace, ambiance "lune/nuit/vibes".

### 3. Stack technique recommandée

* **Framework mobile** : React Native (Expo) ou Flutter — à choisir selon l'équipe ; React Native + Expo permet de réutiliser une partie de la logique métier TypeScript existante.
* **Navigation** : React Navigation (stack + tab navigator)
* **Auth** : NextAuth côté backend déjà en place (Google OAuth, Apple Sign In, email/mot de passe + bcrypt) → exposer ces flux via API REST/GraphQL consommée par l'app, ou utiliser Expo AuthSession pour les OAuth natifs
* **Backend existant à réutiliser tel quel** : API Next.js (App Router) déjà développée — MongoDB Atlas/Mongoose, Stripe (abonnements + Stripe Identity), Pusher (temps réel), Cloudinary (médias), Resend (emails transactionnels)
* **Notifications push** : Expo Notifications / Firebase Cloud Messaging, à brancher sur le système de notifications existant (messages, matches, visites de profil)
* **Paiement** : Stripe (via SDK mobile natif `@stripe/stripe-react-native`) pour les abonnements premium et Apple Pay / Google Pay natifs
* **Temps réel messagerie** : Pusher (channels privés `private-match-{matchId}`, déjà en place côté backend)
* **Stockage médias** : Cloudinary, avec accès caméra/galerie natif (Expo ImagePicker)
* **Vérification d'identité** : Stripe Identity (flux mobile via SDK ou WebView sécurisée)

### 4. Plans tarifaires (à reprendre à l'identique)

| ID plan | Nom | Prix |
|---|---|---|
| `free` | Gratuit | 0 € |
| `essential-monthly` | Essentiel | 9,99 €/mois |
| `premium-monthly` | Premium | 19,99 €/mois |
| `elite-monthly` | Elite | 34,99 €/mois |

### 5. Fonctionnalités à reproduire (écrans / modules)

**Authentification & onboarding**
* Connexion / inscription : email + mot de passe, Google OAuth, Apple Sign In
* Vérification d'email (Resend), réinitialisation de mot de passe
* Onboarding multi-étapes (profil : photos, bio, préférences, "réponse secrète" différenciante)
* Vérification d'identité optionnelle/premium via Stripe Identity

**Découverte & matching**
* Écran "Explorer" : cartes de profils avec swipe (like/pass), filtres (âge, distance, intérêts…)
* Détection de match mutuel → animation de match → ouverture directe de la conversation
* Enregistrement automatique des visites de profil

**Messagerie**
* Liste des matches
* Chat privé en temps réel (Pusher), historique des messages, indicateurs de lecture/typing si pertinent

**Notifications**
* Centre de notifications : nouveaux messages, nouveaux matches, nouvelles visites de profil
* Notifications push natives correspondantes

**Fonctionnalités communautaires & lifestyle ("Vibe-univers")**
* **Circle of Six** : 6 profils curatés chaque semaine
* **VibeSphere** : feed social façon mood board (posts, likes)
* **Journal émotionnel** : entrées d'humeur, rituels, playlists, analyse simulée par IA
* **VibeMentor** : Q&A communautaire / mentorat
* **VibePlanner** : suggestions et planification d'idées de rendez-vous (à connecter à l'API existante côté mobile — fonctionnalité en cours de finalisation côté web)
* **Communauté Luna** : forum par catégories, posts, commentaires, likes
* **Événements Luna** : liste d'événements avec inscription/désinscription

**Compte & paramètres**
* Tableau de bord "Mon compte" : profil, abonnement, préférences de visibilité
* **Mode Fantôme** : navigation invisible (réservé aux abonnements Premium et Elite)
* Gestion de l'abonnement : souscription, annulation en fin de période, pause, réactivation
* Aperçu de son propre profil public
* Signalement d'utilisateurs/contenus (modal de signalement)
* Pages légales : confidentialité, conditions, cookies, accessibilité ; consentement RGPD

**Paiement & premium**
* Écran de choix d'offre, paiement via Stripe (carte, Apple Pay, Google Pay, PayPal selon disponibilité)
* Gestion des fonctionnalités/limites par plan (quotas de likes, de visites de profil, boosts mensuels, accès au Mode Fantôme, etc.)

**Admin (si une interface mobile dédiée est souhaitée — sinon rester sur le dashboard web)**
* Statistiques, gestion des utilisateurs, signalements, validation des témoignages

### 6. Règles métier importantes à respecter

* Les valeurs de plan (`free`, `essential-monthly`, `premium-monthly`, `elite-monthly`), de statut d'abonnement (`inactive`, `active`, `trialing`, `past_due`, `canceled`) et de visibilité de profil (`public`, `matches`, `premium`, `invisible`) doivent rester strictement identiques au modèle `User` existant.
* `isPremium` est calculé automatiquement côté serveur (actif/en essai) — ne jamais le piloter manuellement depuis le client.
* Le **Mode Fantôme** (`visibilite: "invisible"`) n'est accessible qu'aux abonnements `premium-monthly` et `elite-monthly` ; refusé pour `free` et `essential-monthly`.
* Respect strict du RGPD (consentement cookies, droits des utilisateurs, mentions légales) — adapter les pages légales existantes au format mobile (ex. via WebView ou écrans natifs traduits du contenu existant).
* Sécurité : authentification robuste, limitation de débit (rate limiting), audit log des actions sensibles, modération via signalements.

### 7. Spécificités à ajouter pour la version mobile (vs. web)

* Notifications push natives (messages, matches, visites, événements)
* Accès caméra/galerie natif pour l'upload de photos de profil
* Géolocalisation (si filtres de distance activés)
* Authentification biométrique (Face ID / Touch ID) pour le déverrouillage rapide de l'app
* Mode hors-ligne / mise en cache légère pour la consultation des conversations récentes
* Deep links pour les notifications (ouvrir directement la conversation ou le profil concerné)
* Adaptation des animations Framer Motion vers des équivalents natifs performants (Reanimated, Lottie…)

### 8. Livrables attendus

* Architecture de navigation complète (arborescence des écrans)
* Maquettes ou wireframes pour chaque écran listé ci-dessus, respectant la palette et l'identité visuelle décrites
* Plan d'intégration avec l'API backend existante (endpoints déjà disponibles : profils, likes, matches, messages, notifications, abonnements Stripe, événements, communauté, etc.)
* Stratégie de déploiement (App Store / Google Play), incluant la conformité aux guidelines de paiement in-app (Apple impose parfois l'utilisation de son propre système de paiement pour les abonnements — à anticiper avec Stripe)

---

*Document généré pour servir de brief/prompt de cadrage produit. À adapter selon les choix techniques définitifs (React Native vs Flutter, etc.) et les contraintes des stores (Apple App Store / Google Play).*
