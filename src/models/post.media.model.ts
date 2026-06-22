import  {
  Field, 
  Int, registerEnumType, 
  ID, ObjectType 
} from '@nestjs/graphql';
import { Post } from './post.model';
import { MediaType, MediaStatus } from '../generated/prisma/client'
import { GraphQLBigInt } from 'graphql-scalars';

registerEnumType(MediaStatus, {
  name: 'MediaStatus'
})

registerEnumType(MediaType, {
  name: 'MediaType'
})

@ObjectType()
export class Media {
  
  @Field(type => ID)
  id: string;

  @Field({ nullable: false })
  ownerId: string;

  @Field(type => MediaType)
  type: MediaType;

  @Field({ nullable: false })
  mimeType: string;

  @Field(type => GraphQLBigInt)
  sizeBytes: bigint;

  @Field(type => MediaStatus)
  status: MediaStatus

  @Field(type => Int)
  durationSeconds?: number | null;

  @Field(() => String, { nullable: true })
  thumbnailUrl?: string | undefined | null ;
}

@ObjectType()
export class PostMedia {

  @Field(type => ID)
  postId: string;

  @Field({ nullable: false })
  mediaId: string;

  @Field(type => Int)
  order: number

  @Field(type => Post)
  post: Post;

  @Field(() => Media)
  media: Media
}

