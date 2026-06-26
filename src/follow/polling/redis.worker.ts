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

@Injectable()
export class RedisWorker {

  constructor(private readonly redis: RedisService) {}

  async processMessages(msgs: Outbox[]) {

  const args = msgs.map((msg: Outbox) => 
    `${msg.payload?.followerId || '' }|${msg.payload?.followingId ?? ''}`);

      try {
        
        this.redis.evalShaRedis(
          'relationships.lua',
          args );

      } catch(err) {
          let message;
          if (err instanceof Error) message = err.message;
          else message = String(err)
          
          console.log(`processRedis: ${message}`)
      }
  }


}
