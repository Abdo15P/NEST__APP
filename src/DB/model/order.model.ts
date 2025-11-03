import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

import {  IOrder, IOrderProduct, IProduct, OrderStatusEnum, PaymentEnumType } from "src/common";


@Schema({timestamps:true,strictQuery:true})
export class OrderProduct implements IOrderProduct{
    @Prop({type:Types.ObjectId,ref:"Product",required:true})
    productId: Types.ObjectId | IProduct;
    @Prop({type:Number,required:true})
    quantity:number
    @Prop({type:Number,required:true})
    unitPrice:number
    @Prop({type:Number,required:true})
    finalPrice:number

}
@Schema({timestamps:true,strictQuery:true})
export class Order implements IOrder {

    @Prop({type:String,required:true,unique:true})
    orderId:string
    @Prop({type:String,required:true})
    address:string
    @Prop({type:String,required:true})
    phone:string
    @Prop({type:String,required:false})
    note?:string |undefined
    @Prop({type:String,required:false})
    cancelReason?:string |undefined

    @Prop({type:Types.ObjectId,ref:"Coupon"})
    coupon:Types.ObjectId
    @Prop({type:Number,default:0})
    discount:number
    @Prop({type:Number})
    subtotal:number
    @Prop({type:Number,default:true})
    total:number

    @Prop({type:String,enum:PaymentEnumType,default:PaymentEnumType.Cash})
    payment:PaymentEnumType

    @Prop({type:String,enum:OrderStatusEnum,default: function (this:Order){
        return this.payment== PaymentEnumType.Card? OrderStatusEnum.Pending:OrderStatusEnum.Placed
    }})
    status:OrderStatusEnum

    @Prop({type:Date})
    paidAt?:Date
    @Prop({type:String,required:false})
    paymentIntent?:string
    @Prop({type:String})
    intentId:string 
    
    @Prop([OrderProduct])
    products:OrderProduct[]

    @Prop({type:Types.ObjectId,ref:'User',required:true})
    createdBy:Types.ObjectId

    @Prop({type:Types.ObjectId,ref:'User'})
    updatedBy:Types.ObjectId

    @Prop({type:Date})
    freezedAt?:Date

    @Prop({type:Date})
    restoredAt?:Date

    


}
export type OrderDocument= HydratedDocument<Order>
const orderSchema = SchemaFactory.createForClass(Order)
orderSchema.index({expiredAt:1},{expireAfterSeconds:0})

orderSchema.pre(['save'],async function(next){
  
if(this.isModified("total")){
    this.subtotal= this.total-(this.total*this.discount)
}
    
    next()
})

orderSchema.pre(['updateOne','findOneAndUpdate'],async function(next){
  

    const query=this.getQuery()
    if(query.paranoId===false){
        this.setQuery({...query})
    }else{
        this.setQuery({...query,freezedAt:{$exists:false}})
    }
    next()
})

orderSchema.pre(['findOne','find'],async function(next){
  
    const query=this.getQuery()
    if(query.paranoId===false){
        this.setQuery({...query})
    }else{
        this.setQuery({...query,freezedAt:{$exists:false}})
    }
    next()
})


export const OrderModel=MongooseModule.forFeature([{name:Order.name,schema:orderSchema}])