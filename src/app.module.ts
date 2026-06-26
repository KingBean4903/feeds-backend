import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import {join } from 'path';
import { UserModule } from './users/users.module';
import { ApolloServerPluginLandingPageLocalDefault } from 
  '@apollo/server/plugin/landingPage/default';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import {  DataLoaderModule } from './dataloader/dataloader.module';
import {  DataLoaderService } from './dataloader/data.loader';

import { UserService } from './users/users.service'
import { PostsModule } from './posts/posts.module';
import { ConfigModule } from '@nestjs/config'
import { KafkaModule } from './kafka/kafka.module'

import { FollowModule } from './follow/follow.module';
import { PollingModule } from './follow/polling/polling.module';

@Module({
  imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        DataLoaderModule,
               PrismaModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            playground: false,
            plugins: [ApolloServerPluginLandingPageLocalDefault()],
            context: ({ req, res }) => { 
              useDataLoader: new DataLoaderService(new UserService()).getLoaders()
            },
        }),
        RedisModule,
        UserModule,
        FollowModule,
        PollingModule,
        PostsModule,

  ],
  providers: [AppService, UserService],
})
export class  AppModule {}
