import { Field, ArgsType, Int } 
  from '@nestjs/graphql';

@ArgsType()
export class FeedsInput { 

    @Field({ nullable: false })
    userId: string;

    @Field(() => Int)
    first: number;

    @Field({ nullable: true })
    after?: string;
}
