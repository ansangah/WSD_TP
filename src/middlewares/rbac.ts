import { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db";
import { createError } from "../utils/errors";

export const requireRole =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(
        createError("You do not have permission to perform this action", {
          statusCode: 403,
          code: "FORBIDDEN",
        }),
      );
      return;
    }
    next();
  };

export const requireAdmin = requireRole("ADMIN");

export const requireStudyLeader =
  (studyIdParam = "studyId") =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawStudyId =
        req.params[studyIdParam] ??
        (req.body ? req.body[studyIdParam] : undefined);

      const studyId = Number(rawStudyId);
      if (!req.user || !rawStudyId || Number.isNaN(studyId)) {
        throw createError("Study identifier is required", {
          statusCode: 400,
          code: "INVALID_STUDY",
        });
      }

      const study = await prisma.study.findFirst({
        where: {
          id: studyId,
          leaderId: req.user.id,
        },
      });

      if (!study) {
        throw createError(
          "Only study leaders can perform this action for the given study",
          {
            statusCode: 403,
            code: "FORBIDDEN",
          },
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
