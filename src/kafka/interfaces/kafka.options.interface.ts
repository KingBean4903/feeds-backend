export interface KafkaOptions { 
  topic: string;
  clientId: string;
  brokers: string[];
  retries: number;
  factor:number;
  consumer_group: string;
  initialRetryTime: number;
  maxRetryTime: number;
  multiplier: number;
}
