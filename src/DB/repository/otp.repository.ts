import { Injectable } from "@nestjs/common";
import { DatabaseRepository } from "./database.repository";
import { Otp, OtpDocument as TDocument, User } from "../model";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
@Injectable()
export class OtpRepository extends DatabaseRepository<Otp>{
    constructor(@InjectModel(User.name) protected override readonly model:Model<TDocument>){
        super(model)
    }
}