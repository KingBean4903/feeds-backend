import { Inject } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import type { Producer,
  Message, ProducerBatch,
  TopicMessages } from 'kafkajs';
import { KAFKA_OPTIONS } from './constants';
import type { KafkaOptions } from './interfaces/kafka.options.interface';
import { Injectable } from '@nestjs/common';

type batchId = { id: string, aggregateId: string }


type DLQMessage = {
  key: string;
  value: Record<string, string>;
  topic: string;
  message: Message;
  error: string;
  partition: string;
}

@Injectable()
export class KafkaProducerService {
  
  producer: Producer;
  topic: string;

  constructor(@Inject(KAFKA_OPTIONS) options: KafkaOptions) {
      this.topic = options.topic;
      this.producer = new Kafka({
          clientId: options.clientId,
          brokers: options.brokers ,
          retry :{
              retries: options.retries,
              factor: options.factor,
              initialRetryTime: options.initialRetryTime,
              maxRetryTime: options.maxRetryTime,
              multiplier: options.multiplier
          }
      }).producer({
          transactionalId: 'callback-tx',
          maxInFlightRequests: 1,
          idempotent: true
      });
  } 


  public async connect() {
    try {
    await this.producer.connect();
    } catch(error) {
        console.log(`Error connecting the producer: ${error}`)
    }
  }

  public async send(key: string, value: Record<string, string>) {
    await this.producer.send({
        topic: this.topic,
        messages: [{
            key: key, 
            value: JSON.stringify(value),
            headers: {
                idempotencyKey: Buffer.from(value.idempotencyKey)
            }

        }]
    })
  }


  public async sendDLQ(payload: DLQMessage) {

    const {
          key,
          value,
          topic,
          error ,
          message,
          partition
    } = payload
    
    await this.producer.send({
        topic: this.topic,
        messages: [{
            key: key, 
            value: JSON.stringify(value),
            headers: {
                ...message.headers,
                'x-idempotency-key': Buffer.from(value.idempotencyKey),
                'x-original-partition': partition,
                'x-exception-message' : error,
                'x-failed-at': new Date().toISOString()
            }

        }]
    })

  }


  public async sendBatch<T extends batchId[]>(messages: T) {

    const kafkaMessages: Array<Message> = messages.map((msg) => {


        return {
            key: msg.aggregateId,
            value: JSON.stringify(msg),
            headers: {
                idempotencyKey: Buffer.from(msg.aggregateId)
            }
        }
   });

    const topicMsgs: TopicMessages = {
        topic: this.topic,
        messages: kafkaMessages
    }

    const batch: ProducerBatch = {
        topicMessages: [topicMsgs],
        acks: -1
    }
    
    await this.producer.sendBatch(batch)
   }

  public async disconnect() {
      await this.producer.disconnect();
  }

}
