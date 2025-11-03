import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { RemoveItemsFromCartDto, UpdateCartDto } from './dto/update-cart.dto';
import { BrandRepository, CartRepository, CategoryRepository, ProductRepository, UserDocument } from 'src/DB';
import { S3Service } from 'src/common';


@Injectable()
export class CartService {
  constructor(
        private readonly cartRepository:CartRepository,
        private readonly categoryRepository:CategoryRepository,
        private readonly brandRepository:BrandRepository,
        private readonly productRepository:ProductRepository,
        private readonly s3Service:S3Service
  ){}
async create(createCartDto: CreateCartDto,user:UserDocument):Promise<{status:number;cart:any}>{

    const product= await this.productRepository.findOne({
      filter:{_id:createCartDto.productId,stock:{$gte:createCartDto.quantity}}
    })
    if(!product){
      throw new NotFoundException("Failed to find matching product instance or product is out of stock")
    }
    const cart= await this.cartRepository.findOne({filter:{createdBy:user._id}})
    if(!cart){
      const [newCart]=await this.cartRepository.create({
        data:[{createdBy:user._id,products:[{productId:product._id,quantity:createCartDto.quantity}]}]
      })
      if(!newCart){
        throw new BadRequestException("Failed to create user cart")
      }
      return {status:201,cart:newCart}
    }

    const checkProductInCart = cart.products.find(product=>{
      return product.productId==createCartDto.productId
    })
    if(checkProductInCart){
      checkProductInCart.quantity=createCartDto.quantity
    }else{
      cart.products.push({productId:product._id,quantity:createCartDto.quantity})
    }
    await cart.save()
    return {status:200,cart}
  }

    async removeItemsFromCart(removeItemsFromCartDto: RemoveItemsFromCartDto,user:UserDocument):Promise<any> {

    const cart= await this.cartRepository.findOneAndUpdate({filter:{createdBy:user._id}, update:{
      $pull:{products:{productId:{$in:removeItemsFromCartDto.productIds}}}
    }})
    if(!cart){
      throw new NotFoundException("Failed to finad matching user car")
    }

    return cart
  }

  async remove(user:UserDocument):Promise<string> {

    const cart= await this.cartRepository.deleteOne({filter:{createdBy:user._id}})
    if(!cart.deletedCount){
      throw new NotFoundException("Failed to find matching user car")
    }

    return "Done"
  }

  async findOne(user:UserDocument):Promise<any> {

    const cart= await this.cartRepository.findOne({filter:{createdBy:user._id},options:{populate:[{path:"products.productId"}]}})
    if(!cart){
      throw new NotFoundException("Failed to finad matching user car")
    }

    return cart
  }

  findAll() {
    return `This action returns all cart`;
  }


  update(id: number, updateCartDto: UpdateCartDto) {
    return `This action updates a #${id} cart`;
  }


}
