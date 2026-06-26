import { Injectable, Inject, OnModuleInit } from '@nestjs/common'
import { KafkaProducerService } from '../kafka/kafka.producer.service';
import { FollowInput } from '../dtos/follow.user.input'
import { FollowersRepo  } from './followers.repository'
@Injectable()
export class FollowService implements OnModuleInit {

  async onModuleInit() {
    this.producer.connect();
  }

  constructor(
    private repository: FollowersRepo,
    private producer: KafkaProducerService) {}

  async followUser(follow: FollowInput) {

    console.log(`followUser(): producer`)

    try {
        
        // console.log(`${this.producer.topic}`);

        await this.producer.send(
          {
            ...follow, 
            eventType: 'FollowCreated'
          });

    } catch(err) {
       console.log('producerError()')
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
