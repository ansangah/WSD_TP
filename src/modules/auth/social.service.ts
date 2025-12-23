import { randomUUID } from "crypto";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../../config/db";
import { env } from "../../config/env";
import { getFirebaseAuth } from "../../config/firebase";
import { createError } from "../../utils/errors";
import { hashPassword } from "../../utils/passwords";
import { AuthResponse, issueTokens } from "./auth.service";

type SocialProvider = "GOOGLE" | "KAKAO" | "FIREBASE";

interface SocialProfile {
  provider: SocialProvider;
  providerId: string;
  email?: string;
  name?: string;
}

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const generatePlaceholderEmail = (
  provider: SocialProvider,
  providerId: string,
): string => {
  return `${provider.toLowerCase()}-${providerId}@gogostudy.local`;
};

const ensureSocialUser = async (
  profile: SocialProfile,
): Promise<AuthResponse> => {
  let user = await prisma.user.findFirst({
    where: {
      provider: profile.provider,
      providerId: profile.providerId,
    },
  });

  if (!user && profile.email) {
    user = await prisma.user.findUnique({
      where: { email: profile.email.toLowerCase() },
    });
  }

  if (!user) {
    const passwordHash = await hashPassword(randomUUID());
    user = await prisma.user.create({
      data: {
        email: (profile.email ?? generatePlaceholderEmail(profile.provider, profile.providerId)).toLowerCase(),
        name: profile.name ?? `${profile.provider} User`,
        passwordHash,
        provider: profile.provider,
        providerId: profile.providerId,
      },
    });
  } else if (!user.providerId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        provider: profile.provider,
        providerId: profile.providerId,
      },
    });
  }

  return issueTokens(user);
};

export const loginWithGoogle = async (idToken: string): Promise<AuthResponse> => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      throw new Error("Missing Google user information");
    }

    return ensureSocialUser({
      provider: "GOOGLE",
      providerId: payload.sub,
      email: payload.email ?? undefined,
      name: payload.name ?? payload.given_name ?? payload.family_name ?? undefined,
    });
  } catch (error) {
    throw createError("Invalid Google token", {
      statusCode: 401,
      code: "GOOGLE_AUTH_FAILED",
      details: [(error as Error).message],
    });
  }
};

export const loginWithFirebase = async (idToken: string): Promise<AuthResponse> => {
  try {
    const decoded = await getFirebaseAuth().verifyIdToken(idToken);
    if (!decoded || !decoded.uid) {
      throw new Error("Missing Firebase user identifier");
    }

    return ensureSocialUser({
      provider: "FIREBASE",
      providerId: decoded.uid,
      email: decoded.email ?? undefined,
      name: decoded.name ?? decoded.displayName ?? undefined,
    });
  } catch (error) {
    throw createError("Invalid Firebase token", {
      statusCode: 401,
      code: "FIREBASE_AUTH_FAILED",
      details: [(error as Error).message],
    });
  }
};

export const loginWithKakao = async (accessToken: string): Promise<AuthResponse> => {
  try {
    const response = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Kakao API responded with ${response.status}`);
    }

    const data = await response.json();
    const kakaoId = data.id?.toString();
    if (!kakaoId) {
      throw new Error("Kakao user id missing");
    }

    const email =
      data.kakao_account?.email ?? data.kakao_account?.profile?.email;
    const name =
      data.kakao_account?.profile?.nickname ??
      data.properties?.nickname ??
      undefined;

    return ensureSocialUser({
      provider: "KAKAO",
      providerId: kakaoId,
      email: email ?? undefined,
      name,
    });
  } catch (error) {
    throw createError("Invalid Kakao token", {
      statusCode: 401,
      code: "KAKAO_AUTH_FAILED",
      details: [(error as Error).message],
    });
  }
};
