import { NextFunction, Request, Response } from "express";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const baseLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
    };

    if (res.statusCode >= 400) {
      console.error(
        JSON.stringify({
          ...baseLog,
          error:
            res.locals.errorPayload ??
            ({
              timestamp: baseLog.timestamp,
              path: req.originalUrl,
              status: res.statusCode,
              code: "UNKNOWN_ERROR",
              message: "Request failed",
            } as const),
        }),
      );
      return;
    }

    console.log(JSON.stringify(baseLog));
  });

  next();
};
