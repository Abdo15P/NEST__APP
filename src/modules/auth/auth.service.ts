import { JwtService } from '@nestjs/jwt';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { FlattenMaps, HydratedDocument, Model, Types } from "mongoose"
import { createNumericalOtp, emailEvent, generateHash, IUser, LoginCredentialsResponse, OtpEnum, ProviderEnum, SecuirtyService } from "src/common"
import { User, UserDocument } from "src/DB/model"
import { ConfirmEmailDto, LoginBodyDto, ResendConfirmEmailDto, SignupBodyDto } from "./dto/auth.dto"
import { OtpRepository, UserRepository } from "src/DB"
import { sign } from "jsonwebtoken"
import { TokenService } from 'src/common/services/token.service';




@Injectable()
export class AuthenticationService{
    private users:IUser[]=[]
    constructor( private readonly userRepository: UserRepository,
        private readonly securityService: SecuirtyService,
        private readonly otpRepository: OtpRepository,
        private readonly tokenService: TokenService
    ){}

    private async createConfirmEmailOtp(userId:Types.ObjectId){
        await this.otpRepository.create({
            data:[
                {
                    code:createNumericalOtp(),
                    expiredAt:new Date(Date.now()+2*60*1000),
                    createdBy:userId,
                    type: OtpEnum.ConfirmEmail
                }
            ]
        })
        
    }

    async signup(data:SignupBodyDto):Promise<string>{
        const {email,password,username}= data
        const checkUserExist= await this.userRepository.findOne({filter: {email}})
        if(checkUserExist){
            throw new ConflictException('Emails already exists')
        }
        const [user]= await this.userRepository.create({data: [{username,email,password}]})
        if(!user){
            throw new BadRequestException("failed to signup this account.Please try again later")
        }
        
        await this.createConfirmEmailOtp(user._id)
        return 'Done'
    }

    async resendConfirmEmail(data:ResendConfirmEmailDto):Promise<string>{
        const {email}= data
        const user= await this.userRepository.findOne({
            filter: {email,
                confirmedAt:{$exists:false}
            },
        options:{
            populate:[{path:'otp',match: {type:OtpEnum.ConfirmEmail}}]
        }})
        if(!user){
            throw new NotFoundException('Failed to find matching account')
        }
        if(user.otp?.length){
            throw new ConflictException(`Sorry we cannot grant you new OTP until the existing one is expired.Please try again after:${user.otp[0].expiredAt}`)
        }
        
        await this.createConfirmEmailOtp(user._id)
        return 'Done'
    }

    async confirmEmail(data:ConfirmEmailDto):Promise<string>{
        const {email,code}= data
        const user= await this.userRepository.findOne({
            filter: {email,
                confirmedAt:{$exists:false}
            },
        options:{
            populate:[{path:'otp',match: {type:OtpEnum.ConfirmEmail}}]
        }})
        if(!user){
            throw new NotFoundException('Failed to find matching account')
        }
        if(!(user.otp?.length && await this.securityService.compareHash(code,user.otp[0].code))){
            throw new BadRequestException("Invalid otp")
            
        }

        
        user.confirmedAt= new Date()
        await user.save()
        await this.otpRepository.deleteOne({filter:{_id:user.otp[0]._id}})
        return 'Done'
    }

    async login(data:LoginBodyDto):Promise<LoginCredentialsResponse>{
        const {email,password}= data
        const user= await this.userRepository.findOne({filter: {
            email,confirmedAt:{$exists:true},provider:ProviderEnum.SYSTEM}})
       
       
        if(!user){
            throw new NotFoundException("failed to find matching account")
        }
        if(!(await this.securityService.compareHash(password,user.password))){
            throw new NotFoundException("Failed to find matching account")
        }

        return await this.tokenService.createLoginCredentials(user as UserDocument)
    }
}