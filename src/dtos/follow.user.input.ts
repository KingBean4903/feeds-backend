import { Field, InputType, ObjectType } from '@nestjs/graphql';

@InputType()
export class FollowInput { 

    @Field({ nullable: true })
    followingId: string;

    @Field({ nullable : true })
    followerId: string;
}

@ObjectType()
export class FollowInputResult { 

    @Field({ nullable: true })
    followingId: string;

    @Field({ nullable : true })
    followerId: string;
}



