

import { BadRequestException, Injectable,NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { TokenService } from "../services/token.service";
import { TokenEnum } from "../enums";
import { IAuthRequest } from "../interfaces/token.interface";


export const PreAuth= async (req:Request,res:Response,next:NextFunction)=>{
        if(!(req.headers.authorization?.split(' ')?.length==2)){
            throw new BadRequestException("Missing authorization key")
        }
        next()
    }


