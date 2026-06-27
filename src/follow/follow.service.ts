import { Injectable, Inject, OnModuleInit } from '@nestjs/common'
import { KafkaProducerService } from '../kafka/kafka.producer.service';
import { FollowInput } from '../dtos/follow.user.input'
import { FollowersRepo  } from './followers.repository'
import { RedisService } from '../redis/redis.service';
import NodeCache from 'node-cache';


@Injectable()
export class FollowService implements OnModuleInit {

  private _cache: NodeCache;

  async onModuleInit() {
    this.producer.connect();
  }

  constructor(
    private readonly redis: RedisService,
    private repository: FollowersRepo,
    private producer: KafkaProducerService) {
        this._cache = new NodeCache({ stdTTL: 86400, checkperiod: 60 })
    }

  async followUser(follow: FollowInput) {

    const key: string = `user:tier:${follow.followingId}`;

    console.log(`cache key, ${key}`)

    try {
      
        // GET tier from inmemory cache
        let tier = this._cache.get(key);

 console.log(`Tier ${tier}`)

        // CACHE MISS - GET FROM REDIS
        if (!tier) {
          tier = await this.redis.get(key) 


           console.log(`Tier ${tier}`)

          // UPDATE inmemory cache
         if (tier) {
              this._cache.set(key, tier);
          } 
        }


        console.log(`Tier ${tier}`)


        if (tier && tier === "CELEBRITY") {
           await this.producer.sendCeleb(
            follow.followingId,
          {
            ...follow, 
            eventType: 'FollowBatchCreated'
          });

          
        } else {
        
            
        // REGULAR USERS
        await this.producer.send(
          {
            ...follow, 
            eventType: 'FollowCreated'
          });

        } 


    } catch(error) {

        let message;
        if (error instanceof Error) message = error.message;
        else message = String(error)

        console.error(`producerError:  ${message}`)

    } 

  }

  async followBatch(relationships: FollowInput[]) {

    // Send to Kafka in batches
    // relationship consumer
    // postgres
    // redis
     
    try {

    await this.producer.sendBatched(relationships);
    } catch(error) {
        let message;
        if (error instanceof Error) message = error.message;
        else message = String(error)

        console.log(`followBatch:  ${error}`)
    }

  }
}
