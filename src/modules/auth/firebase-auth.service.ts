import crypto from "crypto";
import { prisma } from "../../config/db";
import { getFirebaseAuth } from "../../config/firebase";
import { createError } from "../../utils/errors";

type FirebaseUserPayload = {
  uid: string;
  email?: string | null;
  name?: string | null;
};

/**
 * Firebase ID 토큰 기반 사용자 upsert + 로그인용 헬퍼.
 */
export const findOrCreateUserByFirebase = async ({
  uid,
  email,
  name,
}: FirebaseUserPayload) => {
  if (!email) {
    throw createError("Firebase user does not contain email", {
      statusCode: 400,
      code: "INVALID_GOOGLE_TOKEN",
    });
  }

  const displayName = name?.trim() || email.split("@")[0];
  const passwordHash = crypto
    .createHash("sha256")
    .update(`firebase:${uid}`)
    .digest("hex");

  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: displayName,
      passwordHash,
      provider: "FIREBASE",
      providerId: uid,
    },
  });
};

export const loginWithFirebaseIdToken = async (idToken: string) => {
  if (!idToken) {
    throw createError("idToken is required", {
      statusCode: 400,
      code: "INVALID_PAYLOAD",
    });
  }

  try {
    const auth = getFirebaseAuth();
    const decoded = await auth.verifyIdToken(idToken);
    return findOrCreateUserByFirebase({
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    });
  } catch (error) {
    throw createError("Invalid Firebase token", {
      statusCode: 401,
      code: "INVALID_GOOGLE_TOKEN",
    });
  }
};
