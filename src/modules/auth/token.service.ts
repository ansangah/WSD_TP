import { redis } from "../../config/redis";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from "../../utils/jwt";

const REFRESH_SESSION_PREFIX = "refresh_session:";
const TOKEN_BLACKLIST_PREFIX = "token_blacklist:";

const buildSessionKey = (sessionId: string): string =>
  `${REFRESH_SESSION_PREFIX}${sessionId}`;

const buildBlacklistKey = (token: string): string =>
  `${TOKEN_BLACKLIST_PREFIX}${token}`;

export const persistRefreshSession = async (
  sessionId: string,
  userId: number,
): Promise<void> => {
  await redis.set(buildSessionKey(sessionId), userId.toString(), {
    EX: REFRESH_TOKEN_TTL_SECONDS,
  });
};

export const getRefreshSessionUser = async (
  sessionId: string,
): Promise<number | null> => {
  const userId = await redis.get(buildSessionKey(sessionId));
  return userId ? Number(userId) : null;
};

export const deleteRefreshSession = async (
  sessionId: string,
): Promise<void> => {
  await redis.del(buildSessionKey(sessionId));
};

export const blacklistToken = async (
  token: string,
  ttlSeconds: number = ACCESS_TOKEN_TTL_SECONDS,
): Promise<void> => {
  if (!token) {
    return;
  }

  await redis.set(buildBlacklistKey(token), "1", {
    EX: ttlSeconds,
  });
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  if (!token) {
    return true;
  }

  const result = await redis.exists(buildBlacklistKey(token));
  return result === 1;
};
