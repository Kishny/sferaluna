# SferaLuna — CLAUDE.md

Site de rencontre premium français. Orientation : sécurité, authenticité, expérience féminine. Cible : femmes 28 ans et plus.

---

## Stack technique

- **Framework** : Next.js 15 (App Router) / React 18 / TypeScript
- **Styles** : Tailwind CSS 3, Framer Motion, Lucide React
- **Auth** : NextAuth v4 — Google OAuth + Facebook OAuth + Apple Sign In (HTTPS) + credentials (bcrypt)
- **BDD** : MongoDB Atlas + Mongoose (base `sferaluna`)
- **Paiement** : Stripe (abonnements mensuels)
- **Validation** : Zod + React Hook Form

---

## Structure du projet

```
src/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── stats/route.ts              ← statistiques dashboard admin
│   │   │   ├── users/route.ts              ← gestion utilisateurs admin
│   │   │   ├── reports/route.ts + [id]/    ← gestion signalements
│   │   │   └── testimonials/route.ts + [id]/ ← approuver/rejeter témoignages
│   │   ├── circle/route.ts                 ← GET 6 profils curatés semaine
│   │   ├── community/
│   │   │   ├── route.ts                    ← GET/POST posts communauté
│   │   │   └── [id]/route.ts               ← POST like/comment, DELETE
│   │   ├── events/
│   │   │   ├── route.ts                    ← GET events, POST (admin)
│   │   │   └── [id]/route.ts               ← POST toggle inscription
│   │   ├── likes/route.ts                  ← POST like / DELETE unlike
│   │   ├── matches/route.ts                ← GET liste matches
│   │   ├── messages/[matchId]/route.ts     ← GET/POST messages d'un match
│   │   ├── profiles/route.ts               ← GET profils découverte (filtres)
│   │   ├── vibementor/
│   │   │   ├── route.ts                    ← GET/POST questions Q&A
│   │   │   └── [id]/route.ts               ← POST répondre/liker question
│   │   ├── vibeplanner/route.ts            ← GET/POST/PATCH plans rendez-vous
│   │   ├── vibesphere/
│   │   │   ├── route.ts                    ← GET feed, POST créer vibe
│   │   │   └── [id]/route.ts               ← POST toggle like, DELETE
│   │   ├── visitors/route.ts               ← GET visiteurs / POST enregistrer visite
│   │   ├── newsletter/route.ts             ← POST abonnement newsletter (MongoDB)
│   │   ├── testimonials/route.ts           ← GET approuvés (public) + POST (auth)
│   │   ├── stripe/
│   │   │   ├── create-checkout-session/route.ts
│   │   │   └── webhook/route.ts
│   │   └── users/
│   │       ├── profile/route.ts
│   │       └── update-profile/route.ts
│   ├── admin/page.tsx                      ← Dashboard admin (stats + gestion users)
│   ├── auth/page.tsx                       ← Login/Register NextAuth
│   ├── auth/reset-password/page.tsx        ← Mot de passe oublié
│   ├── circle/page.tsx                     ← Circle of Six — 6 affinités/semaine ✅
│   ├── communaute/page.tsx                 ← Forum communauté par catégories ✅
│   ├── contact/page.tsx                    ← Formulaire de contact
│   ├── evenements/page.tsx                 ← Événements Luna avec inscription ✅
│   ├── explorer/page.tsx                   ← Découverte profils + like/pass + modal match ✅
│   ├── inscription/page.tsx                ← Onboarding multi-étapes
│   ├── matches/page.tsx                    ← Liste des matches ✅
│   ├── messages/[matchId]/page.tsx         ← Chat privé entre matchés ✅
│   ├── mode-fantome/page.tsx               ← Toggle invisible mode (premium) ✅
│   ├── mon-compte/page.tsx                 ← Dashboard (onglets: Accueil/Profil/Préférences/Premium/Sécurité/Connexions)
│   ├── paiement/page.tsx                   ← Choix offre Stripe
│   ├── vibementor/page.tsx                 ← Q&A mentorat communauté ✅
│   ├── vibeplanner/page.tsx                ← Idées rendez-vous + partage matches ✅
│   ├── vibesphere/page.tsx                 ← Feed social mood board ✅
│   ├── accessibilite/, confidentialite/, conditions/, cookies/  ← Pages légales
│   └── [pages marketing] commencer, equipe, faq, fonctionnalites, guide, histoire, tarifs, valeurs
├── components/
│   ├── Header.tsx                          ← Session-aware (Explorer, Mon compte, Déconnexion)
│   ├── Footer.tsx
│   └── UsageLimits.tsx
├── hooks/
│   └── usePremium.ts                       ← Hook client isPremium, can(feature)
├── lib/
│   ├── db.ts                               ← connectDB() avec cache global Mongoose
│   ├── stripe.ts
│   ├── premium.ts                          ← isPremiumActive(), canUseFeature(), getPlanLabel()
│   └── subscription/
│       ├── config.ts
│       └── service.ts
├── models/
│   ├── User.ts           ← Modèle principal
│   ├── Like.ts           ← like fromUserId → toUserId (unique)
│   ├── Match.ts          ← match mutuel user1Id/user2Id + lastMessageAt
│   ├── Message.ts        ← messages par matchId
│   ├── ProfileVisit.ts   ← visites profil
│   ├── VibePost.ts       ← posts VibeSphere (userId, content, mood, emoji, likes[])
│   ├── VibePlan.ts       ← plans rendez-vous (matchId, proposedById, status)
│   ├── LunaEvent.ts      ← événements Luna (date, attendees[], maxAttendees)
│   ├── CommunityPost.ts  ← posts forum (title, content, category, likes[], comments[])
│   ├── MentorPost.ts            ← Q&A VibeMentor (question, answers[], category)
│   ├── NewsletterSubscriber.ts  ← abonnés newsletter (email unique, confirmed)
│   ├── Testimonial.ts           ← témoignages (userId unique, content, status: pending/approved/rejected)
│   └── Report.ts                ← signalements (reporterId, targetType, targetId, reason, status)
└── middleware/
    └── check-limits.ts
```

---

## Modèle User.ts — référence

```typescript
// Plans (TOUJOURS utiliser ces valeurs exactes)
type UserPlan = "free" | "essential-monthly" | "premium-monthly" | "elite-monthly"

// Statuts abonnement
type SubscriptionStatus = "inactive" | "active" | "trialing" | "past_due" | "canceled"

// Visibilité profil
type ProfileVisibility = "public" | "matches" | "premium" | "invisible"
```

`isPremium` est auto-calculé en pre-save Mongoose (`active || trialing → true`). Ne jamais setter manuellement sauf dans le webhook Stripe.

---

## Plans tarifaires Stripe

| ID plan | Nom | Prix |
|---|---|---|
| `essential-monthly` | Essentiel | 9,99€/mois |
| `premium-monthly` | Premium | 19,99€/mois |
| `elite-monthly` | Elite | 34,99€/mois |

Les Price IDs Stripe sont dans `.env.local` :
- `STRIPE_PRICE_ESSENTIAL_MONTHLY`
- `STRIPE_PRICE_PREMIUM_MONTHLY`
- `STRIPE_PRICE_ELITE_MONTHLY`

---

## Variables d'environnement requises (.env.local)

```
MONGODB_URI=mongodb+srv://...
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
```

---

## Flux utilisateur complet

```
/auth (login/register)
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
```

---

## Ce qui est fonctionnel ✅

- Authentification (Google OAuth + Facebook OAuth + Apple Sign In + email/password + bcrypt)
- Onboarding profil multi-étapes (5 étapes, Zod)
- Paiement Stripe (3 offres, checkout, webhook, mise à jour MongoDB)
- Page Mon Compte (6 onglets : Accueil, Profil, Préférences, Premium, Sécurité, Connexions)
- Onglet Connexions = Matches + Visiteurs combinés dans Mon Compte
- API profil (GET/PUT)
- **Découverte profils** `/explorer` : cards swipe, filtres âge/intentions/localisation, filtres premium
- **Likes & Matches** : détection match mutuel, modal match, liste `/matches`
- **Messagerie** : chat privé `/messages/[matchId]`, polling 3s, pagination, lu/non-lu
- **Mode Fantôme** `/mode-fantome` : toggle invisible mode premium, page fonctionnelle
- **Circle of Six** `/circle` : 6 profils curatés/semaine par score de compatibilité
- **VibeSphere** `/vibesphere` : feed social, posts moods, likes, suppression
- **VibePlanner** `/vibeplanner` : librairie d'idées + proposer un plan à un match, accepter/refuser
- **VibeMentor** `/vibementor` : Q&A communauté, catégories, réponses, likes
- **Événements Luna** `/evenements` : liste événements, inscription/désinscription, admin create
- **Communauté Luna** `/communaute` : forum catégorisé, posts, commentaires, likes, épingles
- **Visiteurs** : enregistrement visite, consultation premium dans onglet Connexions
- **Filtres avancés premium** dans /explorer (orientation, actif récemment)
- **Dashboard admin** `/admin` : stats + gestion utilisateurs + promote/demote + onglet Témoignages (approuver/rejeter/supprimer)
- **Newsletter** : formulaire Footer → `/api/newsletter` → MongoDB + email Resend de bienvenue
- **Témoignages** `/valeurs` : soumission par utilisatrice connectée → `pending` → approbation admin → affiché en carousel
- **Signalements** : `ReportModal` + `/api/reports` + admin `/api/admin/reports/[id]`
- **Pages légales** : confidentialité, conditions, cookies, accessibilité, contact, reset-password
- **Header session-aware** : Explorer visible quand connecté, dropdown user, Matches retiré du header

---

## Ce qui reste à faire 🚀

1. **Déploiement** — Vercel, Stripe live keys, Google OAuth prod, domaine custom
2. **Notifications temps réel** — WebSockets ou Server-Sent Events (actuellement polling 3s)
3. **Upload photos** — Profil avec vraie photo (actuellement avatar Google ou initiale)
4. **Signalement** — Bouton signaler un profil/message + gestion admin
5. **Tests** — Tests unitaires et E2E

---

## ⚠️ Dette technique connue

- **`src/lib/auth.ts`** — importe depuis `../../auth.config.backup`, chemin cassé (ne pas modifier, non utilisé en prod).
- **`src/lib/subscription/config.ts`** — utilise des noms de plans legacy (`basic`, `premium`, `master`). Non utilisé activement, mais à nettoyer.
- **Polling messagerie** — actuellement polling toutes les 3 secondes. À remplacer par WebSockets pour la prod.

---

## Conventions de code

- Langue de l'UI : **français** (labels, messages d'erreur, commentaires)
- Types partagés (UserPlan, SubscriptionStatus, etc.) définis dans `src/models/User.ts` — toujours s'y référer
- Connexion MongoDB : toujours passer par `connectDB()` depuis `src/lib/db.ts`
- Accès session serveur : `getServerSession(authOptions)` depuis `src/app/api/auth/[...nextauth]/route.ts`
- Palette couleurs fonds sombres : `#1a0b2e`, `#2d1b69`, `#3a2a82` + gradients `purple-600 → pink-600`
- Palette couleurs fonds clairs : `#faf9ff`, `#f0ecff`, `#8E7AB5`, `#5B4B8A`
- Pages sombres (explorer, matches, messages) : `<Footer />` doit être **en dehors** du wrapper `text-white`
- Padding top des pages avec header fixe : **`pt-24`** minimum (header = 80px)
