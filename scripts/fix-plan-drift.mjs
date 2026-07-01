// scripts/fix-plan-drift.mjs
//
// Nettoyage one-shot des plans "dérivés".
//
// Contexte : avant le correctif du webhook Stripe, un checkout abandonné
// (abonnement Stripe "incomplete") pouvait laisser un membre avec, par ex.,
// plan="elite-monthly" alors que isPremium=false / subscriptionStatus="inactive".
// Ce script réaligne le champ `plan` sur la réalité de l'abonnement.
//
// Règle : si l'accès premium n'est PAS actif (isPremium=false) et que le statut
// n'est pas "past_due" (échec temporaire à ne pas déclasser), on remet plan="free".
//
// Autonome : node pur, aucune dépendance à ts-node ni aux alias `@/`.
// Lit MONGODB_URI depuis .env.local à la racine du projet.
//
// Lancement :  npm run fix:plans     (ou : node scripts/fix-plan-drift.mjs)
// Idempotent : peut être relancé sans risque.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvValue(key) {
  // .env.local d'abord, puis .env en repli.
  for (const file of [".env.local", ".env"]) {
    const p = path.join(__dirname, "..", file);
    if (!fs.existsSync(p)) continue;
    const content = fs.readFileSync(p, "utf8");
    const line = content
      .split(/\r?\n/)
      .find((l) => l.trim().startsWith(`${key}=`));
    if (line) {
      let val = line.slice(line.indexOf("=") + 1).trim();
      // retire d'éventuels guillemets englobants
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      return val;
    }
  }
  return process.env[key];
}

async function main() {
  // Priorité : argument CLI > variable shell MONGODB_URI > .env.local / .env
  const uri =
    process.argv[2] || process.env.MONGODB_URI || loadEnvValue("MONGODB_URI");
  if (!uri) {
    console.error("❌ MONGODB_URI introuvable (.env.local / .env / env).");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const dbName = mongoose.connection.db.databaseName;
  const users = mongoose.connection.db.collection("users");
  const totalUsers = await users.countDocuments();
  console.log(`\u2139\ufe0f  Base connect\u00e9e : "${dbName}" \u2014 ${totalUsers} membre(s) au total dans la collection "users".`);

  const query = {
    isPremium: false,
    plan: { $ne: "free" },
    subscriptionStatus: { $ne: "past_due" },
  };

  const affected = await users
    .find(query, { projection: { email: 1, pseudonyme: 1, plan: 1, subscriptionStatus: 1 } })
    .toArray();

  if (affected.length === 0) {
    console.log("✅ Aucun plan à corriger. Base déjà cohérente.");
    await mongoose.disconnect();
    return;
  }

  console.log(`🔧 ${affected.length} membre(s) à réaligner sur plan="free" :`);
  for (const u of affected) {
    console.log(
      `   - ${u.pseudonyme} <${u.email}> : ${u.plan} / ${u.subscriptionStatus} → free`
    );
  }

  const res = await users.updateMany(query, { $set: { plan: "free" } });
  console.log(`\n🎉 Terminé. ${res.modifiedCount} document(s) mis à jour.`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("❌ Erreur lors du nettoyage des plans :", err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
