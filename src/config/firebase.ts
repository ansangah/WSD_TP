import admin from "firebase-admin";
import { env } from "./env";

let firebaseApp: admin.app.App | null = null;

const getFirebaseApp = (): admin.app.App => {
  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });

  return firebaseApp;
};

export const getFirebaseAuth = (): admin.auth.Auth => {
  return getFirebaseApp().auth();
};
