import { lambda, sdk } from '@pulumi/aws';

import { PostsTable } from '../../../database/index';
import { getToken } from '../../auth';

import type { CPost, IPost } from '#tables/tables/post';
import type { lambdaEvent } from '#utils/util';

import { validatePostBody } from '#tables/validation/posts';
import { decodeJWT, populateResponse, STATUS_CODES, updateObject } from '#utils/util';

export const updatePosts = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('updatePosts', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const { error, parsed } = validatePostBody(event, { postID: true });
    if (!parsed || error) return populateResponse(STATUS_CODES.BAD_REQUEST, error ?? 'Bad Request');

    const { postID, title, content, tags } = parsed as IPost & Pick<CPost, 'postID'>;
    const userID = decodeJWT(getToken(event)).data?.id;
    if (!userID) return populateResponse(STATUS_CODES.UNAUTHORIZED, 'Unauthorized');

    const updateObj = {
      ...(title && { title }),
      ...(content && { content }),
      ...(tags && { tags }),
      ...(title || content || tags ? { updated: Date.now() } : {}),
    };

    if (!Object.keys(updateObj).length) return populateResponse(STATUS_CODES.BAD_REQUEST, 'No fields to update');

    const { ExpressionAttributeNames, ExpressionAttributeValues, UpdateExpression } = updateObject(updateObj);

    const client = new sdk.DynamoDB.DocumentClient();
    try {
      await client
        .update({
          TableName: PostsTable.get(),
          Key: {
            userID,
            postID,
          },
          ConditionExpression: 'attribute_exists(postID)',
          UpdateExpression,
          ExpressionAttributeNames,
          ExpressionAttributeValues,
        })
        .promise();
      return populateResponse(STATUS_CODES.OK, {
        patchedFields: {
          ...updateObj,
        },
      });
    } catch (error) {
      console.error(error);
      return populateResponse(STATUS_CODES.INTERNAL_SERVER_ERROR, 'Error updating post');
    }
  },
});
