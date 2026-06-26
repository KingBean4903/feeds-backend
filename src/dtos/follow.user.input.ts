import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class FollowInput { 

    @Field({ nullable: true })
    followingId: string;

    @Field({ nullable : true })
    followerId: string;
}
