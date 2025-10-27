import { DeleteObjectCommand, DeleteObjectCommandOutput, DeleteObjectsCommand, GetObjectCommand, GetObjectCommandOutput, ListObjectsV2Command, ObjectCannedACL, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { BadRequestException, Injectable } from "@nestjs/common"
import { StorageEnum } from "../enums"
import { Upload } from "@aws-sdk/lib-storage"
import { randomUUID } from "crypto"
import { createReadStream } from "fs"



@Injectable()
export class S3Service{
    private s3Client: S3Client
    constructor(){
        this.s3Client= new S3Client({
            region: process.env.AWS_REGION as string,
            credentials:{
                accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
            }
        })
    }

     uploadFile=async({
    storageApproach= StorageEnum.memory,
    Bucket=process.env.AWS_BUCKET_NAME as string,
    ACL="private",
    path="general",
    file
}:{
    storageApproach?: StorageEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    path?: string;
    file: Express.Multer.File
}): Promise<string> =>{
    const command = new PutObjectCommand({
        Bucket,
        ACL,
        Key:`${process.env.APPLICATION_NAME}/${path}/${randomUUID()}_${file.originalname}`,
        Body: storageApproach===StorageEnum.memory? file.buffer: createReadStream(file.path),
        ContentType:file.mimetype,
    })

    await this.s3Client.send(command)

    if(!command?.input?.Key){
        throw new BadRequestException("Failed to generate uplaod key")
    }
    return command.input.Key
}


uploadLargeFile=async({
    storageApproach= StorageEnum.disk,
    Bucket=process.env.AWS_BUCKET_NAME,
    ACL="private",
    path="general",
    file
}:{
    storageApproach?: StorageEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    path?: string;
    file: Express.Multer.File
}):Promise<string> =>{
    const upload = new Upload({
        client:this.s3Client,
        params:{
        Bucket,
        ACL,
        Key:`${process.env.APPLICATION_NAME}/${path}/${randomUUID()}_${file.originalname}`,
        Body: storageApproach===StorageEnum.memory? file.buffer: createReadStream(file.path),
        ContentType:file.mimetype,

        },
        
    })

    upload.on("httpUploadProgress",(progress)=>{
        console.log("Upload file progres is :",progress)
    })
    const {Key}= await upload.done()
    if(!Key){
        throw new BadRequestException("Failed to generate uplaod key")
    }
    return Key
}

 uploadFiles=async({
    storageApproach= StorageEnum.memory,
    Bucket=process.env.AWS_BUCKET_NAME as string,
    ACL="private",
    path="general",
    files,
    useLarge=false
}:{
    storageApproach?: StorageEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    path?: string;
    files: Express.Multer.File[];
    useLarge?:boolean;
}):Promise<string[]> =>{
    
    let urls: string []=[]


    if (useLarge){
         urls= await Promise.all(files.map((file)=>{
        return this.uploadLargeFile({
            file,
            path,
            ACL,
            Bucket,
            storageApproach,
        })
    }))

    }else {
         urls= await Promise.all(files.map((file)=>{
        return this.uploadFile({
            file,
            path,
            ACL,
            Bucket,
            storageApproach,
        })
    }))

    }
   
    // for (const file of files){
    //     const key = await uploadFile({
    //         file,
    //         path,
    //         ACL,
    //         Bucket,
    //         storageApproach,
    //     })
    //     urls.push(key)
    // }
    return urls
}

 createPreSignedUploadLink= async({

    Bucket= process.env.AWS_BUCKET_NAME as string,
    path="general",
    expiresIn=Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS),
    ContentType,
    originalname,
}:{
    Bucket?:string;
    path?: string;
    expiresIn?: number
    originalname: string;
    ContentType: string
}):Promise<{url: string,key: string}>=>{
    const command = new PutObjectCommand({
        Bucket,
        Key:`${process.env.APPLICATION_NAME}/${path}/${randomUUID()}_${originalname}`,
        ContentType,
    })
    const url = await getSignedUrl(this.s3Client,command,{expiresIn})
    if(!url || ! command?.input?.Key){
        throw new BadRequestException("Failed to create pre signed url")
    }
    return {url,key:command.input.Key}
}

createGetPreSignedLink= async({

    Bucket= process.env.AWS_BUCKET_NAME as string,
    Key,
    expiresIn=Number(process.env.AWS_PRE_SIGNED_URL_EXPIRES_IN_SECONDS),
    downloadName="dummy",
    download="false"
   
}:{
    Bucket?:string;
    Key: string;
    expiresIn?: number;
    downloadName?:string;
    download?:string
    
}):Promise<string>=>{
    const command = new GetObjectCommand({
        Bucket,
        Key,
        ResponseContentDisposition:download==="true"? `attachment; filename="${downloadName || Key.split("/").pop()}"`: undefined
    })
    const url = await getSignedUrl(this.s3Client,command,{expiresIn})
    if(!url ){
        throw new BadRequestException("Failed to create pre signed url")
    }
    return url
}


 getFile= async({
    Bucket,
    Key
}:{
    Bucket?:string;
    Key: string
}):Promise<GetObjectCommandOutput>=>{
    const command = new GetObjectCommand({
        Bucket,
        Key
    })
    return await this.s3Client.send(command)
}
    
deleteFile= async({
    Bucket=process.env.AWS_BUCKET_NAME as string,
    Key
}:{
    Bucket?: string;
    Key: string;
}):Promise<DeleteObjectCommandOutput>=>{
    const command = new DeleteObjectCommand({
        Bucket,
        Key
    })
    return await this.s3Client.send(command)
}

 deleteFiles= async({
    Bucket=process.env.AWS_BUCKET_NAME as string,
    urls,
    Quiet= false
}:{
    Bucket?: string;
    urls: string[];
    Quiet?: boolean
}):Promise<DeleteObjectCommandOutput>=>{
    const Objects= urls.map((url)=>{
        return {Key:url}
    })
    const command= new DeleteObjectsCommand({
        Bucket,
        Delete:{
            Objects,
            Quiet
        }
    })

    return await this.s3Client.send(command)
}

listDirectoryFiles= async({
    Bucket=process.env.AWS_BUCKET_NAME as string,
    path
}:{
    Bucket?: string;
    path: string
})=>{
    const command = new ListObjectsV2Command({
        Bucket,
        Prefix:`${process.env.APPLICATION_NAME}/${path}`
    })

    return await this.s3Client.send(command)
}

deleteFoldersByPrefix= async({
    Bucket=process.env.AWS_BUCKET_NAME as string,
    path,
    Quiet=false
}:{
    Bucket?: string;
    path: string;
    Quiet?:boolean
}):Promise<DeleteObjectCommandOutput>=>{
    const fileList= await this.listDirectoryFiles({Bucket,path})
    if(!fileList?.Contents?.length){
        throw new BadRequestException("Empty Directory")
    }
    const urls: string[]= fileList.Contents.map((file)=>{
        return file.Key as string
    })
    return await this.deleteFiles({urls,Bucket,Quiet})
}
}