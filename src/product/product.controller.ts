import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, ParseFilePipe, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { cloudFileUpload, fileValidation } from 'src/common/utils/multer';
import { endpoint } from './product.authorization';
import { Auth, IResponse, StorageEnum, successResponse, User } from 'src/common';
import type { ProductDocument, UserDocument } from 'src/DB';
import { ProductResponse } from './entities/product.entity';


@UsePipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true}))
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseInterceptors(FilesInterceptor('attachments',5,cloudFileUpload({validation:fileValidation.image,storageApproach:StorageEnum.disk})))
  @Auth(endpoint.create)
  @Post()
  async create(
    @UploadedFiles(ParseFilePipe) files:Express.Multer.File[],
    @User() user:UserDocument,
    @Body() createProductDto: CreateProductDto):Promise<IResponse<ProductResponse>> {
    const product=await  this.productService.create(createProductDto,files,user);
      return successResponse<ProductResponse>({status:201,data:{product}})
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
}
