import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaProducerService } from './kafka.producer.service';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxStatus } from '../generated/prisma/client'


@Injectable()
export class KafkaPollingWorker implements OnModuleInit { 

  async onModuleInit() {
      this.kafka.connect();
      this.fetchOutboxEvents();
  }

  constructor(
    private prisma: PrismaService,
    private kafka: KafkaProducerService  
  ) {}

  async fetchOutboxEvents() {
    console.log('Fetching outbox');
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
                where: { status: 'pending' },
                take: 10,
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

  async publishEvents(messages: Record<"id" | "aggregateId", string>[]) {

            try {

                const events = messages.map(one => {
                                            
                      return { 
                        ...one,
                        "eventType" : "PostCreated",
                        "source"  : "database"
                    }

                })
                await this.kafka.sendBatch(events);
                await this.markEventsAsPublished(events);
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
