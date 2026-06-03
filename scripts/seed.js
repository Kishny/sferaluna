import mongoose from "mongoose";
import { config } from "dotenv";
import { User } from "../src/models/User.js"; // <-- utilise .js si ton fichier est compilé

config(); // charge .env

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI non défini");

  await mongoose.connect(uri);
  console.log("✅ Connecté à la base MongoDB");

  await User.deleteMany();
  console.log("🧹 Utilisateurs supprimés");

  const user = await User.create({
    email: "test@sferaluna.dev",
    pseudonyme: "LunaTest",
    password: "123456",
    age: 30,
    orientation: "Pan",
    intentions: ["Sérieuse", "Découverte"],
    localisation: "Paris",
    rayon: "50km",
    question: "Ta couleur préférée ?",
    reponse: "Bleu",
    interets: ["Lecture", "Voyage", "Yoga"],
    visibilite: "publique",
    consentement: true,
    hasCompletedProfile: true,
  });

  console.log("✅ Utilisateur ajouté :", user.email);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erreur dans le seed :", err);
  process.exit(1);
});
