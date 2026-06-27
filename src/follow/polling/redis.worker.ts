import { Injectable } from '@nestjs/common'
import { RedisService } from '../../redis/redis.service';

export interface Payload {
  followerId: string;
  followingId: string;  
}

export interface Outbox {
  aggregateId: String
  aggregateType: String
  topic: string
  eventType: string
  payload: Payload
}

export interface Follow {
  followerId: string;
  followingId: string;
}
// test_user_78498
const CELEBRITY_THRESHOLD: string = "50000";

const FOLLOWER_BATCH_SIZE = 100;

const BATCH_LUA = 'baatch.lua';

@Injectable()
export class RedisWorker {

  constructor(private readonly redis: RedisService) {}

  async processFollow(msg: Payload) {

    console.log(`Redis payload processFollow(): ${JSON.stringify(msg)}`)

    const followerId = `${msg.followerId}`  
    const followingId = `${msg.followingId}`

    const args: string[] = [ 
      followerId, 
      followingId, 
      CELEBRITY_THRESHOLD ];

      console.log(`processFollow(): redis lua call`)

      try {
        
        this.redis.evalShaRedis(
          'relationships.lua',
          args );

      } catch(err) {
          let message;
          if (err instanceof Error) message = err.message;
          else message = String(err)
          
          console.log(`processFollow(): ${message}`)
      }
  }

  async processBatchFollows(follows: Record<"payload",  Payload>[]) {

    const batch: string[] = [];
    
    for await (const row of follows) {

        const followerId: string = row.payload.followerId;
        const followingId: string = row.payload.followingId;
        
        if (!followerId || !followingId) {
              continue;
        }


        batch.push(`${followerId.trim()}|${followingId.trim()}`);

        if (batch.length == FOLLOWER_BATCH_SIZE) {
            await this.processBatch(batch);

            batch.length = 0;
        } 
    }

    if (batch.length > 0 ) {
          await this.processBatch(batch);
    }
  }

  // REDIS BATCH PROCESSOR
  async processBatch(batch: string[]) {

    if (batch.length === 0) {
          return;
    }

    try {
        await this.redis.evalBatch(BATCH_LUA, batch);
    } catch(err) {
        console.error(`processBatch(): ${err}`)
    }
    

  }




}
