import { Body, Controller,Patch,Post,Query,UsePipes,ValidationPipe } from "@nestjs/common"
import { AuthenticationService } from "./auth.service"
import { ConfirmEmailDto, LoginBodyDto, ResendConfirmEmailDto, SignupBodyDto, SignupQueryDto } from "./dto/auth.dto"
import { LoginCredentialsResponse } from "src/common"
import { LoginResponse } from "./entities/auth.entity"

@UsePipes(new ValidationPipe({stopAtFirstError:true,whitelist:true,forbidNonWhitelisted:true}))
@Controller('auth')
export class AuthenticationController{
    constructor(private readonly authenticationService:AuthenticationService){}
    
    @Post('signup')
    async signup(@Body() body:SignupBodyDto,):Promise<{message:string}>{
        await this.authenticationService.signup(body)
        return {message:'done'}
    }

    @Post('resend-confirm-email')
    async resendConfirmEmail(@Body() body:ResendConfirmEmailDto,):Promise<{message:string}>{
        await this.authenticationService.resendConfirmEmail(body)
        return {message:'done'}
    }

    @Patch('confirm-email')
    async confirmEmail(@Body() body:ConfirmEmailDto,):Promise<{message:string}>{
        await this.authenticationService.confirmEmail(body)
        return {message:'done'}
    }

    @Post('login')
    async login(
        @Body() body:LoginBodyDto
    ):Promise<LoginResponse>{
        const credentials= await this.authenticationService.login(body)
        return {message:'Done',data:{credentials}}
    }
}