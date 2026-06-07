SferaLuna — CLAUDE.md

Site de rencontre premium français. Orientation : sécurité, authenticité, expérience féminine. Cible : femmes 28 ans et plus.

⸻

Stack technique

* Framework : Next.js 15 (App Router) / React 18 / TypeScript
* Styles : Tailwind CSS 3, Framer Motion, Lucide React
* Auth : NextAuth v4 — Google OAuth + Apple Sign In (HTTPS) + credentials (bcrypt) + vérification email (Resend)
* BDD : MongoDB Atlas + Mongoose (base sferaluna)
* Paiement : Stripe (abonnements mensuels) + Stripe Identity (vérification d'identité)
* Validation : Zod + React Hook Form
* SEO : Metadata Next.js, OpenGraph, Twitter Cards, sitemap, robots.txt, JSON-LD
* Temps réel : Pusher (messagerie + notifications)
* Upload media : Cloudinary (photos de profil)
* Emails transactionnels : Resend (src/lib/resend.ts + src/lib/emails.ts)
* Rate limiting : rate-limiter-flexible (src/lib/rate-limiter.ts)

⸻

Structure du projet

src/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── stats/route.ts                ← statistiques dashboard admin
│   │   │   ├── users/route.ts                ← gestion utilisateurs admin
│   │   │   ├── reports/route.ts + [id]/      ← gestion signalements
│   │   │   └── testimonials/route.ts + [id]/ ← approuver/rejeter témoignages
│   │   ├── circle/route.ts                   ← GET 6 profils curatés semaine
│   │   ├── community/
│   │   │   ├── route.ts                      ← GET/POST posts communauté
│   │   │   └── [id]/route.ts                 ← POST like/comment, DELETE
│   │   ├── events/
│   │   │   ├── route.ts                      ← GET events, POST (admin)
│   │   │   └── [id]/route.ts                 ← POST toggle inscription
│   │   ├── likes/route.ts                    ← POST like / DELETE unlike
│   │   ├── matches/route.ts                  ← GET liste matches
│   │   ├── messages/[matchId]/route.ts       ← GET/POST messages d'un match
│   │   ├── notifications/route.ts            ← GET notifications / POST mark as read
│   │   ├── profiles/route.ts                 ← GET profils découverte (filtres)
│   │   ├── profiles/[id]/route.ts            ← GET profil public d'une utilisatrice
│   │   ├── pusher/auth/route.ts              ← Auth canaux privés Pusher
│   │   ├── upload/avatar/route.ts            ← POST upload photo profil → Cloudinary
│   │   ├── identity-verification/route.ts   ← POST création session Stripe Identity
│   │   ├── reports/route.ts                  ← POST signalement (hors admin)
│   │   ├── stats/route.ts                    ← GET statistiques publiques
│   │   ├── users/visibility/route.ts         ← PUT mise à jour visibilité profil
│   │   ├── auth/register/route.ts            ← POST inscription email/password
│   │   ├── auth/verify-email/route.ts        ← GET vérification email token
│   │   ├── auth/reset-password/route.ts      ← POST reset mot de passe
│   │   ├── subscription/
│   │   │   ├── check/route.ts                ← vérification quotas/features/plans
│   │   │   └── status/route.ts               ← état abonnement connecté
│   │   ├── vibementor/
│   │   │   ├── route.ts                      ← GET/POST questions Q&A
│   │   │   └── [id]/route.ts                 ← POST répondre/liker question
│   │   ├── vibeplanner/route.ts              ← GET/POST/PATCH plans rendez-vous
│   │   ├── vibesphere/
│   │   │   ├── route.ts                      ← GET feed, POST créer vibe
│   │   │   └── [id]/route.ts                 ← POST toggle like, DELETE
│   │   ├── journal/route.ts                  ← GET/POST/DELETE journal émotionnel
│   │   ├── journal/[id]/route.ts             ← PATCH toggle ritual, DELETE entrée
│   │   ├── visitors/route.ts                 ← GET visiteurs / POST enregistrer visite
│   │   ├── newsletter/route.ts               ← POST abonnement newsletter (MongoDB)
│   │   ├── testimonials/route.ts             ← GET approuvés (public) + POST (auth)
│   │   ├── stripe/
│   │   │   ├── create-checkout-session/route.ts  ← PayPal + automatic_payment_methods
│   │   │   ├── webhook/route.ts                  ← checkout + subscription + invoice events
│   │   │   ├── sync/route.ts                     ← POST sync manuel abonnement Stripe → MongoDB
│   │   │   ├── cancel/route.ts                   ← POST annuler à la fin de période
│   │   │   ├── pause/route.ts                    ← POST mettre en pause (pause_collection)
│   │   │   └── reactivate/route.ts               ← POST réactiver depuis pause ou annulation
│   │   └── users/
│   │       ├── profile/route.ts              ← GET/PUT profil connecté + protection ghostMode
│   │       ├── update-profile/route.ts
│   │       └── visibility/route.ts           ← PUT visibilité profil
│   ├── admin/page.tsx                        ← Dashboard admin (stats + gestion users)
│   ├── auth/page.tsx                         ← Login/Register NextAuth
│   ├── auth/reset-password/page.tsx          ← Mot de passe oublié
│   ├── circle/page.tsx                       ← Circle of Six — 6 affinités/semaine ✅
│   ├── communaute/page.tsx                   ← Forum communauté par catégories ✅
│   ├── contact/page.tsx                      ← Formulaire de contact
│   ├── evenements/page.tsx                   ← Événements Luna avec inscription ✅
│   ├── explorer/page.tsx                     ← Découverte profils + like/pass + modal match ✅
│   ├── inscription/page.tsx                  ← Onboarding multi-étapes
│   ├── matches/page.tsx                      ← Liste des matches ✅
│   ├── messages/[matchId]/page.tsx           ← Chat privé entre matchés ✅
│   ├── mode-fantome/page.tsx                 ← Toggle invisible mode premium ✅
│   ├── mon-compte/page.tsx                   ← Dashboard compte utilisateur
│   ├── paiement/page.tsx                     ← Choix offre Stripe
│   ├── profil/[id]/page.tsx                  ← Page profil public d'une utilisatrice ✅
│   ├── vibementor/page.tsx                   ← Q&A mentorat communauté ✅
│   ├── vibeplanner/page.tsx                  ← Idées rendez-vous + partage matches ✅
│   ├── vibesphere/page.tsx                   ← Feed social mood board ✅
│   ├── vibesphere/journal/page.tsx           ← Journal émotionnel localStorage ✅
│   ├── sitemap.ts                            ← Sitemap SEO
│   ├── robots.ts                             ← Robots.txt SEO
│   ├── layout.tsx                            ← RootLayout React obligatoire
│   ├── layout-meta.ts                        ← Helper buildMeta SEO
│   ├── accessibilite/, confidentialite/, conditions/, cookies/
│   └── [pages marketing] commencer, equipe, faq, fonctionnalites, guide, histoire, tarifs, valeurs
├── components/
│   ├── Header.tsx                            ← Session-aware
│   ├── Footer.tsx
│   ├── JsonLd.tsx
│   ├── ReportModal.tsx
│   └── UsageLimits.tsx
├── hooks/
│   ├── usePremium.ts                         ← Hook client isPremium, can(feature)
│   └── useSubscription.ts                    ← Hook complet abonnement + limites + features
├── lib/
│   ├── db.ts                                 ← connectDB() avec cache global Mongoose
│   ├── stripe.ts
│   ├── premium.ts                            ← helpers premium legacy / UI
│   ├── auth.ts                               ← getAuthSession() helper serveur (re-export authOptions)
│   ├── cloudinary.ts                         ← client Cloudinary (CLOUDINARY_CLOUD_NAME/KEY/SECRET)
│   ├── pusher.ts                             ← client Pusher serveur
│   ├── pusher-client.ts                      ← client Pusher navigateur
│   ├── resend.ts                             ← client Resend emails (RESEND_API_KEY)
│   ├── emails.ts                             ← templates HTML emails transactionnels
│   ├── rate-limiter.ts                       ← rate limiting par IP (rate-limiter-flexible)
│   ├── audit.ts                              ← createAuditLog() helper
│   ├── utils.ts
│   ├── guards/
│   │   └── premium-guard.ts                  ← guard serveur premium simplifié
│   └── subscription/
│       ├── config.ts                         ← plans, limites, features
│       ├── service.ts
│       └── subscription-check.ts             ← guard serveur abonnement/features/actions
├── models/
│   ├── User.ts                               ← Modèle principal
│   ├── Subscription.ts                       ← Abonnements MongoDB
│   ├── AuditLog.ts                           ← Logs d'audit actions utilisateurs
│   ├── Boost.ts                              ← Utilisation boosts
│   ├── Like.ts                               ← like fromUserId → toUserId (unique)
│   ├── Match.ts                              ← match mutuel user1Id/user2Id + lastMessageAt
│   ├── Message.ts                            ← messages par matchId
│   ├── ProfileVisit.ts                       ← visites profil (visitorId / visitedId)
│   ├── VibePost.ts                           ← posts VibeSphere
│   ├── VibePlan.ts                           ← plans rendez-vous
│   ├── LunaEvent.ts                          ← événements Luna
│   ├── CommunityPost.ts                      ← posts forum
│   ├── MentorPost.ts                         ← Q&A VibeMentor
│   ├── NewsletterSubscriber.ts               ← abonnés newsletter
│   ├── Testimonial.ts                        ← témoignages
│   ├── Report.ts                             ← signalements
│   └── JournalEntry.ts                       ← entrées journal émotionnel (userId, mood, note, period)
└── middleware/
    └── check-limits.ts                       ← SubscriptionChecker + requireSubscription

    Modèle User.ts — référence : 

    // Plans — toujours utiliser ces valeurs exactes
type UserPlan =
  | "free"
  | "essential-monthly"
  | "premium-monthly"
  | "elite-monthly";

// Statuts abonnement
type SubscriptionStatus =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";

// Visibilité profil
type ProfileVisibility =
  | "public"
  | "matches"
  | "premium"
  | "invisible";

  isPremium est auto-calculé en pre-save Mongoose (active || trialing → true). Ne jamais setter manuellement hors webhook Stripe ou logique premium contrôlée.

⸻

Plans tarifaires Stripe : 

ID plan

Nom

Prix

free

Gratuit

0€

essential-monthly

Essentiel

9,99€/mois

premium-monthly

Premium

19,99€/mois

elite-monthly

Elite

34,99€/mois

Les Price IDs Stripe sont dans .env.local :  STRIPE_PRICE_ESSENTIAL_MONTHLY=...
STRIPE_PRICE_PREMIUM_MONTHLY=...
STRIPE_PRICE_ELITE_MONTHLY=...

Variables d’environnement requises (.env.local) :   MONGODB_URI=mongodb+srv://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ESSENTIAL_MONTHLY=...
STRIPE_PRICE_PREMIUM_MONTHLY=...
STRIPE_PRICE_ELITE_MONTHLY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Cloudinary (upload photos profil)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
# Pusher (temps réel messagerie)
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=eu
# Resend (emails transactionnels)
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...

Flux utilisateur complet :   /auth (login/register)
  → /inscription (5 étapes profil)
    → POST /api/users/update-profile (hasCompletedProfile = true)
      → /paiement (choix offre)
        → POST /api/stripe/create-checkout-session
          → Stripe Checkout
            → POST /api/stripe/webhook (checkout.session.completed)
              → isPremium = true dans MongoDB
                → /mon-compte?payment=success

Découverte & match :
  /explorer
    → GET /api/profiles (profils filtrés, exclus déjà likés)
    → POST /api/likes { targetUserId }
      → si match mutuel → Match créé → modal match → /messages/[matchId]
    → POST /api/visitors (enregistre visite automatiquement)

Messagerie :
  /messages/[matchId]
    → GET /api/messages/[matchId] (chargement initial)
    → POST /api/messages/[matchId] { content }
    → Pusher canal private-match-{matchId} pour réception temps réel

Notifications :
  GET /api/notifications
    → compte nouveaux messages, nouveaux matches, nouvelles visites
  POST /api/notifications
    → met à jour lastSeenNotificationsAt

    Ce qui est fonctionnel ✅

* Authentification Google OAuth + Apple Sign In + email/password + bcrypt.
* Onboarding profil multi-étapes.
* Paiement Stripe avec 3 offres, checkout, webhook et mise à jour MongoDB.
* Page Mon Compte avec onglets principaux.
* API profil GET/PUT.
* Découverte profils /explorer : cards, filtres, like/pass, modal match.
* Likes & Matches : détection match mutuel, création de Match, liste /matches.
* Messagerie privée /messages/[matchId], temps réel via Pusher.
* Mode Fantôme /mode-fantome, avec protection premium côté API.
* Circle of Six /circle, 6 profils curatés/semaine.
* VibeSphere /vibesphere, feed social mood board.
* Journal émotionnel /vibesphere/journal, persisté en MongoDB, rituels, playlist, analyse IA simulée.
* VibePlanner /vibeplanner, idées rendez-vous.
* VibeMentor /vibementor, Q&A communauté.
* Événements Luna /evenements, inscription/désinscription.
* Communauté Luna /communaute, forum, posts, commentaires, likes.
* Visiteurs de profil via ProfileVisit.
* Notifications basées sur messages, matches et visites.
* Dashboard admin /admin, stats, users, signalements, témoignages.
* Newsletter via Footer.
* Témoignages avec validation admin.
* Signalements via ReportModal.
* Pages légales : confidentialité, conditions, cookies, accessibilité.
* SEO : metadata globale, helper buildMeta, sitemap, robots, JSON-LD.
* Upload photo profil via Cloudinary (/api/upload/avatar).
* Emails transactionnels via Resend (vérification email, reset password, etc.).
* Temps réel via Pusher (messagerie + notifications).
* Vérification d'identité via Stripe Identity (/api/identity-verification).
* Rate limiting par IP (implémentation native Map, sans dépendance externe).
* Audit logs centralisés (src/lib/audit.ts + AuditLog model).
* Page profil public /profil/[id].
* Consentement cookies RGPD (CookieConsent + useCookieConsent hook).
* Tests unitaires Vitest (subscription, rate-limiter, cookie consent, premium).
* Aperçu profil public depuis Mon Compte (/profil/[id]?preview=1).
* Gestion abonnement Stripe : annulation fin période, pause, réactivation.
* Webhooks invoice.payment_succeeded / invoice.payment_failed (renouvellement mensuel).
* PayPal + Apple Pay + Google Pay via automatic_payment_methods Stripe.
* Synchronisation manuelle abonnement (/api/stripe/sync).
* Build Next.js validé avec succès.

⸻

Travail effectué récemment — session du matin ✅

1. Responsive mobile global

Une grosse passe a été faite sur plusieurs pages pour harmoniser le rendu mobile avec une logique commune :

* pages plus compactes ;
* paddings réduits sur mobile ;
* boutons pleine largeur quand nécessaire ;
* cartes plus lisibles ;
* sections moins hautes ;
* accordéons pour les contenus longs ;
* grilles desktop transformées proprement en colonnes mobile ;
* textes plus courts et mieux hiérarchisés.

Pages concernées :

* circle/page.tsx
* mode-fantome/page.tsx
* vibeplanner/page.tsx
* vibementor/page.tsx
* vibesphere/page.tsx
* vibesphere/journal/page.tsx
* commencer/page.tsx
* guide/page.tsx
* faq/page.tsx
* tarifs/page.tsx
* matches/page.tsx
* evenements/page.tsx
* cookies/page.tsx
* contact/page.tsx
* confidentialite/page.tsx
* conditions/page.tsx
* communaute/page.tsx
* admin/page.tsx
* accessibilite/page.tsx

2. Protection premium / abonnement

La logique premium a été renforcée autour de :  src/lib/subscription/config.ts
src/lib/subscription/subscription-check.ts
src/app/api/subscription/check/route.ts
src/app/api/subscription/status/route.ts

Le fichier config.ts centralise maintenant :

* les plans disponibles ;
* les limites ;
* les features ;
* les types PlanId, FeatureKey, LimitKey.

Le fichier subscription-check.ts sert de guard serveur pour :

* vérifier un plan minimum ;
* vérifier une fonctionnalité premium ;
* contrôler une action limitée ;
* récupérer les infos d’abonnement connectées.

Important : ce fichier utilise getServerSession, MongoDB et Mongoose. Il ne doit donc pas être utilisé dans le vrai middleware Edge Next.js à la racine du projet.

3. Protection du Mode Fantôme

Le mode fantôme a été sécurisé côté API.

Règle attendue : visibilite: "invisible"

ne doit être accepté que si l’utilisatrice a accès à : ghostMode

La feature ghostMode est disponible uniquement pour : premium-monthly
elite-monthly

Elle est refusée pour : free
essential-monthly

4. Fusion propre ProfileView / ProfileVisit

Il existait deux modèles très proches : ProfileView.ts
ProfileVisit.ts

La décision technique prise : garder une seule logique propre avec : src/models/ProfileVisit.ts

Le modèle final utilise : visitorId
visitedId

et sert à :

* enregistrer les visites de profil ;
* afficher les visiteurs premium ;
* calculer les quotas de visites ;
* alimenter les notifications.

ProfileView.ts a été supprimé.

Les fichiers adaptés : src/app/api/visitors/route.ts
src/app/api/notifications/route.ts
src/lib/subscription/subscription-check.ts

5. Notifications

La route : src/app/api/notifications/route.ts

a été consolidée pour compter :

* les nouveaux messages reçus ;
* les nouveaux matches ;
* les nouvelles visites de profil.

La lecture se base sur : user.lastSeenNotificationsAt

ou, à défaut, les 7 derniers jours.

POST /api/notifications marque les notifications comme lues.

6. SEO global

La structure SEO a été améliorée :

* src/app/layout.tsx doit rester un vrai RootLayout React ;
* src/app/layout-meta.ts contient le helper buildMeta;
* src/app/sitemap.ts liste les pages publiques ;
* src/app/robots.ts bloque les pages privées ;
* JsonLd est utilisé dans le layout.

Erreur corrigée : The default export is not a React Component in "/layout"

Cause : le contenu de layout-meta.ts avait été mis par erreur dans layout.tsx.

7. Build

Le build Next.js a été relancé : Résultat : build validé avec succès.

⸻

Ce qui reste à faire 🚀

1. Tests
    * Tests unitaires Vitest — ✅ setup fait, 4 suites (lancer : npm install && npm test).
    * Tests API (vitest + fetch mock) — à faire.
    * Tests E2E Playwright — à faire après stabilisation en prod.
2. PayPal
    * En attente d'approbation Stripe (paiements récurrents). Code prêt, activation automatique dès validation.
    * Activer Google Pay dans Dashboard Stripe (Settings → Payment Methods).

⸻

⚠️ Dette technique connue

Aucune dette bloquante connue à ce jour. Les corrections suivantes ont été appliquées :

* Index dupliqués Mongoose — corrigés dans User.ts (email, stripeSubscriptionId) et Subscription.ts.
* src/lib/auth.ts — corrigé, importe désormais authOptions depuis la route NextAuth officielle.
* Clés premium — toutes normalisées vers profileVisits, boostsPerMonth, etc.
* Polling messagerie — remplacé par Pusher temps réel.
* AuditLog model — créé dans src/models/AuditLog.ts.
* ProfileView fantôme — corrigé dans check-limits.ts (utilise désormais ProfileVisit).
* subscription/service.ts — réécrit en Mongoose (supprimé import Prisma/types obsolètes).
* UsageLimits.tsx — réécrit pour utiliser useSubscription hook (supprimé appel Prisma côté client).
* rate-limiter.ts — implémentation native Map (supprimé dépendance rate-limiter-flexible manquante).
* Journal émotionnel — migré de localStorage vers MongoDB (model JournalEntry + API /api/journal).
* Réponse secrète — bug sanitizeUser corrigé (_doc lu avant toObject transform), calcul completion côté client corrigé (hasReponse).
* params Next.js 15 — toutes les routes dynamiques [id] migrées vers Promise<{id}>.
* features status — bug status/route.ts corrigé (toutes les features renvoyées à true → corrigé).
* Stripe forceActive — webhook corrigé pour ignorer le statut "incomplete" lors du checkout.session.completed.

⸻

Conventions de code

* Langue UI : français.
* Types partagés à garder cohérents avec src/models/User.ts.
* Connexion MongoDB : toujours via connectDB() depuis src/lib/db.ts.
* Accès session serveur : getServerSession(authOptions).
* Palette sombre :
    * #1a0b2e
    * #2d1b69
    * #3a2a82
    * gradients purple-600 → pink-600
* Palette claire :
    * #faf9ff
    * #f0ecff
    * #8E7AB5
    * #5B4B8A
* Pages sombres : <Footer /> doit rester en dehors du wrapper text-white.
* Padding top avec header fixe : pt-24 minimum.
* Pour les pages mobiles :
    * réduire les gros py;
    * utiliser text-2xl / text-3xl sur mobile ;
    * préférer les cards compactes ;
    * mettre les longs contenus en accordéon ;
    * éviter les grilles trop larges ;
    * rendre les boutons principaux en w-full sur mobile.

⸻

Commandes utiles

Build :  npm run build

Développement : npm run dev

Tests unitaires :  npm test
Tests en watch :  npm run test:watch
Tests + couverture :  npm run test:coverage

Git — commit et push :  git add .
git commit -m "feat: cookie consent RGPD + tests unitaires Vitest"
git push origin main

Vérifier les références ProfileView / ProfileVisit :  grep -R "ProfileView" src/app src/lib src/models
grep -R "ProfileVisit" src/app src/lib src/models

Vérifier les anciennes clés premium 