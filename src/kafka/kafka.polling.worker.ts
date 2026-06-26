import { Injectable, OnModuleInit } from '@nestjs/common';
import { KafkaProducerService } from './kafka.producer.service';
import { PrismaService } from '../prisma/prisma.service';
import { OutboxStatus } from '../generated/prisma/client'

interface Outbox { 
    id: string;
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    status: string;
    payload: any;
}

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
        // await this.doWork();
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
                select: {
                  id: true,
                  status: true,
                  eventType: true,
                  aggregateId: true,
                  aggregateType: true,
                  payload: true
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

  async publishEvents(messages: Outbox[]) {

            try {

                const events = messages
                .filter((one: Outbox) => one.eventType == 'post.created')
                .map(one => ({
                                            
                        ...one,
                        "eventType" : "PostCreated",
                        "source"  : "database"
                }

                ))
                await this.kafka.sendBatch(events);
                await this.markEventsAsPublished(events);
            } catch(error) {
                 let message;
                 if (error instanceof Error) message = error.message
                 else message = String(error)
                 console.log(`Polling error ${message}`)
            }

  }

  async markEventsAsPublished(events: Outbox[]) {
      
    await this.prisma.$transaction(async (tx) => {
        
        const ids = events.map((record: Outbox) => record.id);
        // console.log(`markEventsAsPublished ${JSON.stringify(ids)}`)

        const results = await tx.outbox.updateMany({
          where :{
            id: { in: ids} },
            data: { status: OutboxStatus.published }
        })
    })
  }



}
