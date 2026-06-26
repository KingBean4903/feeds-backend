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


}
