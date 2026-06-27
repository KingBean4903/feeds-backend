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
import { FollowersRepo } from './followers.repository'
import { KafkaProducerService } from '../kafka/kafka.producer.service';
import { RedisWorker, Follow, Payload, Outbox } from './polling/redis.worker';

interface Response {
  eventType: string;
  source: string;
  idempotencyKey: string;
  providerRef: string;
  id: string;
  aggregateId: string;
}

const enum Events { 
 FollowBatchCreated = "FollowBatchCreated",
 FollowBatchOutboxEvent= "FollowBatchOutboxEvent"
}

const FOLLOWER_BATCH_SIZE = 100;

@Injectable()
export class CelebBatchConsumer implements OnModuleInit {

  constructor(
    private kafka: KafkaConsumer,
    private followersRepo: FollowersRepo,
    private redis: RedisWorker,
    private producer: KafkaProducerService
  ) {}

    async onModuleInit() {
        await this.run();
    }

  async run() {

    console.log('rltnshipsConsumer()')
    await this.kafka.connect();
    await this.kafka.subscribe(); 
    this.kafka.consumer.run({
        eachBatch: async({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
              
                const batched: Record<
                "followerId" | "followingId" | "eventType" |
                "payload", string | any>[] = [];
                    
                let event: string = ""

                for (let message of batch.messages) { 

                const data = message.value ?? null;
              
                 if (data) {

                    const result: Record<
                      "followerId" | "followingId" |
                      "payload" |"eventType", string | any>= 
                      JSON.parse(data.toString());

                      console.log(`rltsnpConsumer() ${JSON.stringify(result)}`)

                      console.log('rltnshipsConsumer()');

                      batched.push(result);
                      event = result.eventType;


                      if (result.eventType === Events.FollowBatchCreated) { 

                            if (batched.length >= FOLLOWER_BATCH_SIZE ) {
                                await this.followersRepo.followBatch(batched);
                                    batched.length = 0;
                            }
                      }

                      if (result.eventType === Events.FollowBatchOutboxEvent) { 

                            if (batched.length >= FOLLOWER_BATCH_SIZE ) {
                              await this.sendToRedis(batched);
                              batched.length = 0;
                            }
                      }


                  }
                }
                    
                  // PROCESS REMAINING MESSAGES
                    if (batched.length > 0) {
                        if (event === Events.FollowBatchOutboxEvent) {                          await this.sendToRedis(batched);   
                    } else if(event === Events.FollowBatchCreated) {
                        await this.followersRepo.followBatch(batched);
                        }
                    }


          }
    });

  }  


  async sendToRedis(result: Record<"payload", any>[]) {

          try {
            
            this.redis.processBatchFollows(result);

          } catch(err) {
            let message;
            if (err instanceof Error) message = err.message
            else message = String(err)


           /* try {
                
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
