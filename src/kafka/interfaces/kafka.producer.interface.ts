export interface KafkaProducerInterface {
  connect();
  send();
  sendDLQ();
  sendBatch();
  disconnect();
  init();
}
