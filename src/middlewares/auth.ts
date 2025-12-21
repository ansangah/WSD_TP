import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db";
import { createError } from "../utils/errors";
import { verifyAccessToken } from "../utils/jwt";
import { isTokenBlacklisted } from "../modules/auth/token.service";

const extractBearerToken = (header?: string): string | undefined => {
  if (!header) {
    return undefined;
  }
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return undefined;
  }
  return token;
};

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const rawToken = extractBearerToken(req.headers.authorization);
    if (!rawToken) {
      throw createError("Authorization header missing", {
        statusCode: 401,
        code: "UNAUTHORIZED",
      });
    }

    const isBlacklisted = await isTokenBlacklisted(rawToken);
    if (isBlacklisted) {
      throw createError("Token has been revoked", {
        statusCode: 401,
        code: "TOKEN_REVOKED",
      });
    }

    const payload = verifyAccessToken(rawToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.status !== "ACTIVE") {
      throw createError("User is not authorized", {
        statusCode: 401,
        code: "UNAUTHORIZED",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
