// src/app/api/admin/stats/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { User } from "@/models/User";
import { Match } from "@/models/Match";
import { Message } from "@/models/Message";

/**
 * GET /api/admin/stats
 *
 * Retourne les statistiques globales de la plateforme.
 * Réservé aux utilisateurs avec role === "admin".
 *
 * Champs historiques conservés (rétro-compatibles) + champs enrichis pour le
 * nouveau dashboard admin : membres actifs/inactifs, rétention, revenu estimé,
 * série 7 jours, répartition par âge et abonnements résiliés.
 */

// Prix mensuels par plan (€) — sync avec src/lib/subscription/config.ts.
const PLAN_PRICE: Record<string, number> = {
  free: 0,
  "essential-monthly": 9.99,
  "premium-monthly": 19.99,
  "elite-monthly": 34.99,
};

const PLAN_LABEL: Record<string, string> = {
  free: "Gratuit",
  "essential-monthly": "Essentiel",
  "premium-monthly": "Premium",
  "elite-monthly": "Elite",
};

const DAY_MS = 24 * 60 * 60 * 1000;

const WEEKDAY = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const adminUser = await User.findOne({ email: session.user.email.toLowerCase().trim() }).select("role");

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Accès refusé." }, { status: 403 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last24h = new Date(Date.now() - DAY_MS);
    const last7days = new Date(Date.now() - 7 * DAY_MS);
    const last30days = new Date(Date.now() - 30 * DAY_MS);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      premiumUsers,
      activeSubscriptions,
      profilesCompleted,
      newUsersToday,
      newUsersLast7days,
      newUsersLast30days,
      totalMatches,
      activeMatches,
      matchesLast7days,
      totalMessages,
      messagesLast7days,
      messagesToday,
      planBreakdown,
      // Activité
      active24h,
      activeLast7days,
      inactiveUsers,
      // Rétention (cohorte > 30 j)
      cohortOlder,
      cohortReturning,
      // Revenu — abonnements payants actifs par plan
      activePaidBreakdown,
      // Répartition par âge
      ageBuckets,
      // Séries temporelles 7 jours
      inscriptionsByDay,
      matchesByDay,
      messagesByDay,
      // Résiliations récentes
      canceledUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isPremium: true }),
      User.countDocuments({ subscriptionStatus: { $in: ["active", "trialing"] } }),
      User.countDocuments({ hasCompletedProfile: true }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: last7days } }),
      User.countDocuments({ createdAt: { $gte: last30days } }),
      Match.countDocuments(),
      Match.countDocuments({ isActive: true }),
      Match.countDocuments({ createdAt: { $gte: last7days } }),
      Message.countDocuments(),
      Message.countDocuments({ createdAt: { $gte: last7days } }),
      Message.countDocuments({ createdAt: { $gte: today } }),
      // Répartition par plan EFFECTIF : on ne compte le palier payant que si
      // l'abonnement est réellement actif/en essai. Un membre qui a choisi un
      // plan sans jamais l'activer (isPremium=false) est compté comme "free".
      User.aggregate([
        {
          $group: {
            _id: {
              $cond: [
                { $in: ["$subscriptionStatus", ["active", "trialing"]] },
                "$plan",
                "free",
              ],
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      User.countDocuments({ lastLoginAt: { $gte: last24h } }),
      User.countDocuments({ lastLoginAt: { $gte: last7days } }),
      User.countDocuments({
        $or: [{ lastLoginAt: null }, { lastLoginAt: { $lt: last30days } }],
      }),
      User.countDocuments({ createdAt: { $lt: last30days } }),
      User.countDocuments({
        createdAt: { $lt: last30days },
        lastLoginAt: { $gte: last30days },
      }),
      User.aggregate([
        { $match: { subscriptionStatus: { $in: ["active", "trialing"] }, plan: { $ne: "free" } } },
        { $group: { _id: "$plan", count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { age: { $ne: null } } },
        {
          $bucket: {
            groupBy: "$age",
            boundaries: [28, 35, 45, 55, 200],
            default: "autre",
            output: { count: { $sum: 1 } },
          },
        },
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: last7days } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Europe/Paris" },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Match.aggregate([
        { $match: { createdAt: { $gte: last7days } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Europe/Paris" },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      Message.aggregate([
        { $match: { createdAt: { $gte: last7days } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Europe/Paris" },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      User.find({ subscriptionStatus: "canceled" })
        .sort({ updatedAt: -1 })
        .limit(6)
        .select("pseudonyme plan updatedAt premiumExpiresAt")
        .lean(),
    ]);

    // --- Revenu mensuel estimé (abonnements payants actifs) ---
    let estimatedRevenue = 0;
    for (const p of activePaidBreakdown as { _id: string; count: number }[]) {
      estimatedRevenue += (PLAN_PRICE[p._id] ?? 0) * p.count;
    }

    // --- Revenu réel encaissé ce mois via Stripe ---
    // Somme des paiements réussis (montant net des remboursements) depuis le
    // 1er du mois. En cas d'échec Stripe, on retombe sur l'estimation.
    let stripeRevenue: number | null = null;
    let stripeCurrency = "eur";
    try {
      const gte = Math.floor(startOfMonth.getTime() / 1000);
      let grossCents = 0;
      let scanned = 0;

      for await (const charge of stripe.charges.list({
        created: { gte },
        limit: 100,
      })) {
        scanned += 1;
        if (charge.paid && charge.status === "succeeded") {
          grossCents += charge.amount - (charge.amount_refunded ?? 0);
          if (charge.currency) stripeCurrency = charge.currency;
        }
        if (scanned >= 2000) break; // garde-fou pagination
      }

      stripeRevenue = Math.round(grossCents / 100);
    } catch (stripeError) {
      console.error("Stripe revenue fetch failed:", stripeError);
    }

    const monthlyRevenue =
      stripeRevenue !== null ? stripeRevenue : Math.round(estimatedRevenue);
    const revenueSource = stripeRevenue !== null ? "stripe" : "estimate";

    // --- Rétention ---
    const retentionRate =
      cohortOlder > 0 ? Math.round((cohortReturning / cohortOlder) * 100) : 0;

    // --- Répartition par âge ---
    const ageLabels: Record<string, string> = {
      "28": "28–34 ans",
      "35": "35–44 ans",
      "45": "45–54 ans",
      "55": "55 ans +",
    };
    const ageMap = new Map<string, number>();
    for (const b of ageBuckets as { _id: number | string; count: number }[]) {
      ageMap.set(String(b._id), b.count);
    }
    const ageTotal = [...ageMap.values()].reduce((a, b) => a + b, 0);
    const ageDistribution = ["28", "35", "45", "55"].map((k) => {
      const count = ageMap.get(k) ?? 0;
      return {
        label: ageLabels[k],
        count,
        pct: ageTotal > 0 ? Math.round((count / ageTotal) * 100) : 0,
      };
    });

    // --- Série 7 jours (fill) ---
    const toMap = (arr: { _id: string; count: number }[]) =>
      new Map(arr.map((d) => [d._id, d.count]));
    const inscrMap = toMap(inscriptionsByDay as { _id: string; count: number }[]);
    const matchMap = toMap(matchesByDay as { _id: string; count: number }[]);
    const msgMap = toMap(messagesByDay as { _id: string; count: number }[]);

    const dailySeries = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(Date.now() - (6 - i) * DAY_MS);
      const key = ymd(d);
      return {
        label: WEEKDAY[d.getDay()],
        inscriptions: inscrMap.get(key) ?? 0,
        matches: matchMap.get(key) ?? 0,
        messages: msgMap.get(key) ?? 0,
      };
    });

    // --- Résiliations ---
    const canceled = (canceledUsers as {
      pseudonyme?: string;
      plan?: string;
      updatedAt?: Date;
      premiumExpiresAt?: Date | null;
    }[]).map((u) => ({
      pseudonyme: u.pseudonyme || "Utilisatrice",
      plan: u.plan || "free",
      planLabel: PLAN_LABEL[u.plan || "free"] || "Gratuit",
      date: (u.premiumExpiresAt || u.updatedAt || null),
    }));

    return NextResponse.json(
      {
        success: true,
        stats: {
          users: {
            total: totalUsers,
            premium: premiumUsers,
            activeSubscriptions,
            profilesCompleted,
            newToday: newUsersToday,
            newLast7days: newUsersLast7days,
            newLast30days: newUsersLast30days,
            conversionRate: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0,
            active24h,
            activeLast7days,
            inactive: inactiveUsers,
            retentionRate,
          },
          matches: {
            total: totalMatches,
            active: activeMatches,
            last7days: matchesLast7days,
          },
          messages: {
            total: totalMessages,
            last7days: messagesLast7days,
            today: messagesToday,
          },
          revenue: {
            monthly: monthlyRevenue,
            estimated: Math.round(estimatedRevenue),
            source: revenueSource,
            currency: stripeCurrency.toUpperCase(),
            since: startOfMonth.toISOString(),
          },
          planBreakdown: (planBreakdown as { _id: string; count: number }[]).map((p) => ({
            plan: p._id || "free",
            count: p.count,
          })),
          ageDistribution,
          dailySeries,
          canceled,
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    console.error("Erreur GET /api/admin/stats :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
