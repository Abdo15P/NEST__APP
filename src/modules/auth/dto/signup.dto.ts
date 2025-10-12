
import {  IsEmail, IsNotEmpty, IsString, IsStrongPassword, Length, MinLength, ValidateIf } from "class-validator";
import { IsMatch } from "src/common";

export class LoginBodyDto{
     @IsEmail()
    email:string;

    @IsStrongPassword()
    password:string;
}

export class SignupBodyDto extends LoginBodyDto{
    @Length(2,52,{message:"username min length is 2 and max is 52"})
    @IsNotEmpty()
    @IsString()
    username:string;

    @ValidateIf((data:SignupBodyDto)=>{
        return Boolean(data.password)
    })
    @IsMatch<string>(['password'],{

    })
    confirmPassword:string;
}

export class SignupQueryDto{
    @MinLength(2)
    @IsString()
    flag:string
}

