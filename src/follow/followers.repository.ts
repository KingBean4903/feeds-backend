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

            console.log(`followersRepo() ${JSON.stringify(follow)}`)
            try {
          await this.prisma.$transaction(async (tx) => {
            const result = await tx.follow.create({
              data: {
                  followerId: follow.followerId, 
                  followingId: follow.followingId
              }
            });

            await tx.outbox.create({
              data: {
                  topic: 'follow.created',
                  aggregateType: 'Follow',
                  aggregateId: `${result.id}`,
                  payload: result,
                  eventType: 'FollowCreated',
                  status: OutboxStatus.pending,
              }
            })

          }) 
            } catch (error) {
        let message;
        if (error instanceof Error) message = error.message;
        else message = String(error)

        console.log(`Error followUser():  ${error}`)

            }
  }

async followBatch(follows: Record<"followerId" | "followingId", string>[]) {

            console.log(`followBatchRepo() ${JSON.stringify(follows)}`)

            try {
          await this.prisma.$transaction(async (tx) => {

            const result = await tx.follow.createMany({
              data:  follows           
            });

            const events = follows.map((one) => ({ 
              ...one, 
               topic: 'follow.created',
                  aggregateType: 'FollowBatch',
                  aggregateId: `${one.followingId}`,
                  payload: result,
                  eventType: 'FollowBatchCreated',
                  status: OutboxStatus.pending,
            }))

            await tx.outbox.createMany({
              data: events
            })

          }) 
            } catch (error) {
        let message;
        if (error instanceof Error) message = error.message;
        else message = String(error)

        console.log(`Error followUser():  ${error}`)

            }
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
