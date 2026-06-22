import DataLoader from 'dataloader';
import { User } from '../models/user.model'

export interface IDataloaders {
    authorsLoader: DataLoader<string, User>
}
