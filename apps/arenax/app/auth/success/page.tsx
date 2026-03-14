"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { BACKEND_URL } from "@/config";
import axios from "axios";

export default function AuthSuccess() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const handleAuth = async () => {
            const token = searchParams.get("token");

            if (token) {
                try {
                    // Fetch user profile to complete the login
                    const res = await axios.get(`${BACKEND_URL}/user/profile`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    if (res.data.ok) {
                        login(res.data.data, token);
                        router.push("/dashboard");
                    } else {
                        router.push("/signin?error=auth_failed");
                    }
                } catch (error) {
                    console.error("Auth success error:", error);
                    router.push("/signin?error=auth_failed");
                }
            } else {
                router.push("/signin");
            }
        };

        handleAuth();
    }, [searchParams, login, router]);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[var(--text-primary)] font-mono animate-pulse">Authenticating...</p>
            </div>
        </div>
    );
}
