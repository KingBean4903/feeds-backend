import { Module } from '@nestjs/common'
import { UserService } from './users.service'
import { UserResolver } from './users.resolver';

@Module({
  providers: [
    UserService, 
    UserResolver,
  ]
})
export class UserModule {}
