import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  userId: string;
  email?: string;
  role?: "User" | "Admin";
};

export type SessionUser = {
  id: string;
  email: string;
  role?: "User" | "Admin";
  isAdmin: boolean;
};
export const SESSION_COOKIE = "accessToken";

/**
 * ✅ Destroy session by deleting cookie
 * Works only in Server Components / Route Handlers
 */
export async function destroySession() {
  const cookieStore = await cookies(); // ✅ no await
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) return null;

    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded?.userId) return null;

    return {
      id: decoded.userId,
      email: decoded.email ?? "unknown@email.com", // ✅ guarantee string
      role: decoded.role,
      isAdmin: decoded.role === "Admin",
    };
  } catch (error) {
    console.error("getSessionUser error:", error);
    return null;
  }
}
