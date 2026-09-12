import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { ErrorCode } from "../errors/app-error";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const isProd = process.env.NODE_ENV === "production";

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      if (
        typeof payload === "object" &&
        payload &&
        "error" in payload &&
        typeof (payload as { error: unknown }).error === "object"
      ) {
        response.status(status).json(payload);
        return;
      }

      const message =
        typeof payload === "string"
          ? payload
          : ((payload as { message?: string | string[] }).message ?? "Erro na requisição");

      response.status(status).json({
        error: {
          code: status === HttpStatus.UNAUTHORIZED ? ErrorCode.UNAUTHORIZED : ErrorCode.VALIDATION_ERROR,
          message: Array.isArray(message) ? message.join("; ") : message,
        },
      });
      return;
    }

    this.logger.error(exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro interno.",
        ...(isProd ? {} : { detail: exception instanceof Error ? exception.message : String(exception) }),
      },
    });
  }
}
