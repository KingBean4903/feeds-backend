import { PrismaClient } from '../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { Injectable, Inject } from '@nestjs/common';
import { Post } from '../models/post.model'
import { FeedsInput, Payload,
  PostPayload } from '../dtos/feeds.input'

@Injectable()
export class PostsService {

  constructor(private readonly prisma: PrismaService) {}

  async createPost(payload: Payload) {

    try {
     const post = await this.prisma.post.create({
        data: { 
          text: payload.text,
          authorId: payload.authorId,
          type: payload.type,
          visibility: payload.visibility
        }
      })

      if (post) {
          // Emit kafka event
      }

      return post;

    } catch(error) {
       let message;
       if (error instanceof Error) message = error.message;
       else message = String(error)
    }

  }

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
