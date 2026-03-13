/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type ErrorRequestHandler,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import config from '../../config';
import ApiError from '../../errors/ApiError';
import handleValidationError from '../../errors/handleValidationError';
import handleClientError from '../../errors/handleClientError';
import handleZodError from '../../errors/handleZodError';
import { Prisma } from '../../generated/prisma/client';
import { ZodError } from 'zod';
import type { IApiErrorMessage } from '../../interface';

const globalErrorHandler: ErrorRequestHandler = (
  error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isProduction = config.env === 'production';

  if (!isProduction) {
    console.error(`globalErrorHandler ~~`, error);
  }

  let statusCode = 500;
  let message = 'Something went wrong!';
  let errorMessages: IApiErrorMessage[] = [];

  if (error instanceof Prisma.PrismaClientValidationError) {
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const simplifiedError = handleClientError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    message = 'An unexpected database error occurred';
    errorMessages = [{ path: '', message }];
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = 'Database connection failed';
    errorMessages = [{ path: '', message }];
  } else if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    errorMessages = error.message ? [{ path: '', message: error.message }] : [];
  } else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    errorMessages = [{ path: '', message }];
  } else if (error instanceof Error) {
    message = error.message;
    errorMessages = error.message ? [{ path: '', message: error.message }] : [];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: !isProduction ? error?.stack : undefined,
  });
};

export default globalErrorHandler;
