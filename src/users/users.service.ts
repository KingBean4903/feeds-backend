import { Injectable } from '@nestjs/common';
import { User } from '../models/user.model'

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
  ]

  async findOneById(id: number): Promise<User  | undefined> {
      return this.users.find((one) => one.id === id)
  }


  /* async profile(id: string): Promise<User> {

  }

  async followers(id: string): Promise<User> {

  }

  async following(id: string): Promise<User> {

  } */
}
