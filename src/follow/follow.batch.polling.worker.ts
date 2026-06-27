
import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaProducerService } from '../kafka/kafka.producer.service';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxStatus } from '../generated/prisma/client'


interface Payload  {
  id: string;
  payload: any;
  eventType: string;
  aggregateId: string;
}

@Injectable()
export class KafkaBatchPollingWorker implements OnModuleInit { 

  async onModuleInit() {
      this.kafka.connect();
      this.fetchOutboxEvents();
  }

  constructor(
    private prisma: PrismaService,
    private kafka: KafkaProducerService  
  ) {}

  async fetchOutboxEvents() {
    console.log('fetchOutbox');
    while(true) {
      try {
        await this.doWork();
      } catch(err) {
          console.error(`FetchOutbox ${err}`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  async doWork() {
    // Fetch from prisma
    
        const current_page = 1
        const result = await this.prisma.$transaction(async (tx) => {
            
            const events = await tx.outbox.findMany({
                where: { 
                  status: 'pending',
                  eventType: 'FollowBatchCreated'
                },
                take: 10,
                select: { 
                  id: true, 
                  aggregateId: true,
                  eventType: true,
                  payload: true,
                },
                orderBy: { createdAt: 'asc' }
            })

            const ids = events.map(record => record.id);
            
            const results = await tx.outbox.updateMany({
              where: {
                id: { in: ids}
              },
              data: { status: 'processing' }
            });
            
            return events;
        });

        this.publishEvents(result);

        
  }

  async publishEvents(messages: Payload[]) {

          
            try {
             
                const followMsgs = messages.map(one => ({        
                        ...one,
                        eventType : "FollowBatchOutboxEvent",
                        "source"  : "database"
                }))

                console.log(`pollingBatchEvents(): 
                            ${JSON.stringify(followMsgs)}`)

                await this.kafka.sendBatch(followMsgs);
                await this.markEventsAsPublished(followMsgs);
            } catch(error) {
                 let message;
                 if (error instanceof Error) message = error.message
                 else message = String(error)
                 console.log(`Polling error ${message}`)
            }
  }

  async markEventsAsPublished<T extends {id: string}[]>(events: T) {
      
    await this.prisma.$transaction(async (tx) => {
        
        const ids = events.map(record => record.id);
        // console.log(`markEventsAsPublished ${JSON.stringify(ids)}`)

        const results = await tx.outbox.updateMany({
          where :{
            id: { in: ids} },
            data: { status: OutboxStatus.published }
        })
    })
  }
}
