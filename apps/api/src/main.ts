import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { getEnv } from "@ultimate-leads/config";

async function bootstrap() {
  const env = getEnv();

  const app = await NestFactory.create(AppModule, {
    logger: env.NODE_ENV === "production" ? ["error", "warn", "log"] : ["debug", "info", "warn", "error"],
  });

  app.enableCors({
    origin: env.NODE_ENV === "production" ? true : ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("Ultimate Lead Engine API")
    .setDescription("Business data intelligence and lead generation platform API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const port = env.API_PORT;
  await app.listen(port, "0.0.0.0");

  console.log(`API server running on http://0.0.0.0:${port} (Swagger: http://0.0.0.0:${port}/api)`);
}

void bootstrap();
