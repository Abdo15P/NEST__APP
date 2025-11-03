import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { setDefaultLanguage } from './common';
import { LoggingInterceptor } from './common/interceptors';
import path from 'node:path';
import * as express  from 'express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors()
  app.use("/order/webhook",express.raw({type:'application/json'}))
  app.use("/uploads",express.static(path.resolve("./uploads")))
  app.useGlobalPipes(
    new ValidationPipe({stopAtFirstError:true,whitelist:true,forbidNonWhitelisted:true})
  )
  app.use(setDefaultLanguage)
  app.useGlobalInterceptors(new LoggingInterceptor())
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
