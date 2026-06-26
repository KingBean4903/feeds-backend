import { Module } from '@nestjs/common'
import { KafkaModule } from '../kafka/kafka.module'
import { FollowService } from './follow.service'
import { KafkaProducerService } from '../kafka/kafka.producer.service';
import { FollowResolver } from './follow.resolver'
import { FollowersRepo } from './followers.repository'
import { KafkaPollingWorker  } from './polling/followers.polling.worker'
import { PrismaService } from '../prisma/prisma.service'

@Module({
    imports: [
         KafkaModule.register({
            topic: 'follow.created.batch',
            clientId: 'follow.batch.processor',
            brokers:  ['localhost:9092'],
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
      KafkaPollingWorker,
      PrismaService,
      FollowersRepo,
      FollowService,
      FollowResolver,
    ],
    exports: [FollowService, ]
})
export class FollowModule {}
