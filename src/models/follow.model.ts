import {
    Field, Int, ID, ObjectType
} from '@nestjs/graphql';

@ObjectType()
export class Follow {
  
  @Field(type => ID)
  id: string;

  @Field({ nullable: false })
  followerId: string;

  @Field({ nullable: false })
  followingId: string;

  @Field()
  createdAt: Date;
}
