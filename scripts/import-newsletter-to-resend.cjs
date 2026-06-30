// scripts/import-newsletter-to-resend.cjs
//
// Script à lancer UNE FOIS pour importer les abonnées newsletter déjà
// présentes dans MongoDB vers l'Audience Resend.
//
// Usage (depuis la racine du projet) :
//   node scripts/import-newsletter-to-resend.cjs
//
// Pré-requis dans .env.local :
//   MONGODB_URI=...
//   RESEND_API_KEY=...        (clé Full access)
//   RESEND_AUDIENCE_ID=...    (UUID de l'audience)
//
// Sûr à relancer : il ne fait que créer des contacts. Les doublons sont
// ignorés, rien n'est supprimé.

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { Resend } = require("resend");

// ── Chargement minimaliste de .env.local ────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env.local introuvable à la racine du projet.");
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, "utf8");
  const env = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const env = loadEnv();

  const MONGODB_URI = env.MONGODB_URI;
  const RESEND_API_KEY = env.RESEND_API_KEY;
  const RESEND_AUDIENCE_ID = env.RESEND_AUDIENCE_ID;

  if (!MONGODB_URI || !RESEND_API_KEY || !RESEND_AUDIENCE_ID) {
    console.error(
      "❌ Variables manquantes. Vérifie MONGODB_URI, RESEND_API_KEY et RESEND_AUDIENCE_ID dans .env.local."
    );
    process.exit(1);
  }

  const resend = new Resend(RESEND_API_KEY);

  console.log("→ Connexion à MongoDB…");
  await mongoose.connect(MONGODB_URI);

  const collection = mongoose.connection.db.collection("newslettersubscribers");
  const docs = await collection.find({}, { projection: { email: 1 } }).toArray();

  console.log(`→ ${docs.length} abonnée(s) trouvée(s) en base.`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < docs.length; i++) {
    const email = (docs[i].email || "").toLowerCase().trim();
    if (!email) {
      skipped += 1;
      continue;
    }

    try {
      const res = await resend.contacts.create({
        audienceId: RESEND_AUDIENCE_ID,
        email,
        unsubscribed: false,
      });

      if (res.error) {
        // Un doublon renvoie souvent une erreur : on considère ça comme "déjà là".
        const msg = (res.error.message || "").toLowerCase();
        if (msg.includes("already") || msg.includes("exist")) {
          skipped += 1;
        } else {
          errors += 1;
          console.warn(`  ⚠️  ${email} : ${res.error.message}`);
        }
      } else {
        created += 1;
      }
    } catch (err) {
      errors += 1;
      console.warn(`  ⚠️  ${email} : ${err.message}`);
    }

    // Respect des limites de débit Resend (~10 req/s) — on reste prudent.
    await sleep(150);

    if ((i + 1) % 25 === 0) {
      console.log(`  …${i + 1}/${docs.length} traités`);
    }
  }

  console.log("\n=== Import terminé ===");
  console.log(`  Ajoutés   : ${created}`);
  console.log(`  Ignorés   : ${skipped} (déjà présents / email vide)`);
  console.log(`  Erreurs   : ${errors}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("❌ Erreur fatale :", err.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
