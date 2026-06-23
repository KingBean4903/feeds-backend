import { NotFoundException } from '@nestjs/common';
import { Args, Query, Resolver, Parent,Mutation ,
  ResolveField } from '@nestjs/graphql';
import { User } from '../models/user.model';
import { UserService } from './users.service';
import { FollowUserInput } from '../dtos/follow.user.input'


@Resolver(of => User)
export class UserResolver {

  constructor( 
        private userService: UserService
  ) {}


  @Query(() => User)
  async profile(@Args('id') id: number): Promise<User> {
    const user = await this.userService.findOneById(id);
    if (!user) {
          throw new NotFoundException(id);
    }
    return user;
  }

  @Query(() => [User])
  async followers(@Args('id') id: number): Promise<User[]> {
      const followers = await this.userService.getFollowersById(id)
      if (!followers) {
          throw new NotFoundException(id)
      }

      return followers;
  }

  @Query(() => [User])
  async following(@Args('id') id: number): Promise<User[]> {
      return await this.userService.getFollowing(id)
  } 

  @Mutation(() => User)
  async followUser(@Args('userId') userId: FollowUserInput): Promise<User> {
      
      const user = await this.userService.followUser(userId);

      if (!user) {
          throw new Error(`User undefined`)
      }

      return user;
  }

  @Mutation(() => User)
  async unfollow(@Args('userId') userId: FollowUserInput): Promise<User> {
      
      const user = await this.userService.unFollowUser(userId);

      if (!user) {
          throw new Error(`User undefined`)
      }

      return user;
  }


}


