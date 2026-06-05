SferaLuna — CLAUDE.md

Site de rencontre premium français. Orientation : sécurité, authenticité, expérience féminine. Cible : femmes 28 ans et plus.

⸻

Stack technique

* Framework : Next.js 15 (App Router) / React 18 / TypeScript
* Styles : Tailwind CSS 3, Framer Motion, Lucide React
* Auth : NextAuth v4 — Google OAuth + Facebook OAuth + Apple Sign In (HTTPS) + credentials (bcrypt)
* BDD : MongoDB Atlas + Mongoose (base sferaluna)
* Paiement : Stripe (abonnements mensuels)
* Validation : Zod + React Hook Form
* SEO : Metadata Next.js, OpenGraph, Twitter Cards, sitemap, robots.txt, JSON-LD

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
│   │   ├── visitors/route.ts                 ← GET visiteurs / POST enregistrer visite
│   │   ├── newsletter/route.ts               ← POST abonnement newsletter (MongoDB)
│   │   ├── testimonials/route.ts             ← GET approuvés (public) + POST (auth)
│   │   ├── stripe/
│   │   │   ├── create-checkout-session/route.ts
│   │   │   └── webhook/route.ts
│   │   └── users/
│   │       ├── profile/route.ts              ← GET/PUT profil connecté + protection ghostMode
│   │       └── update-profile/route.ts
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
│   └── usePremium.ts                         ← Hook client isPremium, can(feature)
├── lib/
│   ├── db.ts                                 ← connectDB() avec cache global Mongoose
│   ├── stripe.ts
│   ├── premium.ts                            ← helpers premium legacy / UI
│   └── subscription/
│       ├── config.ts                         ← plans, limites, features
│       ├── service.ts
│       └── subscription-check.ts             ← guard serveur abonnement/features/actions
├── models/
│   ├── User.ts                               ← Modèle principal
│   ├── Subscription.ts                       ← Abonnements MongoDB
│   ├── Boost.ts                              ← Utilisation boosts
│   ├── Like.ts                               ← like fromUserId → toUserId (unique)
│   ├── Match.ts                              ← match mutuel user1Id/user2Id + lastMessageAt
│   ├── Message.ts                            ← messages par matchId
│   ├── ProfileVisit.ts                       ← visites profil unifiées
│   ├── VibePost.ts                           ← posts VibeSphere
│   ├── VibePlan.ts                           ← plans rendez-vous
│   ├── LunaEvent.ts                          ← événements Luna
│   ├── CommunityPost.ts                      ← posts forum
│   ├── MentorPost.ts                         ← Q&A VibeMentor
│   ├── NewsletterSubscriber.ts               ← abonnés newsletter
│   ├── Testimonial.ts                        ← témoignages
│   └── Report.ts                             ← signalements
└── middleware/
    └── check-limits.ts

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
    → GET /api/messages/[matchId] (polling 3s)
    → POST /api/messages/[matchId] { content }

Notifications :
  GET /api/notifications
    → compte nouveaux messages, nouveaux matches, nouvelles visites
  POST /api/notifications
    → met à jour lastSeenNotificationsAt

    Ce qui est fonctionnel ✅

* Authentification Google OAuth + Facebook OAuth + Apple Sign In + email/password + bcrypt.
* Onboarding profil multi-étapes.
* Paiement Stripe avec 3 offres, checkout, webhook et mise à jour MongoDB.
* Page Mon Compte avec onglets principaux.
* API profil GET/PUT.
* Découverte profils /explorer : cards, filtres, like/pass, modal match.
* Likes & Matches : détection match mutuel, création de Match, liste /matches.
* Messagerie privée /messages/[matchId], polling 3s.
* Mode Fantôme /mode-fantome, avec protection premium côté API.
* Circle of Six /circle, 6 profils curatés/semaine.
* VibeSphere /vibesphere, feed social mood board.
* Journal émotionnel /vibesphere/journal, localStorage, rituels, playlist, analyse IA simulée.
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

1. Déploiement
    * Vercel
    * Stripe live keys
    * Google OAuth prod
    * domaine custom
2. Notifications temps réel
    * Remplacer polling par WebSockets, Pusher ou Server-Sent Events.
3. Upload photos
    * Profil avec vraie photo utilisateur.
    * Gestion Cloudinary ou stockage sécurisé.
4. Signalement avancé
    * Bouton signaler sur profil et messages.
    * Historique complet dans admin.
5. Tests
    * Tests unitaires.
    * Tests API.
    * Tests E2E sur auth, paiement, matching, messages.
6. Nettoyage premium
    * Vérifier que tous les fichiers utilisent les mêmes clés :
        * profileVisits
        * ghostMode
        * premium-monthly
        * elite-monthly
7. Optimisation Mongoose
    * Corriger les index dupliqués.
    * Nettoyer les anciens fichiers legacy.

⸻

⚠️ Dette technique connue

1. Warning Mongoose — index dupliqués

Pendant le build, Mongoose affiche plusieurs warnings du type : [MONGOOSE] Warning: Duplicate schema index on {"email":1} found.
This is often due to declaring an index using both "index: true" and "schema.index()".
Please remove the duplicate index definition.

Cela signifie qu’un même index est déclaré deux fois.

Exemple problématique : email: {
  type: String,
  index: true,
}

et plus bas : UserSchema.index({ email: 1 });

Il faut choisir une seule méthode.

Pour email, préférer généralement : email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true,
}

et supprimer le doublon : UserSchema.index({ email: 1 });

Même problème repéré sur : stripeSubscriptionId

À vérifier dans : src/models/User.ts
src/models/Subscription.ts

Ce warning ne bloque pas forcément le build, mais il faut le corriger pour éviter :

* indexes inutiles ;
* ralentissements au démarrage ;
* confusion sur les contraintes MongoDB ;
* comportements inattendus en développement.

2. src/lib/auth.ts

Ce fichier importe depuis un ancien chemin backup : ../../auth.config.backup

S’il n’est plus utilisé, le supprimer ou le corriger.

3. Anciennes clés premium

Certaines anciennes références peuvent encore exister : profileViews
basic
premium
master

Les valeurs actuelles à utiliser : profileVisits
free
essential-monthly
premium-monthly
elite-monthly

4. Polling messagerie

La messagerie utilise encore un polling toutes les 3 secondes. Pour la production, remplacer par :

* WebSockets ;
* Pusher ;
* Server-Sent Events.

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

Git — commit et push :  git add .
git commit -m "Correction abonnement notifications et visites profil"
git push origin main

Vérifier les références ProfileView / ProfileVisit :  grep -R "ProfileView" src/app src/lib src/models
grep -R "ProfileVisit" src/app src/lib src/models

Vérifier les anciennes clés premium 