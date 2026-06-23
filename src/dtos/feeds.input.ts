import { Field, InputType,
  ArgsType, Int } 
  from '@nestjs/graphql';
import { PostType, PostVisibility } from '@prisma/client'

@ArgsType()
export class FeedsInput { 

    @Field({ nullable: false })
    userId: string;

    @Field(() => Int)
    first: number;

    @Field({ nullable: true })
    after?: string;
}

@InputType() 
export class PostPayload {

  @Field({ nullable: true})
  text: string;

  @Field({ nullable: true })
  visibility: PostVisibility;

  @Field({ nullable: true })
  authorId: String;

  @Field({ nullable: true })
  type: PostType;
}


export interface Payload {
  type: PostType;
  authorId: string;
  visibility: PostVisibility;
  text: string;
}
