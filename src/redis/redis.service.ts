import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis, { Redis as RedisType, Pipeline } from 'ioredis';
import  path  from 'path';
import fs from 'fs';

type ZSETRes = {
  value: string;
  score: number;
}

interface Follow {
  followerId: string;
  followingId: string;
}

const FOLLOWERS_LUA_SCRIPT = 'relationships.lua';
const FOLLOWERS_BATCH_LUA_SCRIPT = 'batch.lua';

@Injectable()
export class RedisService implements OnModuleInit {
  
  private client: RedisType;
  private _luaShaScript: Buffer | string;
  private _luaBatchShaScript: Buffer | string;
  
  onModuleInit(){
    this.loadScript(FOLLOWERS_LUA_SCRIPT, this._luaShaScript);
    this.loadScript(FOLLOWERS_BATCH_LUA_SCRIPT, this._luaBatchShaScript);
  }

  constructor() {
      this.client = new Redis({
        host: process.env.REDIS_HOST as string,
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD as string,
        username: process.env.REDIS_USER as string
      })

  }

  async get<T>(key: string): Promise<T | null> {
      const data = await this.client.get(key);
      return data ? data as T : null;
  }

  async set(key: string, value: unknown, ttlSeconds: number) {
      const data = JSON.stringify(value);
      if (ttlSeconds) {
          await this.client.set(key, data, 'EX', ttlSeconds);
      } else {
          await this.client.set(key, data);
      }
  }

  async zAdd(key: string, postId: string, score:number) {

      await this.client.zadd(key, score, postId);
  }

  async pipelineZSET(ids: string[], postId: string, score: number) {

    const batchSize = 2;

    console.log(`IDS size  ${ids.length}`)

    for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i,  i + batchSize);
          await this.processBatch(batch, postId, score)
    }
  }

  async processBatch(batch: string[], postId: string, score: number) {
      const pipeline = this.client.pipeline();


console.log(`Batch size  ${batch.length}`)
      for (let i = 0; i < batch.length; i++) {
            pipeline.zadd(`timeline:user:${batch[i]}`, score, postId)

            // Remove older entries
            // pipeline.zremrangebyrank(`timeline:user:${batch[i]}`, 0, -1001)
      }

      await pipeline.exec()


  }

  async zRevRangeWithScores(key: string, 
                            limit: number, 
                            after?: string): Promise<ZSETRes[]>{

    let result;

    if (!after) { 
      result = await this.client.zrevrangebyscore(
        key, 0, limit - 1 , "WITHSCORES");
    }
    
    result=  await this.client.zrevrangebyscore(
        key,
        `(${after}`,
        '-inf',
        "WITHSCORES",
        "LIMIT",
         0,
        limit
    );

    const pRes:ZSETRes[] = JSON.parse(result);

    return pRes;
  }

  async exists(key: string) {
        
    return await this.client.exists(key);
  }

  async del(key: string) {
      await this.client.del(key);
  }

  async loadScript(LUA_SCRIPT: string, shaScript: string | Buffer) {

    const luaPath = path.resolve(`src/follow/polling/${LUA_SCRIPT}`);
    const lPath  = fs.readFileSync(luaPath, 'utf-8');
    
    try {
          shaScript = (await this.client.script("LOAD", lPath)) as string;
          console.log(`Loaded Lua script ${this._luaShaScript}`)
    } catch(err) {
      let message: string;
      
      if (err instanceof Error) {
            message= err.message;
      } else {
            message = String(err);
      }

    }

  }

  async evalShaRedis(LUA_SCRIPT: string, args: string[]) { 

    try {

      const res = await this.client.evalsha(
        this._luaShaScript, 
        0,
        args
      );

    } catch(err) {

        let message;
        if (err instanceof Error) message = err.message;
        else message = String(err)

        if (err.message.includes('NOSCRIPT')) {

           const luaPath = path.resolve(`src/follow/polling/${LUA_SCRIPT}`);
           const lpath = fs.readFileSync(luaPath, 'utf-8');

           try {
              this._luaShaScript = 
                (await this.client.script("LOAD", lpath)) as string;

              const res = await this.client.evalsha(
                this._luaShaScript, 
                0,                
                args 
              );

            } catch(err) {
 
              let message: string;
              
              if (err instanceof Error) {
                    message= err.message;
              } else {
                    message = String(err);
              }

            }

        } else {
              throw err;
        }
    }
  }

  async evalBatch(LUA_SCRIPT: string, args: string[]) { 

    try {

      const res = await this.client.evalsha(
        this._luaBatchShaScript, 
        0,
        ...args
      );

    } catch(err) {

        let message;
        if (err instanceof Error) message = err.message;
        else message = String(err)

        if (err.message.includes('NOSCRIPT')) {

           const luaPath = path.resolve(`src/follow/polling/${LUA_SCRIPT}`);
           const lpath = fs.readFileSync(luaPath, 'utf-8');

           try {
              this._luaBatchShaScript = 
                (await this.client.script("LOAD", lpath)) as string;

              const res = await this.client.evalsha(
                this._luaBatchShaScript, 
                0,                
                ...args 
              );

            } catch(err) {
 
              let message: string;
              
              if (err instanceof Error) {
                    message= err.message;
              } else {
                    message = String(err);
              }

            }

        } else {
              throw err;
        }
    }


  }

}
