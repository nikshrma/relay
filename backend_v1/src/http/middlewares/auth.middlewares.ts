import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export default function authMiddleware(req: Request,res: Response,next: NextFunction) {
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).json({
            message: "No token provided",
        });
    }
    const JWT_SECRET = process.env.JWT_PASS;
    if (!JWT_SECRET) {
        throw new Error("JWT_PASS is not defined");
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (typeof decoded === "string" || !("id" in decoded)) {
            return res.status(401).json({
                message: "Invalid token",
            });
        }

        req.id = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid token",
        });
    }
}