import { Global, Module } from '@nestjs/common'


import {  TokenModel, TokenRepository, UserModel, UserRepository } from 'src/DB'

import { JwtService } from '@nestjs/jwt'
import { TokenService } from 'src/common/services/token.service'

@Global()
@Module({
    imports:[UserModel,TokenModel],
    exports:[UserRepository,JwtService,TokenService,TokenRepository,UserModel,TokenModel],
    providers:[UserRepository,JwtService,TokenService,TokenRepository],
    controllers:[]
})
export class SharedAuthenticationModule{}