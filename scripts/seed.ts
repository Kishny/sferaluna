// scripts/seed.ts
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

async function seed() {
  try {
    await connectDB();

    const existingUser = await User.findOne({ email: "volcy9794@gmail.com" });
    if (existingUser) {
      console.log("✅ Utilisateur déjà existant :", existingUser.email);
      return;
    }

    const newUser = await User.create({
      email: "volcy9794@gmail.com",
      pseudonyme: "JeanV",
      password: "123456", // ⚠️ temporaire, pas hashé !
      consentement: true,
    });

    console.log("🎉 Utilisateur créé avec succès :", newUser.email);
  } catch (error) {
    console.error("❌ Erreur lors du seed :", error);
  }
}

seed();