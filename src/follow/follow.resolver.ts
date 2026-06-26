import { NotFoundException } from '@nestjs/common';
import { Args, Query, Resolver, Parent,Mutation ,
  ResolveField } from '@nestjs/graphql';
import { User } from '../models/user.model';
import { FollowInput, FollowInputResult } from '../dtos/follow.user.input'
import { FollowService } from './follow.service'  
import { Follow } from '../models/follow.model';


@Resolver(of => Follow)
export class FollowResolver {

  constructor(private readonly followService: FollowService) {}

 @Mutation(() => FollowInputResult)
  async followUser(@Args('followInput') followInput: FollowInput) {
      
      try {

      console.log(`followUser()`)
    
      await this.followService.followUser(followInput);
      return followInput;

      } catch(error) {
          throw new NotFoundException(`Unsuccessful follow`)
      }

      return followInput;
  }

}

