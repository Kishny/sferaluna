"use client";

import { SessionProvider } from "next-auth/react";
import { MotionConfig } from "framer-motion";
import NavTracker from "@/components/NavTracker";

export default function ClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <NavTracker />
            {/* « user » : les animations de déplacement sont coupées si l'appareil demande moins d'animations. */}
            <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </SessionProvider>
    );
}
