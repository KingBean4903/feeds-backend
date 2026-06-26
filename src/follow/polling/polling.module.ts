import { Module } from '@nestjs/common'
import { KafkaModule } from '../../kafka/kafka.module'
import { FollowService } from '../follow.service'
import { KafkaProducerService } from '../../kafka/kafka.producer.service';
import { FollowersRepo } from '../followers.repository'
import { PrismaService } from '../../prisma/prisma.service'
import { KafkaPollingWorker  } from './followers.polling.worker'
import { RelationshipsConsumer  } from './relationships.consumer'

import { RedisWorker } from './redis.worker' 
@Module({
    imports: [
         KafkaModule.register({
            topic: 'follow.created',
            clientId: 'follow.processor.v1',
            brokers:  ['localhost:9092'],
            consumer_group: 'follow-consumer-group',
            retry: {
                retries: 3,
                factor: 2,
                initialRetryTime: 500,
                maxRetryTime: 30000,
                multiplier: 2
            }
      }),
    ],
    providers: [
      RedisWorker,
      PrismaService,
      FollowService,
      FollowersRepo,
      KafkaPollingWorker  
    ],
    exports: [RedisWorker, 
      KafkaPollingWorker  ]
})
export class PollingModule {}
