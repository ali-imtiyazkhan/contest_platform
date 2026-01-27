import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { BACKEND_URL } from "@/config";
import axios from "axios";

type JwtPayload = {
  userId: string;
  email?: string;
  role?: "User" | "Admin";
  exp?: number;
};

type SessionUser = {
  id: string;
  email?: string;
  role?: "User" | "Admin";
  isAdmin: boolean;
};


export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    if (!token) return null;

    const decoded = jwtDecode<JwtPayload>(token);

    if (!decoded?.userId) return null;

    return {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      isAdmin: decoded.role === "Admin",
    };
  } catch (error) {
    console.error("getSessionUser error:", error);
    return null;
  }
}

/**
 * ✅ Refresh token using backend (SSR)
 */
export const getAuthStateSSR = async () => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/v1/user/refresh`,
      {},
      {
        withCredentials: true,
      },
    );

    if (response.status === 200) {
      return {
        accessToken: response.data.accessToken,
        user: response.data.user,
      };
    }
  } catch (error) {
    console.log("getAuthStateSSR Error:", error);
    return null;
  }
};

/**
 * ✅ Extract token expiration
 */
export const getTokenExpiration = (token: string) => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch (error) {
    console.log("getTokenExpiration Error:", error);
    return null;
  }
};
