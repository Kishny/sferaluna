// src/lib/admin-auth.ts

import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

/**
 * Renvoie l'admin connectée ({ id, email }) ou null.
 * Le rôle est relu en base : on ne se fie pas à celui porté par la session.
 */
export async function getAdmin(): Promise<{ id: string; email: string } | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase().trim();
  if (!email) return null;

  await connectDB();

  const admin = await User.findOne({ email }).select("_id role email");
  if (!admin || admin.role !== "admin") return null;

  return { id: admin._id.toString(), email };
}
