import { lambda, sdk } from '@pulumi/aws';

import { getToken } from '../../auth';

import type { CPost, IPost } from '#tables/tables/post';
import type { lambdaEvent } from '#utils/util';

import { PostsTable } from '#tables/index';
import { validatePostBody } from '#tables/validation/posts';
import { decodeJWT, generateFlake, populateResponse, postEpoch, STATUS_CODES } from '#utils/util';

export const createPosts = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('createPosts', {
  callback: async event => {
    const { error, parsed } = validatePostBody(event, { title: true, content: true });
    if (!parsed || error) return populateResponse(STATUS_CODES.BAD_REQUEST, error ?? 'Bad Request');

    const { title, content } = parsed as IPost & Pick<CPost, 'content' | 'title'>;
    const userID = decodeJWT(getToken(event as any)).data?.id;
    if (!userID) return populateResponse(STATUS_CODES.UNAUTHORIZED, 'Unauthorized');

    const postID = generateFlake(Date.now(), postEpoch);

    const post: IPost = {
      postID,
      title,
      content,
      userID,
      comments: [],
    };

    const client = new sdk.DynamoDB.DocumentClient();
    try {
      await client
        .put({
          TableName: PostsTable.get(),
          Item: post,
          ConditionExpression: 'attribute_not_exists(userID)',
        })
        .promise();

      return populateResponse(STATUS_CODES.OK, post);
    } catch (error) {
      console.error(error);
      return populateResponse(STATUS_CODES.INTERNAL_SERVER_ERROR, 'Error creating post');
    }
  },
});
