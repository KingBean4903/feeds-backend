import { Injectable, Inject } from '@nestjs/common'
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TimelineRepository {

  @Inject()
  private readonly redis: RedisService;
  
  constructor() {
      this.redis = new RedisService();
  }

  async getTimeline(
    key: string,
    limit: number,
after?: string
  ) {
      
    const result = await this.redis.zRevRangeWithScores(key, limit,  after);

    return result.map((entry: {score: number,
    value: string}) => ({
        postId: entry.value,
        score: entry.score
    }));

  }

}
