import { NextFunction, Request, Response, RequestHandler } from "express";
import { getFirebaseAuth } from "../config/firebase";
import { findOrCreateUserByFirebase } from "../modules/auth/firebase-auth.service";

const extractBearerToken = (header?: string): string | null => {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
};

export const verifyFirebaseToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ success: false, message: "Missing bearer token" });
    return;
  }

  try {
    const decoded = await getFirebaseAuth().verifyIdToken(token, true);
    req.firebaseUser = decoded;
    next();
  } catch (error: unknown) {
    const code =
      typeof error === "object" && error && "code" in error
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any).code
        : undefined;

    const revokedCodes = ["auth/id-token-revoked", "auth/session-cookie-revoked"];
    const statusCode = revokedCodes.includes(code ?? "") ? 403 : 401;

    const message =
      code === "auth/id-token-expired" ? "Firebase token expired" : "Invalid Firebase token";

    res.status(statusCode).json({ success: false, message });
  }
};

export const attachUserFromFirebase: RequestHandler = async (
  req,
  res,
  next,
) => {
  if (!req.firebaseUser) {
    res.status(401).json({ success: false, message: "Unauthenticated" });
    return;
  }

  try {
    const user = await findOrCreateUserByFirebase({
      uid: req.firebaseUser.uid,
      email: req.firebaseUser.email,
      name: req.firebaseUser.name,
    });

    req.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth: RequestHandler[] = [
  verifyFirebaseToken,
  attachUserFromFirebase,
];
