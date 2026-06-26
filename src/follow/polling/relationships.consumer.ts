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
import { KafkaConsumer } from '../../kafka/kafka.consumer';

import { FollowersRepo } from '../followers.repository'
import { KafkaProducerService } from '../../kafka/kafka.producer.service';

import { RedisWorker, Follow, Outbox } from './redis.worker' 
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
export class RelationshipsConsumer implements OnModuleInit {

  
  constructor(
    private kafka: KafkaConsumer,
    private fRepo: FollowersRepo,
    private redis: RedisWorker,
    private producer: KafkaProducerService
  ) {}

    async onModuleInit() {
        await this.run();
    }

  async run() {
    await this.kafka.connect();
    await this.kafka.subscribe(); 
    this.kafka.consumer.run({
        eachBatch: async({ batch, resolveOffset, heartbeat }) => {

            const rMessages: Outbox[] = []
            
            for (const message of batch.messages) { 

                 const data = message.value ?? null;
              
                 if (data) {

                      const result: Outbox = 
                        JSON.parse(data.toString());

                      if (result.eventType === "FollowersOutboxEvent") { 
                          
                          rMessages.push(result);

                          if (rMessages.length  >= FOLLOWER_BATCH_SIZE) {
                            await this.redis.processMessages(rMessages)
                             rMessages.length = 0;
                          }

                      }
                  }
          }


        }
    });

  }


  async sendToRedis(result: Record<string, string>, topic: string,
                             kmessage:Message) {

          try {
            

        


          

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
