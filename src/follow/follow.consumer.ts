import { Inject,
    Injectable,
    OnApplicationBootstrap,
    OnApplicationShutdown, OnModuleInit
} from '@nestjs/common';
import type { Producer,
  Message, ProducerBatch,
  TopicMessages } from 'kafkajs';
import type { EachMessagePayload, Consumer } from 'kafkajs';
import { join } from 'path';
import { Worker } from 'worker_threads';

import { KafkaConsumer } from '../kafka/kafka.consumer';
import { FollowersRepo, Follow } from './followers.repository'

import { KafkaProducerService } from '../kafka/kafka.producer.service';
import { RedisWorker, Outbox } from './polling/redis.worker';

interface Response {
  eventType: string;
  source: string;
  idempotencyKey: string;
  providerRef: string;
  id: string;
  aggregateId: string;
}

const FOLLOWER_BATCH_SIZE = 100;

@Injectable()
export class FollowConsumerHost implements OnModuleInit {

  constructor(
    private kafka: KafkaConsumer,
    private redis: RedisWorker,
    private followersRepo: FollowersRepo,
  ) {}

    async onModuleInit() {
        await this.run();
    }

  async run() {
    console.log(`followerConsumer()`)
    await this.kafka.connect();
    await this.kafka.subscribe();
    this.kafka.consumer.run({
             eachMessage: async(messagePayload: EachMessagePayload) => {

                const {
                    topic, message, partition
                } = messagePayload;

                 const data = message.value ?? null;
              
                 if (data) {

                    const result:
                      Record<"followerId"
                          | "followingId" 
                          | "eventType" | "payload", string | any> = JSON.parse(data.toString());
                    console.log(`followCreated(): consumer, 
                                ${JSON.stringify(result)}`)

                      if (result.eventType === 'FollowCreated') {

                        await this.saveToPg(result) 
                      }  else if (result.eventType === "FollowOutboxEvent"){

                        const payload = result.payload;
                        await this.redis.processFollow(payload);

                      }                   
                 }    
          }
        
    });

  }


  async saveToPg(result: Record<"followerId" | "followingId", string>) {

          try {
            this.followersRepo.followUser(result)
          } catch(err) {

            let message;
            if (err instanceof Error) message = err.message
            else message = String(err)


            /*try {
                
              await this.producer.sendDLQ({
                    key: result.idempotencyKey,
                    value: result,
                    error: message,
                    message: kmessage,
                    topic: topic,
                    partition: String(kmessage.partition)
                })
            } catch(err) {
                  throw err; 
          } */

        }

}

  

}
