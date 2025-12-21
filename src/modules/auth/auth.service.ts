import { User } from "@prisma/client";
import { prisma } from "../../config/db";
import { createError } from "../../utils/errors";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import {
  persistRefreshSession,
  deleteRefreshSession,
  getRefreshSessionUser,
  blacklistToken,
} from "./token.service";
import { hashPassword, verifyPassword } from "../../utils/passwords";

export interface AuthResponse {
  user: SanitizedUser;
  accessToken: string;
  refreshToken: string;
}

export interface SanitizedUser {
  id: number;
  email: string;
  name: string;
  role: string;
  status: string;
  provider: string;
  providerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const sanitizeUser = (user: User): SanitizedUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  status: user.status,
  provider: user.provider,
  providerId: user.providerId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const issueTokens = async (user: User): Promise<AuthResponse> => {
  const accessToken = signAccessToken(user);
  const refresh = signRefreshToken(user);
  await persistRefreshSession(refresh.sessionId, user.id);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken: refresh.token,
  };
};

export const registerUser = async (
  email: string,
  password: string,
  name: string,
): Promise<AuthResponse> => {
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    throw createError("Email already registered", {
      statusCode: 409,
      code: "EMAIL_TAKEN",
    });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), passwordHash, name },
  });

  return issueTokens(user);
};

export const loginUser = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    throw createError("Invalid credentials", {
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  }

  if (user.status !== "ACTIVE") {
    throw createError("Account is not active", {
      statusCode: 403,
      code: "ACCOUNT_INACTIVE",
    });
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw createError("Invalid credentials", {
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  }

  return issueTokens(user);
};

export const refreshTokens = async (
  refreshToken: string,
): Promise<AuthResponse> => {
  const payload = verifyRefreshToken(refreshToken);
  const storedUserId = await getRefreshSessionUser(payload.sessionId);

  if (!storedUserId || storedUserId !== payload.sub) {
    throw createError("Refresh token is no longer valid", {
      statusCode: 401,
      code: "REFRESH_NOT_FOUND",
    });
  }

  await deleteRefreshSession(payload.sessionId);

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    throw createError("User not found", {
      statusCode: 404,
      code: "USER_NOT_FOUND",
    });
  }

  return issueTokens(user);
};

export const logoutUser = async (
  refreshToken: string,
  accessToken?: string,
): Promise<{ success: true }> => {
  const payload = verifyRefreshToken(refreshToken);
  await deleteRefreshSession(payload.sessionId);
  await blacklistToken(refreshToken, REFRESH_TOKEN_TTL_SECONDS);

  if (accessToken) {
    await blacklistToken(accessToken, ACCESS_TOKEN_TTL_SECONDS);
  }

  return { success: true };
};
