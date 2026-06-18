import { Injectable } from '@nestjs/common';
import { User } from '../models/user.model'
import { FollowUserInput } from '../dtos/follow.user.input'

@Injectable()
export class UserService {

  users: User[] = [
      {
          id: 1001,
          username: 'Gyorokes',
          displayName: 'Glocko',
          isFollowing: true,
          followingCount: 2,
          followersCount: 2,
          createdAt: new Date()
      },
      {
          id: 2002,
          username: 'Xhaka',
          displayName: 'XBoom',
          isFollowing: true,
          followingCount: 2,
          followersCount: 2,
          createdAt: new Date()
      },
      {
          id: 3002,
          username: 'Thiery',
          displayName: 'titi',
          isFollowing: true,
          followingCount: 2,
          followersCount: 2,
          createdAt: new Date()
      },
  ];

  followers = [
        {
          id: 4568,
          user_id: 1001,
          follower_id: 2002
        },
        {
          id: 6568,
          user_id: 1001,
          follower_id: 3002
        },
        {
          id: 2368,
          user_id: 2002,
          follower_id: 1001
        },
        {
          id: 1568,
          user_id: 2002,
          follower_id: 3002
        },
  ]

  following = [
      {
        id :"fllw_id_344",
        followerId: 1001,
        followingId: 2002
      },
      {
        id :"fllw_id_899",
        followerId: 2002,
        followingId: 3002
      }

  ];

  async findOneById(id: number): Promise<User  | undefined> {
      return this.users.find((one) => one.id === id)
  }

  async getFollowers(id: number): Promise<User[]>{

      const fUsers: User[]= this.followers
                  .filter((one) => one.user_id === id)
                  .map(one => 
                       this.users.find((user) => 
                          user.id == one.follower_id ))
                  .filter(user => user != undefined)
      return fUsers;
  }

  async getFollowing(id: number): Promise<User[]>{

      const fUsers: User[]= this.following
                  .filter((one) => one.followerId === id)
                  .map(one => 
                       this.users.find((user) => 
                          user.id == one.followingId ))
                  .filter(user => user != undefined)

      return fUsers;
  }

  async followUser(input: FollowUserInput) {

      const { userId } = input;
      
        this.following.push({
          id :"fllw_id_809",
          followerId: userId,
          followingId: 3002 
        })

      return this.users.find((one) => one.id === userId)

  }

  async unFollowUser(input: FollowUserInput) {

      const { userId } = input;

      this.following.filter((user) => userId !== 2002)
      
      return this.users.find((one) => one.id === userId)

  }
}
