import { Body, Controller,Post,Query,UsePipes,ValidationPipe } from "@nestjs/common"
import { AuthenticationService } from "./auth.service"
import { LoginBodyDto, SignupBodyDto, SignupQueryDto } from "./dto/signup.dto"

@UsePipes(new ValidationPipe({stopAtFirstError:true,whitelist:true,forbidNonWhitelisted:true}))
@Controller('auth')
export class AuthenticationController{
    constructor(private readonly authenticationService:AuthenticationService){}
    
    @Post('signup')
    async signup(@Body() body:SignupBodyDto,):Promise<{message:string}>{
        await this.authenticationService.signup(body)
        return {message:'done'}
    }

    @Post('login')
    login(
        @Body() body:LoginBodyDto
    ){
        return 'login page'
    }
}