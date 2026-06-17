import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import {join } from 'path';
import { UserModule } from './users/users.module';
import { ApolloServerPluginLandingPageLocalDefault } from 
  '@apollo/server/plugin/landingPage/default';


@Module({
  imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            playground: false,
            plugins: [ApolloServerPluginLandingPageLocalDefault()],
        }),
        UserModule
  ],
  providers: [AppService],
})
export class AppModule {}
