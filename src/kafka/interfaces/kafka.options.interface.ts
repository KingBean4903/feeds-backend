export interface KafkaOptions { 
  topic: string;
  clientId: string;
  brokers: string[];
  retries: number;
  factor:number;
  initialRetryTime: number;
  maxRetryTime: number;
  multiplier: number;
}
