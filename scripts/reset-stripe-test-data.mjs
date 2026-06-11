// scripts/reset-stripe-test-data.mjs
// Usage : node scripts/reset-stripe-test-data.mjs

import mongoose from "mongoose";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const envVars = Object.fromEntries(
  readFileSync(join(__dirname, "../.env.local"), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

// Connexion sans spécifier de base pour lister toutes les bases
const baseUri = envVars.MONGODB_URI.replace(/\/[^/?]+(\?|$)/, "/$1");
await mongoose.connect(envVars.MONGODB_URI);

const adminDb = mongoose.connection.client.db("admin");
const { databases } = await adminDb.admin().listDatabases();
console.log("📦 Bases disponibles :", databases.map((d) => `${d.name} (${d.sizeOnDisk} bytes)`).join(", "));

// Chercher dans toutes les bases non-système
const filter = {
  $or: [
    { stripeCustomerId: { $exists: true, $ne: "" } },
    { isPremium: true },
    { subscriptionStatus: { $in: ["active", "trialing", "past_due"] } },
    { plan: { $ne: "free" } },
  ],
};

for (const { name } of databases) {
  if (["admin", "local", "config"].includes(name)) continue;
  const db = mongoose.connection.client.db(name);
  const collections = await db.listCollections().toArray();
  const colNames = collections.map((c) => c.name).join(", ");
  console.log(`\n🗄️  Base "${name}" — collections : ${colNames || "(vide)"}`);

  for (const col of collections) {
    if (!["users", "user"].includes(col.name)) continue;
    const coll = db.collection(col.name);
    const count = await coll.countDocuments(filter);
    console.log(`   → "${col.name}" : ${count} compte(s) à réinitialiser`);

    if (count > 0) {
      const affected = await coll.find(filter, {
        projection: { email: 1, plan: 1, isPremium: 1, subscriptionStatus: 1 }
      }).toArray();
      affected.forEach((u) =>
        console.log(`      - ${u.email} | plan: ${u.plan} | premium: ${u.isPremium} | status: ${u.subscriptionStatus}`)
      );

      const result = await coll.updateMany(filter, {
        $set: {
          stripeCustomerId: "",
          stripeSubscriptionId: "",
          stripeCheckoutSessionId: "",
          plan: "free",
          isPremium: false,
          subscriptionStatus: "inactive",
          premiumStartedAt: null,
          premiumExpiresAt: null,
          lastPaymentAt: null,
          subscriptionCancelAtPeriodEnd: false,
          subscriptionPaused: false,
        },
      });
      console.log(`   ✅  ${result.modifiedCount} compte(s) réinitialisé(s) dans "${name}.${col.name}"`);
    }
  }
}

await mongoose.disconnect();
console.log("\n✅ Terminé.");
