import { BrandRepository } from './../../DB/repository/brand.reposirtory';
import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { S3Service } from 'src/common';
import { BrandModel } from 'src/DB';

@Module({
  imports:[BrandModel],
  controllers: [BrandController],
  providers: [BrandService,BrandRepository,S3Service],
})
export class BrandModule {}
