import { FormattedError } from "../../utils/errors";

declare global {
  namespace Express {
    interface UserPayload {
      id: number;
      email: string;
      role: string;
    }

    interface Request {
      user?: UserPayload;
    }

    interface Locals {
      errorPayload?: FormattedError;
    }
  }
}

export {};
