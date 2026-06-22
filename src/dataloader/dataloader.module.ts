import { Module } from '@nestjs/common';
import {PostsModule } from '../posts/posts.module'
import { DataLoaderService } from './data.loader'
import { UserService } from '../users/users.service'
import { FeedsService } from '../posts/feeds.service'
import { PostResolver } from '../posts/posts.resolvers'
import { PostsService } from '../posts/posts.service'
import { TimelineRepository } from '../posts/timeline.repository'




@Module({
  imports: [PostsModule],
  providers: [
    PostResolver,
    PostsService,
    FeedsService,
    TimelineRepository,
    DataLoaderService, 
    UserService],
})
export class DataLoaderModule {}

