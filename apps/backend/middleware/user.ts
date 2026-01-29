import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export function userMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization as string;
    if (!authHeader) {
      return res.status(404).json({
        message: "token is invalid ",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (decoded.userId) {
      req.userId = decoded.userId;
      next();
    } else {
      res.status(403).json({
        message: "Incorrect token",
      });
    }
  } catch (e) {
    res.status(403).json({
      message: "Incorrect token",
    });
  }
}
