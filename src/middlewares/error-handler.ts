import { NextFunction, Request, Response } from "express";
import {
  AppError,
  formatErrorResponse,
  isAppError,
} from "../utils/errors";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const handledError =
    err instanceof Error
      ? err
      : new AppError("Internal server error");

  if (!isAppError(handledError)) {
    console.error(handledError);
  }

  const payload = formatErrorResponse(handledError, req.originalUrl);
  res.locals.errorPayload = payload;
  res.status(payload.status).json(payload);
};
