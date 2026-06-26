import { NotFoundException } from '@nestjs/common';
import { Args, Query, Resolver, Parent,Mutation ,
  ResolveField } from '@nestjs/graphql';
import { User } from '../models/user.model';
import { FollowInput } from '../dtos/follow.user.input'
import { FollowService } from './follow.service'  
import { Follow } from '../models/follow.model';

@Resolver(of => Follow)
export class FollowResolver {

  constructor(private readonly followService: FollowService) {}

 @Mutation(() => Follow!)
  async followUser(@Args('followInput') followInput: FollowInput) {
      
      return await this.followService.followUser(followInput);
  }

}

