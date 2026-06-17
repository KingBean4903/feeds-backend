import { NotFoundException } from '@nestjs/common';
import { Args, Query, Resolver, Parent,
  ResolveField } from '@nestjs/graphql';
import { User } from '../models/user.model';
import { UserService } from './users.service';

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
      const followers = await this.userService.getFollowers(id)
      if (!followers) {
          throw new NotFoundException(id)
      }

      return followers;
  }

  /* @ResolveField('following', () => [User])
  async following(@Parent() user: User): Promise<User[]> {
      const { id } = user;
      return this.usersService.getFollowing({ userId: id})
  } */

}


