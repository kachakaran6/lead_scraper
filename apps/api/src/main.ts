import "reflect-metadata";
import * as dotenv from "dotenv";
import * as path from "path";
import * as express from "express";

// Load root and local .env files
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config();

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { getEnv } from "@ultimate-leads/config";

async function bootstrap() {
  const env = getEnv();

  const app = await NestFactory.create(AppModule, {
    logger:
      env.NODE_ENV === "production"
        ? ["error", "warn", "log"]
        : ["debug", "log", "warn", "error", "verbose"],
  });

  // Request body payload limits
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  // Security Headers Middleware
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Dynamic CORS configuration
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  const config = new DocumentBuilder()
    .setTitle("Lead Scrapper Production API")
    .setDescription("Enterprise Business Intelligence & Verified Lead Discovery API")
    .setVersion("2.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  try {
    const { execSync } = await import("child_process");
    console.log("[DB] Verifying database schema with prisma db push...");
    execSync("npx prisma db push --skip-generate --schema=./prisma/schema.prisma", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: env.DATABASE_URL },
    });
    console.log("[DB] Schema verification complete.");
  } catch (dbErr) {
    console.warn("[DB] Prisma schema push notice:", dbErr);
  }

  const port = env.API_PORT || 4000;
  await app.listen(port, "0.0.0.0");

  console.log(
    `[Lead Scrapper API] Running on http://0.0.0.0:${port} (Swagger docs: http://0.0.0.0:${port}/api)`
  );
}

void bootstrap();
