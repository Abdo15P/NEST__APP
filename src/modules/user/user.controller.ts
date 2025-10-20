
import { Controller, Get, Headers, Req, SetMetadata, UseGuards, UseInterceptors } from "@nestjs/common";
import { UserService } from "./user.service";
import { Auth, IUser, RoleEnum, TokenEnum, User } from "src/common";
import type { Request } from "express";
import type { IAuthRequest } from "src/common/interfaces/token.interface";
import { AuthenticationGuard } from "src/common/guards/authentication/authentication.guard";
import type { UserDocument } from "src/DB";
import { PreferredLanguageInterceptor } from "src/common/interceptors";


@SetMetadata("tokenType",TokenEnum.access)
@UseGuards(AuthenticationGuard)
@Controller('user')
export class UserController{
    constructor(private readonly userService:UserService){}

    @Get()
    allUsers():{message:string; data:{users:IUser[]}}{
        const users:IUser[]= this.userService.allUsers()
        return {message:'Done', data:{users}}
    }


    @UseInterceptors(PreferredLanguageInterceptor)
    @Auth([RoleEnum.admin,RoleEnum.user])
    @Get()
    profile(
        @Headers() header:any,
        @User() user:UserDocument):{message:string}{
        
        return {message:'Done'}
    }
}