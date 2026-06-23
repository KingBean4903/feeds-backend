import { Args, Query, ResolveField, Context,
  Resolver, Parent, Mutation }
from '@nestjs/graphql';
import { Post, 
        FeedConnection
} from '../models/post.model';
import { FeedsInput, 
  PostPayload } from '../dtos/feeds.input'
import { FeedsService } from './feeds.service';
import { PostsService } from './posts.service';
import { User } from '../models/user.model';
import { IDataloaders } from '../dataloader/dataloader.interface'

@Resolver(of => Post)
export class PostResolver {

  constructor(
    private readonly feedsService: FeedsService,
    private readonly postsService: PostsService
  ){}

  @Mutation(() => Post)
  async createPost(@Args('postPayload') postPayload: PostPayload) {
    return this.postsService.createPost(
          {
              text: postPayload.text,
              visibility: postPayload.visibility,
              authorId: `${postPayload.authorId}`,
              type: postPayload.type
          })
  }

  @Query(() => FeedConnection)
  async feed(@Args() args: FeedsInput):
        Promise<FeedConnection> {
      
        return this.feedsService.getFeed(
          args.userId,
          args.first,
          args.after,
        );
  }

  @ResolveField(() => User)
  async author(
      @Parent() post: Post,
      @Context() { loaders }: { loaders: IDataloaders}
  ) {
        return loaders.authorsLoader.load(
            post.authorId,
        )
  }


}
