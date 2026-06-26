import { Injectable } from '@nestjs/common';
import { PrismaClient, OutboxStatus } from '../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'

export interface Follow {
  followerId: string;
  followingId: string;
}


@Injectable()
export class FollowersRepo { 

  constructor(private prisma: PrismaService) {}

  async followUser(follow: Follow) {
          return await this.prisma.follow.create({
            data: follow
          })
  }

  async createFollow(follows: Pick<Follow, "followerId" | "followingId">[]) {
     

    try {

        await this.prisma.$transaction(async (tx) => {

          const res = await tx.follow.createMany({
            data: follows,
            skipDuplicates: true
          })
        });

    } catch(error) {
  let message;
        if (error instanceof Error) message = error.message;
        else message = String(error)

        console.log(`createFollow():  ${error}`)

    }

  }
  
}
