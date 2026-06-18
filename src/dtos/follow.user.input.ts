import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class FollowUserInput { 

    @Field()
    userId: number;

}
