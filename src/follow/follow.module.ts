import { Module } from '@nestjs/common'
import { KafkaModule } from '../kafka/kafka.module'
import { FollowService } from './follow.service'
import { KafkaProducerService } from '../kafka/kafka.producer.service';
import { FollowResolver } from './follow.resolver'
import { FollowersRepo } from './followers.repository'
import { PrismaService } from '../prisma/prisma.service'
import { FollowConsumerHost  } from './follow.consumer'
import { KafkaConsumer } from '../kafka/kafka.consumer'
import { RedisWorker } from './polling/redis.worker';
import { CelebBatchConsumer } from './follow.batch.consumer';
import { KafkaBatchPollingWorker  } from './follow.batch.polling.worker'

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
      PrismaService,
      FollowersRepo,
      CelebBatchConsumer,
      FollowConsumerHost,
      FollowService,
      RedisWorker,
      FollowConsumerHost,
      KafkaBatchPollingWorker,
      FollowResolver,
    ],
    exports: [
      FollowService,
      FollowConsumerHost
    ]
})
export class FollowModule {}
