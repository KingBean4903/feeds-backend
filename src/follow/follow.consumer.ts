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
export class EventsConsumerHost implements OnModuleInit {


  constructor(
    private producer: KafkaProducerService,
    private kafka: KafkaConsumer,
    private followersRepo: FollowersRepo,
  ) {}

    async onModuleInit() {
        await this.run();
    }

  async run() {
    await this.kafka.connect();
    await this.kafka.subscribe(); 
    this.kafka.consumer.run({
             eachBatch: async({ batch, resolveOffset, heartbeat }) => {

            const rMessages: Record<string, string>[] = []
            
            for (const message of batch.messages) { 

                 const data = message.value ?? null;
              
                 if (data) {

                      const result: Record<"followerId"| "followingId", string> = 
                        JSON.parse(data.toString());

                          
                          rMessages.push(result);

                          if (rMessages.length  >= FOLLOWER_BATCH_SIZE) {
                            await this.saveToPg(rMessages)
                             rMessages.length = 0;
                          }

                      
                  }
          }
        }
    });

  }


  async saveToPg(result: Record<"followerId" | "followingId", string>[]) {

          try {
            this.followersRepo.createFollow(result)
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
