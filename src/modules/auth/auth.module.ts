import { Module } from '@nestjs/common'
import { AuthenticationController } from './auth.controller'
import { AuthenticationService } from './auth.service'
import { ConfigModule } from '@nestjs/config'
import { UserModel, UserRepository } from 'src/DB'
import { SecuirtyService } from 'src/common'


@Module({
    imports:[UserModel],
    exports:[],
    providers:[AuthenticationService,UserRepository],
    controllers:[AuthenticationController]
})
export class AuthenticationModule{}