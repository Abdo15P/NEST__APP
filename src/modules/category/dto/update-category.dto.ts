
import { CreateCategoryDto } from './create-category.dto';

    
    import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Validate, validate } from "class-validator";
    import { Types } from "mongoose";
 
    import { PartialType } from "@nestjs/mapped-types";
    import { ContainField, MongoDBIds } from "src/common";
    import { Type } from "class-transformer";
    
    @ContainField()
    export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    
        @Validate(MongoDBIds)
        @IsOptional()
        removeBrands:Types.ObjectId[]
        
    }
    
    
    export class CategoryParamsDto{
        @IsMongoId()
        categoryId:Types.ObjectId
    }
    
    export class GetAllDto{
        @Type(()=>Number)
        @IsPositive()
        @IsNumber()
        @IsOptional()
        page:number
    
        @Type(()=>Number)
        @IsPositive()
        @IsNumber()
        @IsOptional()
        size:number
    
        @IsNotEmpty()
        @IsString()
        @IsOptional()
        search:string
    
}
