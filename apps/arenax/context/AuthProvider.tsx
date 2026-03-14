"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
} from "react";
import {
    getAuthStateSSR,
    getTokenExpiration,
} from "@/lib/auth";
import { BACKEND_URL } from "@/config/index";
import axios from "axios";

interface AuthContextType {
    user: any;
    accessToken: string | null;
    logout: () => Promise<void>;
    loading: boolean;
    login: (userData: any, token: string) => void;
    authReady: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {

    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [authReady, setAuthReady] = useState(false);

    const clearAuth = () => {
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        console.log("Auth Reset!");
    };

    const logout = async () => {
        try {
            await axios.post(`${BACKEND_URL}/user/signout`, {}, {
                withCredentials: true,
            });
        } catch (error) {
            console.log("Failed to logout - backend:", error);
        }

        console.log("Clearing frontend auth state");
        clearAuth();
    };

    const scheduleTokenRefresh = async (token: string) => {
        const exp = getTokenExpiration(token);
        if (exp === null) return;

        const now = Date.now();
        const delay = exp - now - 5000;

        if (delay > 0) {
            setTimeout(async () => {
                try {
                    const data = await getAuthStateSSR();
                    if (data) {
                        setAccessToken(data.accessToken);
                        setUser(data.user);
                        localStorage.setItem("token", data.accessToken);
                    } else {
                        clearAuth();
                    }
                } catch (err) {
                    console.error("Token refresh error:", err);
                    clearAuth();
                }
            }, delay);
        }
    };

    const initAuth = async () => {
        setLoading(true);
        try {
            const data = await getAuthStateSSR();

            if (data) {
                setAccessToken(data.accessToken);
                localStorage.setItem("token", data.accessToken);

                const localData = localStorage.getItem("user");
                setUser(localData ? JSON.parse(localData) : data.user);

                scheduleTokenRefresh(data.accessToken);
            } else {
                clearAuth();
            }

        } catch (error) {
            console.log("Auth init Error:", error);
            clearAuth();
        } finally {
            setLoading(false);
            setAuthReady(true);
        }
    };

    const login = (userData: any, token: string) => {
        setAccessToken(token);
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", token);
        scheduleTokenRefresh(token);
    };

    useEffect(() => {
        initAuth();
    }, []);

    const value: AuthContextType = {
        user,
        accessToken,
        logout,
        loading,
        login,
        authReady
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[var(--text-primary)] font-mono animate-pulse uppercase tracking-[2px] text-xs">ArenaX Initializing</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
