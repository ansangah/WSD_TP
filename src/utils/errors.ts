export type ErrorDetails = Record<string, unknown> | string[] | null;

export interface FormattedError {
  timestamp: string;
  path: string;
  status: number;
  code: string;
  message: string;
  details?: ErrorDetails;
}

export interface AppErrorOptions {
  statusCode?: number;
  code?: string;
  details?: ErrorDetails;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: ErrorDetails;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? "INTERNAL_ERROR";
    this.details = options.details;
  }
}

export const createError = (
  message: string,
  options?: AppErrorOptions,
): AppError => {
  return new AppError(message, options);
};

export const formatErrorResponse = (
  err: AppError | Error,
  path: string,
): FormattedError => {
  const appError =
    err instanceof AppError
      ? err
      : new AppError(err.message ?? "Internal server error");

  return {
    timestamp: new Date().toISOString(),
    path,
    status: appError.statusCode,
    code: appError.code,
    message: appError.message,
    details: appError.details,
  };
};

export const isAppError = (err: unknown): err is AppError => {
  return err instanceof AppError;
};
