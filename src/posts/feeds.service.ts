import { Injectable, Inject } from '@nestjs/common';
import { TimelineRepository } from './timeline.repository'
import { PostsService } from './posts.service'
import { FeedConnection, Post} from '../models/post.model'

import { PrismaClient } from '../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'
@Injectable()
export class FeedsService {

  constructor(   
          private readonly prisma: PrismaService,
          private readonly timelineRepo:TimelineRepository,
          private readonly postService: PostsService,
  ) {
//        this.postService = new PostsService(this.prisma)
  }
  
  async getFeed(
    userId: string,
    first: number, 
    after?: string): Promise<FeedConnection> {
      
      const timelineKey = `timeline:user:${userId}`;

      const pageSize = first + 1;

      const entries:{ score: number, postId: string}[] = 
        await this.timelineRepo.getTimeline(
              timelineKey,
              pageSize,
              after,
      );

      const hasNextPage = entries.length > first;

      const pageEntries = entries.slice(0, first);

      const postIds = 
              pageEntries.map((e) => e.postId);

      const posts = 
            await this.postService.getPosts(
                    postIds,
              );

      const edges: { 
        cursor: string, 
        node: Post 
      }[] = pageEntries.map(
          (entry: { score: number, postId: string}) => ({
              cursor: entry.score.toString(),
              node: posts.get(entry.postId)!,
          })
      );

      return {
          edges,
          pageInfo: {
              hasNextPage,
              endCursor: edges.length > 0 
                    ? edges[edges.length - 1]?.cursor
                    : null
          }
      }
  }
}
