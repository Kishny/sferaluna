// middleware.js
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/mon-compte",
    "/mon-compte/:path*",
    "/explorer",
    "/matches",
    "/messages/:path*",
    "/circle",
    "/mode-fantome",
    "/inscription",
    "/paiement",
    "/vibesphere",
    "/vibementor",
    "/vibeplanner",
    "/admin",
    "/admin/:path*",
  ],
};
