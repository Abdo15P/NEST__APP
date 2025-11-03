import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductAttachmentDto, UpdateProductDto } from './dto/update-product.dto';
import { BrandRepository,  CategoryRepository, ProductDocument, ProductRepository, UserDocument, UserRepository } from 'src/DB';
import { FolderEnum, GetAllDto, S3Service } from 'src/common';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { Lean } from 'src/DB/repository/database.repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly categoryRepository:CategoryRepository,
    private readonly brandRepository:BrandRepository,
    private readonly productRepository:ProductRepository,
    private readonly userRepository:UserRepository,
    private readonly s3Service:S3Service
  ){}
  async create(createProductDto: CreateProductDto,files:Express.Multer.File[],user:UserDocument):Promise<ProductDocument> {
    
    const{name,description,discountPercent,originalPrice,stock}=createProductDto
    const category= await this.categoryRepository.findOne({filter:{_id:createProductDto.category}})
    if(!category){
      throw new NotFoundException("Failed to find matching category instance")
    }
   
    const brand= await this.brandRepository.findOne({filter:{_id:createProductDto.brand}})
    if(!brand){
      throw new NotFoundException("Failed to find matching brand instance")
    }
    

    let assetFolderId=randomUUID()
    
    const images=await this.s3Service.uploadFiles({files,path:`${FolderEnum.category}/${createProductDto.category}/${FolderEnum.product}/${assetFolderId}`})
    const [product]= await this.productRepository.create({
      data:[
        {
          category:category._id,
          brand:brand._id,
          name,
          description,
          discountPercent,
          originalPrice,
          salePrice:originalPrice-(originalPrice*(discountPercent/100)),
          stock,
          assetFolderId,
          images,
          createdBy:user._id
        }
      ]
    })
    if(!product){
        throw new BadRequestException("Failed to create this product instance")
    }
    
    return product
  }

  async update(productId: Types.ObjectId, updateProductDto: UpdateProductDto,user:UserDocument) {
    
    const product= await this.productRepository.findOne({filter:{_id:productId}})
    if(!product){
      throw new NotFoundException("Failed to find matching product instance") 
    }
    if(updateProductDto.category){
      const category= await this.categoryRepository.findOne({filter:{_id:updateProductDto.category}})
      if(!category){
      throw new NotFoundException("Failed to find matching category instance")
    }
    updateProductDto.category=category._id
    }
    
    if(updateProductDto.brand){
          const brand= await this.brandRepository.findOne({filter:{_id:updateProductDto.brand}})
    if(!brand){
      throw new NotFoundException("Failed to find matching brand instance")
    }
    updateProductDto.brand=brand._id
    }
    

    let salePrice=product.salePrice
    if(!updateProductDto.originalPrice || updateProductDto.discountPercent){
      const originalPrice= updateProductDto.originalPrice ?? product.originalPrice
      const discountPercent= updateProductDto.discountPercent ?? product.discountPercent
      const finalPrice= originalPrice -(originalPrice*(discountPercent/100))
      salePrice=finalPrice>0 ? finalPrice:1
    }
    
    
    const updatedProduct= await this.productRepository.findOneAndUpdate({
      filter:{_id:productId},
      update:
        {
          ...updateProductDto,
          salePrice,
          updatedBy:user._id
        }
      
    })
    if(!updatedProduct){
        throw new BadRequestException("Failed to update this product instance")
    }
    
    return updatedProduct
  }

  async updateAttachment(productId: Types.ObjectId, updateProductAttachmentDto: UpdateProductAttachmentDto,user:UserDocument,files?:Express.Multer.File[]) {
    
    const product= await this.productRepository.findOne({filter:{_id:productId}})
    if(!product){
      throw new NotFoundException("Failed to find matching product instance") 
    }
    let attachments:string[]=[]
    if(files?.length){
      attachments= await this.s3Service.uploadFiles({
        files,
        path:`${FolderEnum.category}/${(product.category as unknown as ProductDocument).assetFolderId}/${FolderEnum.product}/${product.assetFolderId}`
      })
    }
    const removedAttachments=[... new Set(updateProductAttachmentDto.removedAttachments ?? [])]
  
    const updatedProduct= await this.productRepository.findOneAndUpdate({
      filter:{_id:productId},
      update:
        {
          $set:{
            updatedBy:user._id,
            images:{
              $setUnion:[
                {
                  $setDifference:[
                    "$images",
                    removedAttachments
                  ]
                },
                attachments
              ]
            },

            
          }
        }
      
    })
    if(!updatedProduct){
      await this.s3Service.deleteFiles({urls:attachments})
        throw new BadRequestException("Failed to update this product instance")
    }
    await this.s3Service.deleteFiles({urls:removedAttachments})
    
    return updatedProduct
  }

  async freeze(productId: Types.ObjectId, user:UserDocument):Promise<string> {
      
      const product= await this.productRepository.findOneAndUpdate({
        filter:{_id:productId},
        update:{
          freezedAt:new Date(),
          $unset:{restoredAt:true},
          updatedBy:user._id
        },
        options:{
          new:false
        }
      })
      if(!product){
        
        throw new NotFoundException("Failed to find matching product instance")
      }
    
      
      return "Done"
    }
  
  async restore(productId: Types.ObjectId, user:UserDocument):Promise<ProductDocument| Lean<ProductDocument>> {
      
      const product= await this.productRepository.findOneAndUpdate({
        filter:{_id:productId,paranoId:false,freezedAt:{$exists:true}},
        update:{
          restoredAt:new Date(),
          $unset:{freezedAt:true},
          updatedBy:user._id
        },
        options:{
          new:false
        }
      })
      if(!product){
        
        throw new NotFoundException("Failed to find matching product instance")
      }
    
      
      return product
    }
  
  async remove(productId: Types.ObjectId, user:UserDocument):Promise<string> {
      
      const product= await this.productRepository.findOneAndDelete({
        filter:{_id:productId,paranoId:false,freezedAt:{$exists:true}},
      })
      if(!product){
        
        throw new NotFoundException("Failed to find matching product instance")
      }
    
      await this.s3Service.deleteFiles({urls:product.images})
      
      return "Done"
    }
  
    async findAll(data:GetAllDto,archive:boolean=false):Promise <{
          docsCount?:number,limit?:number,pages?:number,currentPage?: number | undefined,result:ProductDocument[] | Lean<ProductDocument>[]
      }> {
      const{page,size,search}=data
      const result= await this.productRepository.paginate({
        filter:{
          ...(search?{
            $or:[
              {name:{$regex:search,$options:'i'}},
              {slug:{$regex:search,$options:'i'}},
              {description:{$regex:search,$options:'i'}}
            ]
          }:{}),
          ...(archive?{paranoId:false,freezedAt:{$exists:true}} :{})
        },
        page,
        size
  
      })
      return result
    }
  
    async findOne(productId:Types.ObjectId,archive:boolean=false):Promise <
          ProductDocument | Lean<ProductDocument>
      > {
      
      const product= await this.productRepository.findOne({
        filter:{
           _id:productId,
          ...(archive?{paranoId:false,freezedAt:{$exists:true}} :{})
        },
        
  
      })
      if(!product){
        throw new NotFoundException("Failed to find matching product instance")
      }
      return product
    }

    async addToWishList(productId:Types.ObjectId,user:UserDocument):Promise <
          ProductDocument | Lean<ProductDocument>
      > {
      
      const product= await this.productRepository.findOne({
        filter:{
           _id:productId,
        },
        
  
      })
      if(!product){
        throw new NotFoundException("Failed to find matching product instance")
      }

      await this.userRepository.updateOne({
        filter:{
          _id:user._id
        },
        update:{
          $addToSet:{wishList:product._id}
        }
      })
      return product
    }

      async removeFromWishList(productId:Types.ObjectId,user:UserDocument):Promise <string> {
      
      await this.userRepository.updateOne({
        filter:{
          _id:user._id
        },
        update:{
          $pull:{wishList:Types.ObjectId.createFromHexString(productId as unknown as string)}
        }
      })
      return "Done"
    }
}
