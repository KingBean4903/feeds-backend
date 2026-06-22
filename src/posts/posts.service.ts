import { PrismaClient } from '../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { Injectable, Inject } from '@nestjs/common';
import { Post } from '../models/post.model'

@Injectable()
export class PostsService {

  constructor(private readonly prisma: PrismaService) {}

  async getPosts(postIds: string[]): Promise<Map<string, Post>> {

   const posts: Post[] = await this.prisma.post.findMany({
          where: { id : { in : postIds  } },
          include: {
              media: {
                select: {
                  media: true,
                  post: true,
                  order: true,
                  postId: true,
                  mediaId: true,
                },
              },
              stats: {
                include: {
                    post: true
                }
              }
          }
    })

    if (!posts) {
          throw new Error(`Empty posts`)
    }

    const map = new Map(
        posts.map((p) => [p.id, p])
    )

    return map;

  }
}
