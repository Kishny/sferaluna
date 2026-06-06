// src/lib/auth.ts
// Helper serveur pour récupérer la session NextAuth.
// Utilise authOptions depuis la route NextAuth officielle.

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export { authOptions };
