import  { 
  Field, 
  Int, registerEnumType, 
  ID, ObjectType } from '@nestjs/graphql';
import { PostMedia } from './post.media.model'
import { PostType, PostVisibility
} from '../generated/prisma/client';

/* export enum PostVisibility { 
  PUBLIC="PUBLIC",
  FOLLOWERS="FOLLOWERS"
} */

/*export enum PostType {
  TEXT="TEXT",
  IMAGE="IMAGE",
  AUDIO="AUDIO",
  VIDEO="VIDEO"
}*/

registerEnumType(PostVisibility, {
  name: 'PostVisibility'
})

registerEnumType(PostType, {
  name: 'PostType'
})

@ObjectType()
export class PageInfo {
  
  @Field()
  hasNextPage: boolean;

  @Field(() => String, { nullable:  true })
  endCursor?: string | null | undefined;
}

@ObjectType()
export class Post { 

  @Field(type => ID)
  id: string;

  @Field(type => PostType)
  type: PostType;

  @Field({ nullable: false })
  authorId: string;

  @Field(() => String, { nullable: true })
  text?: string | undefined | null

  @Field(type => PostVisibility)
  visibility: PostVisibility;

  @Field(type => [PostMedia],
         { nullable: true })
  media?: PostMedia[];

  @Field(() => PostStats,
         { nullable: true})
  stats?: PostStats | null;
}

@ObjectType()
export class PostStats {
  
  @Field(type => ID)
  postId: string;

  @Field(type => Int)
  likesCount: number;
    
  @Field(type => Int)
  commentsCount: number;

  @Field(type => Int)
  repostsCount: number;

  @Field(type => Int)
  viewsCount: number;

  @Field(() => Post)
  post: Post;
} 


@ObjectType()
export class PostEdge {
  
  @Field(type => Post)
  node: Post;

  @Field({ nullable: true})
  cursor?: string;
}

@ObjectType()
export class FeedConnection {
  
  @Field(type => [PostEdge])
  edges: PostEdge[]

  @Field(type => PageInfo!)
  pageInfo: PageInfo;
}


