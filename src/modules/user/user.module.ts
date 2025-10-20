import { UserService } from './user.service';
import { MiddlewareConsumer, Module } from "@nestjs/common";
import { UserController } from "./user.controller";
import { setDefaultLanguage } from 'src/common';
import { TokenService } from 'src/common/services/token.service';
import { TokenModel, TokenRepository, UserModel, UserRepository } from 'src/DB';
import { JwtService } from '@nestjs/jwt';
import { PreAuth } from 'src/common/middleware/authentication.middleware';
import { AuthenticationModule } from '../auth/auth.module';


@Module({
    imports:[],
    controllers:[UserController],
    providers:[UserService],
    exports:[],


})

export class UserModule{
    configure(consumer: MiddlewareConsumer){
        consumer.apply(PreAuth).forRoutes(UserController)
    }
}