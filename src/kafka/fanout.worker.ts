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
import { KafkaConsumer } from './kafka.consumer';
import { UserService } from '../users/users.service'
import { RedisService } from '../redis/redis.service';

import { KafkaProducerService } from './kafka.producer.service';
import { Outbox } from '../generated/prisma/client'

interface Payload {
  postId: string;
  authorId: string;
  timeline: string;
  createdAt: string;
}

interface OutboxEvent {
  id: string;
  aggregateId: string
  aggregateType: string
  topic: string;
  eventType: string;
  payload: Payload;
  status: string; 
  retryCount: number;
}

@Injectable()
export class EventsConsumerHost implements OnModuleInit {


  constructor(
    private readonly  producer: KafkaProducerService,
    private kafka: KafkaConsumer,
    private readonly redis: RedisService,
    private readonly usersService: UserService,
  ) {
      this.producer = new KafkaProducerService({
        clientId: process.env.KAFKA_DLQ_CLIENT_ID as string,
        brokers: [process.env.KAFKA_BROKERS as string],
        topic: process.env.DLQ_TOPIC as string,
        retries: 3,
        factor: 2,
        initialRetryTime: 500,
        maxRetryTime: 30000,
        multiplier: 2
      });

      
  }

    async onModuleInit() {

        this.kafka = new KafkaConsumer({
              topic: 'post.created',
              clientId: 'events-processor',
              brokers: ['localhost:9092'],
              retries: 3,
              factor: 2,
              initialRetryTime: 500,
              maxRetryTime: 30000,
              multiplier: 2
        });

        await this.run();
    }

  async run() {
    await this.kafka.connect();
    await this.kafka.subscribe(); 
    this.kafka.consumer.run({
        eachMessage: async(messagePayload: EachMessagePayload) => {
            
            const { 
              topic,
              message, 
              partition
            } = messagePayload;

            const data = message.value ?? null;
            
         if (data) {

              const result: OutboxEvent = 
                JSON.parse(data.toString());

              console.log(`Consumer ${JSON.stringify(result)}`)

              await this.processPost(result, topic, message);
              
         }

        }
    });

  }


  // Fetch followers
  // Push to post/follower_id to followers_timeline
  // Update timeline to processed
  async processPost(result: OutboxEvent, 
                    topic: string,
                    kmessage:Message) {

          const { postId, authorId,
            createdAt, timeline } = result.payload;

          try {
            
            // Fetch followers
            const followers = await 
                      this.usersService.getFollowers(authorId);

            let score = Number(timeline);

            const rqsts = followers.map((id) => this.redis.zAdd(
                  `timeline:user:${id}`,
                  postId, score
            ))
            
            await Promise.all(rqsts);
        

          } catch(err) {

            let message;
            if (err instanceof Error) message = err.message
            else message = String(err)

            console.log(`Processing error ${message}`)


            /* try {
                
              await this.producer.sendDLQ({
                    key: result.payload.postId,
                    value: result.toString(),
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
