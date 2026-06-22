import { Module } from '@nestjs/common';
import { FeedsService } from './feeds.service'
import { PostResolver } from './posts.resolvers'
import { PostsService } from './posts.service'
import { TimelineRepository } from './timeline.repository'
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    providers: [
      FeedsService,
      TimelineRepository,
      PostResolver,
      PostsService, 
      PrismaService,
      RedisService
    ],
    exports: [
  FeedsService,
      TimelineRepository,
      PostResolver,
      PostsService, 
      
      RedisService

    ]
})
export class PostsModule {}
