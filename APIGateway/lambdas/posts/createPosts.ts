import { lambda, sdk } from '@pulumi/aws';

import { getToken } from '../../auth';

import type { CPost, IPost } from '#tables/tables/post';
import type { lambdaEvent } from '#utils/util';

import { PostsTable } from '#tables/index';
import { validatePostBody } from '#tables/validation/posts';
import {
  CUSTOM_ERROR_CODES,
  makeCustomError,
  decodeJWT,
  generateFlake,
  populateResponse,
  postEpoch,
  STATUS_CODES,
} from '#utils/util';

export const createPosts = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('createPosts', {
  callback: async event => {
    const { error, parsed } = validatePostBody(event, { title: true, content: true, tags: true });
    if (!parsed || error) {
      return populateResponse(
        STATUS_CODES.BAD_REQUEST,
        makeCustomError(error ?? 'Bad Request', CUSTOM_ERROR_CODES.BODY_NOT_VALID),
      );
    }

    const { title, content, tags } = parsed as IPost & Pick<CPost, 'content' | 'tags' | 'title'>;
    const userID = decodeJWT(getToken(event)).data?.id;

    if (!userID) {
      return populateResponse(
        STATUS_CODES.UNAUTHORIZED,
        makeCustomError('Unauthorized', CUSTOM_ERROR_CODES.USER_NOT_AUTHORIZED),
      );
    }

    const postID = generateFlake(Date.now(), postEpoch);

    const post: IPost = {
      postID,
      title,
      content,
      userID,
      tags,
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
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Error creating post', CUSTOM_ERROR_CODES.POST_ERROR),
      );
    }
  },
});
