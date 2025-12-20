import type { DecodedIdToken } from "firebase-admin/auth";
import type { User } from "@prisma/client";

declare module "express-serve-static-core" {
  interface Request {
    firebaseUser?: DecodedIdToken;
    authUser?: User;
  }
}
