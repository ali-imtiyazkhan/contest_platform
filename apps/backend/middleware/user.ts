import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export function userMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization as string;
     console.log("auth token is this :", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    if (!token || token === "null" || token === "undefined") {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (decoded && decoded.userId) {
      req.userId = decoded.userId;
      next();
    } else {
      console.log("Token verification failed: userId missing in payload", decoded);
      res.status(403).json({
        message: "Incorrect token",
      });
    }
  } catch (e: any) {
    console.error("JWT Verification Error:", e.message || e);
    const status = e.name === "TokenExpiredError" ? 401 : 403;
    const message = e.name === "TokenExpiredError" ? "Token expired" : "Incorrect token";
    res.status(status).json({ message });
  }
}
