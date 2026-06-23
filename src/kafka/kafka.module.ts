import { Module,DynamicModule } from '@nestjs/common';
import { KafkaProducerService } from './kafka.producer.service';
import { KAFKA_OPTIONS } from './constants';
import { PrismaService } from '../prisma/prisma.service';
import { KafkaConsumer } from './kafka.consumer';

interface KafkaRetry {
    retries: number;
    factor:number;
    initialRetryTime: number;
    maxRetryTime: number;
    multiplier: number;
}

export interface KafkaInitOptions {
  topic: string;
  brokers: string[];
  clientId: string;
  retry: KafkaRetry
}

@Module({
})
export class KafkaModule {
  static register(options: KafkaInitOptions): DynamicModule {
      
      return {
          module: KafkaModule,
          providers: [
            {
              provide: KAFKA_OPTIONS,
              useValue: options,
            },
            KafkaProducerService,
            KafkaConsumer,
                     ],
          exports: [KafkaProducerService]
      }
  }
}
