import { SharedAuthenticationModule } from './../../common/modules/auth.module';
import { Module } from '@nestjs/common'
import { AuthenticationController } from './auth.controller'
import { AuthenticationService } from './auth.service'
import { ConfigModule } from '@nestjs/config'
import { OtpModel, OtpRepository, TokenModel, TokenRepository, UserModel, UserRepository } from 'src/DB'
import { SecuirtyService } from 'src/common'
import { JwtService } from '@nestjs/jwt'
import { TokenService } from 'src/common/services/token.service'


@Module({
    imports:[OtpModel],
    exports:[],
    providers:[AuthenticationService,OtpRepository,SecuirtyService],
    controllers:[AuthenticationController]
})
export class AuthenticationModule{}