"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";
import { api } from "@/lib/api";

interface AuthProviderProps {
    children: React.ReactNode;
}

function TokenSync({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            const accessToken = (session.user as any).accessToken;
            
            if (accessToken) {
                api.setAccessToken(accessToken);
            }
        } else if (status === "unauthenticated") {
            api.setAccessToken(null);
        }
    }, [session, status]);

    return <>{children}</>;
}

export function AuthProvider({ children }: AuthProviderProps) {
    return (
        <SessionProvider>
            <TokenSync>{children}</TokenSync>
        </SessionProvider>
    );
}
