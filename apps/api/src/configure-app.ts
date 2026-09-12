import { INestApplication, ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

export function configureApp(app: INestApplication) {
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
  const adminUrl = process.env.ADMIN_URL ?? "http://localhost:3002";
  app.enableCors({ origin: [webUrl, adminUrl], credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  return app;
}
