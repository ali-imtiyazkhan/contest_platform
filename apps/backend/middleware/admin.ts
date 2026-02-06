import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export async function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    console.log("auth header is :", authHeader);

    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    // Remove "Bearer "
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & {
      userId: string;
      role?: string;
    };

    if (!decoded.userId) {
      return res.status(403).json({ message: "Invalid token payload" });
    }

    req.userId = decoded.userId;

    console.log("DECODED TOKEN:", decoded);

    if (decoded.role === "Admin") {
      return next();
    }

    return res.status(403).json({
      message: "You are not an admin user",
    });
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}
