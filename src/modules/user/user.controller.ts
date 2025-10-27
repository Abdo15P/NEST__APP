import { StorageEnum } from './../../common/enums/multer.enum';

import { Controller, Get, Headers, MaxFileSizeValidator, ParseFilePipe, Patch, Req, SetMetadata, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { UserService } from "./user.service";
import { Auth, RoleEnum, successResponse, TokenEnum, User } from "src/common";
import type {  IResponse } from "src/common";

import { AuthenticationGuard } from "src/common/guards/authentication/authentication.guard";
import type { UserDocument } from "src/DB";
import { PreferredLanguageInterceptor } from "src/common/interceptors";
import {  FileInterceptor, } from "@nestjs/platform-express";
import { cloudFileUpload, fileValidation } from "src/common/utils/multer";

import { ProfileResponse } from './entities/user.entity';


@SetMetadata("tokenType",TokenEnum.access)
@UseGuards(AuthenticationGuard)
@Controller('user')
export class UserController{
    constructor(private readonly userService:UserService){}

    // @Get()
    // allUsers():{message:string; data:{users:IUser[]}}{
    //     const users:IUser[]= this.userService.allUsers()
    //     return {message:'Done', data:{users}}
    // }


    @UseInterceptors(PreferredLanguageInterceptor)
    @Auth([RoleEnum.admin,RoleEnum.user])
    @Get()
    profile(
        @Headers() header:any,
        @User() user:UserDocument):{message:string}{
        
        return {message:'Done'}
    }

    @UseInterceptors(FileInterceptor('profileImage',cloudFileUpload({storageApproach:StorageEnum.disk,validation:fileValidation.image,fileSize:2})))
    @Auth([RoleEnum.user])
    @Patch("profile-image")
    async profileImage(
        @User() user:UserDocument,
        @UploadedFile(
        new ParseFilePipe({
            validators:[new MaxFileSizeValidator({maxSize:2*1024*1024})],
            fileIsRequired:false})
    ) file:Express.Multer.File):Promise<IResponse<ProfileResponse>>{
        const profile =await this.userService.profileImage(file,user)
        return successResponse<ProfileResponse>({data:{profile}})
    }

    // @UseInterceptors(FilesInterceptor('coverImage',2,localFileUpload({folder:"User",validation:fileValidation.image,fileSize:2})))
    // @Auth([RoleEnum.user])
    // @Patch("cover-image")
    // coverImage(@UploadedFiles(
    //     new ParseFilePipe({
    //         validators:[new MaxFileSizeValidator({maxSize:2*1024*1024})],
    //         fileIsRequired:false})
    // ) files:Array<IMulterFile>){
    //     return {message:'Done',files}
    // }

    // @UseInterceptors(FileFieldsInterceptor([
    //     { name:'profileImage',maxCount:1},
    // {name:'coverImage',maxCount:2}],localFileUpload({folder:"User",validation:fileValidation.image,fileSize:2})))
    // @Auth([RoleEnum.user])
    // @Patch("image")
    // image(@UploadedFiles(
    //     new ParseFilePipe({
    //         validators:[new MaxFileSizeValidator({maxSize:2*1024*1024})],
    //         fileIsRequired:false})
    // ) files:{profileImage:Array<IMulterFile>; coverImage:Array<IMulterFile>}){
    //     return {message:'Done',files}
    // }
}