import type { IMulterFile } from './../../interfaces/multer.interface';
import { diskStorage } from "multer"
import { randomUUID } from "node:crypto"
import type { Request } from "express"
import path from "node:path"
import { existsSync, mkdirSync } from "node:fs"
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const localFileUpload=({folder='public',validation=[],fileSize=2}:{folder?:string,validation:string[],fileSize?:number}):MulterOptions=>{
    let basePath=`uploads/${folder}`
    return {
        storage: diskStorage({destination(req: Request,file:Express.Multer.File,callback: Function){
            const fullPath=path.resolve(`./${basePath}`)
            if(!existsSync(fullPath)){
                mkdirSync(fullPath,{recursive:true})
            }
            
            
            callback(null,'./uploads')
        },
        filename(req: Request,file:IMulterFile, callback:Function){
            const fileName= randomUUID()+'_'+Date.now()+'_'+ file.originalname
            file.finalPath=basePath+`/${fileName}`
            callback(null, fileName)
        }


        }),
        fileFilter(req:Request,file:Express.Multer.File,callback:Function){
            if(validation.includes(file.mimetype)){
                return callback(null,true)
            }
            return callback(new BadRequestException('Invalid file format'))
        },
        limits:{
            fileSize:fileSize*1024*1024
        }
    }
}