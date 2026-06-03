// lib/auth.ts
import { getServerSession } from "next-auth";
import { authConfig } from "../../auth.config.backup";

export async function getAuthSession() {
  return await getServerSession(authConfig);
}
