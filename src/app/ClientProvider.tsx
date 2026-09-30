"use client";

import { SessionProvider } from "next-auth/react";
import NavTracker from "@/components/NavTracker";

export default function ClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <NavTracker />
            {children}
        </SessionProvider>
    );
}
