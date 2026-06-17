import { Field, Int, ID, ObjectType } from '@nestjs/graphql';


@ObjectType()
export class User {

  @Field(type => ID)
  id: number;

  @Field({ nullable: false })
  username: string;

  @Field({ nullable: true})
  displayName?: string;
  
  @Field({ nullable: true})
  bio?: string;

  @Field({ nullable: true})
  avatarUrl?: string;

  @Field({ nullable: false})
  isFollowing: boolean;

  @Field({ nullable: false})
  followingCount: number

  @Field({ nullable: false })
  followersCount: number

  @Field()
  createdAt: Date;

}
