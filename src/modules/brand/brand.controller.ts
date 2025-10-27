import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe, UsePipes, ValidationPipe, Query } from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { Auth, IResponse, successResponse,User } from 'src/common';
import type { BrandRepository, UserDocument } from 'src/DB';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudFileUpload, fileValidation } from 'src/common/utils/multer';
import { BrandResponse, GetAllResponse } from './entities/brand.entity';
import { endpoint } from './brand.authorization';
import { Types } from 'mongoose';
import { BrandParamsDto, GetAllDto, UpdateBrandDto } from './dto/update-brand.dto';
import { ValidationError } from 'class-validator';
//import { UpdateBrandDto } from './dto/update-brand.dto';

@UsePipes(new ValidationPipe({whitelist:true, forbidNonWhitelisted:true}))
@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @UseInterceptors(FileInterceptor("attahment",cloudFileUpload({validation:fileValidation.image})))
  @Auth(endpoint.create)
  @Post()
  async create(
    @User() user:UserDocument,
    @Body() createBrandDto: CreateBrandDto,
  @UploadedFile(ParseFilePipe) file:Express.Multer.File):Promise<IResponse<BrandResponse>> {
    const brand=await this.brandService.create(createBrandDto,file,user);
    return successResponse<BrandResponse>({status:201,data:{brand}})
  }

  @Auth(endpoint.create)
  @Patch(':brandId')
  async update(@Param() params:BrandParamsDto, @Body() updateBrandDto: UpdateBrandDto,@User() user:UserDocument):Promise<IResponse<BrandResponse>> {
    const brand= await this.brandService.update(params.brandId, updateBrandDto,user);
    return successResponse<BrandResponse>({data:{brand}})
  }

  @UseInterceptors(FileInterceptor("attachment",cloudFileUpload({validation:fileValidation.image})))
  @Auth(endpoint.create)
  @Patch(':brandId/attachment')
  async updateAttachment(@Param() params:BrandParamsDto,@UploadedFile(ParseFilePipe) file:Express.Multer.File, @Body() updateBrandDto: UpdateBrandDto,@User() user:UserDocument):Promise<IResponse<BrandResponse>> {
    const brand= await this.brandService.updateAttachment(params.brandId, file,user);
    return successResponse<BrandResponse>({data:{brand}})
  }

  @Auth(endpoint.create)
  @Delete(':brandId/freeze')
  async freeze(@Param() params:BrandParamsDto,@User() user:UserDocument):Promise<IResponse> {
    await this.brandService.freeze(params.brandId,user);
    return successResponse()
  }

  @Auth(endpoint.create)
  @Patch(':brandId/restore')
  async restore(@Param() params:BrandParamsDto,@User() user:UserDocument):Promise<IResponse<BrandResponse>> {
    const brand=await this.brandService.restore(params.brandId,user);
    return successResponse<BrandResponse>({data:{brand}})
  }

  @Auth(endpoint.create)
  @Delete(':brandId')
  async remove(@Param() params:BrandParamsDto,@User() user:UserDocument) {
    await  this.brandService.remove(params.brandId,user);
  return successResponse()
  }

  @Get()
  async findAll(@Query() query:GetAllDto):Promise<IResponse<GetAllResponse>> {
    const result= await  this.brandService.findAll(query);
    return successResponse<GetAllResponse>({data:{result}})
  }

  @Auth(endpoint.create)
  @Get('/archive')
  async findAllArchives(@Query() query:GetAllDto):Promise<IResponse<GetAllResponse>> {
    const result= await  this.brandService.findAll(query,true);
    return successResponse<GetAllResponse>({data:{result}})
  }

  @Get(':brandId')
  async findOne(@Param() params:BrandParamsDto) {
    const brand= await this.brandService.findOne(params.brandId);
    return successResponse<BrandResponse>({data:{brand}})
  }

  @Auth(endpoint.create)
  @Get(':brandId')
  async findOneArchive(@Param() params:BrandParamsDto) {
    const brand= await this.brandService.findOne(params.brandId,true);
    return successResponse<BrandResponse>({data:{brand}})
  }




}
