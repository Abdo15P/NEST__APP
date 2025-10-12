import { BadRequestException, ConflictException, Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { FlattenMaps, HydratedDocument, Model } from "mongoose"
import { generateHash, IUser, SecuirtyService } from "src/common"
import { User, UserDocument } from "src/DB/model"
import { SignupBodyDto } from "./dto/signup.dto"
import { UserRepository } from "src/DB"



@Injectable()
export class AuthenticationService{
    private users:IUser[]=[]
    constructor( private readonly userRepository: UserRepository,private readonly securityService: SecuirtyService){}

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
        return 'Done'
    }
}