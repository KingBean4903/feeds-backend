import { Injectable, Inject } from '@nestjs/common';
import { UserService } from '../users/users.service'
import { IDataloaders } from './dataloader.interface';
import DataLoader from 'dataloader';
import { User } from '../models/user.model'

@Injectable()
export class DataLoaderService {

  constructor(private readonly userService: UserService
) {}

  getLoaders(): IDataloaders {
    const authorsLoader=  this._createAuthorsLoader()
    return {
      authorsLoader,
    }

  }

  private _createAuthorsLoader() {
    
    return new DataLoader<string, User>(
      async (userIds: readonly string[]): 
        Promise<(User | any)[]> => {
          const users = 
            await this.userService.findMany(
                [...userIds],
            );

          const map = new Map(
              users.map((u) => [u.id, u]),
          );

          return userIds.map(
              (id) => map.get(id),
          )
      }
    )

  }


}
