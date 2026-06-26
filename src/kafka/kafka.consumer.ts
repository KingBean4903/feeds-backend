import { Injectable, Inject } from '@nestjs/common'
import type { EachMessagePayload, Consumer } from 'kafkajs';
import { Kafka } from 'kafkajs';
import { Worker } from 'worker_threads'
import { join } from 'path'
import { KAFKA_OPTIONS } from './constants';
import type { KafkaOptions } from './interfaces/kafka.options.interface';

interface ConsumerOptions {
  clientId: string;
  brokers: string[];
  groupId: string;
  topic: string;
  consumer_group: string;
}

@Injectable()
export class KafkaConsumer {
  topic: string;
  consumer: Consumer;

   constructor(@Inject(KAFKA_OPTIONS) options: KafkaOptions) {
      this.topic = options.topic;
      const kafka = new Kafka({
          clientId: options.clientId,
          brokers: options.brokers 
      })
      this.consumer = kafka.consumer({
        groupId: options.consumer_group,
        sessionTimeout: 60000,
        rebalanceTimeout: 90000
      });
  } 

  
  async connect() {
        await this.consumer.connect();
       }

  async subscribe() {
        await this.consumer.subscribe({ 
              topic: this.topic, 
              fromBeginning: true 
            });
      }
}
