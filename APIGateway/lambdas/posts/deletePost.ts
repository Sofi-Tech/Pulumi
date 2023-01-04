// delete post code here
import { lambda, sdk } from '@pulumi/aws';

import { getToken } from '../../auth';

import type { lambdaEvent } from '#utils/util';

import { PostsTable, TagsTable } from '#tables/index';
import {
  currentEndpoint,
  CUSTOM_ERROR_CODES,
  makeCustomError,
  decodeJWT,
  populateResponse,
  STATUS_CODES,
} from '#utils/util';

/**
 * Delete a post
 * @description
 * - The post is deleted from the database
 * - The lambda is triggered by a DELETE request to /posts/delete/{postID}
 *
 * @see https://www.pulumi.com/docs/guides/crosswalk/aws/api-gateway/#lambda-request-handling
 */
export const deletePost = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('deletePost', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const { postID } = event.pathParameters!;

    const userID = decodeJWT(getToken(event)).data?.id;
    if (!userID) {
      return populateResponse(
        STATUS_CODES.UNAUTHORIZED,
        makeCustomError('You are not authorized', CUSTOM_ERROR_CODES.USER_NOT_AUTHORIZED),
      );
    }

    const client = new sdk.DynamoDB.DocumentClient(currentEndpoint);
    try {
      const { Items } = await client
        .query({
          TableName: TagsTable.get(),
          IndexName: 'postID',
          KeyConditionExpression: 'postID = :postID',
          ExpressionAttributeValues: {
            ':postID': postID,
          },
        })
        .promise();

      if (!Items?.length)
        return populateResponse(
          STATUS_CODES.NOT_FOUND,
          makeCustomError('Post not found', CUSTOM_ERROR_CODES.POST_ERROR),
        );

      const oldTag = Items[0].tag;

      await client
        .transactWrite({
          TransactItems: [
            {
              Delete: {
                TableName: TagsTable.get(),
                Key: {
                  postID,
                  tag: oldTag,
                },
              },
            },
            {
              Delete: {
                TableName: PostsTable.get(),
                Key: {
                  userID,
                  postID,
                },
                ConditionExpression: 'attribute_exists(postID)',
              },
            },
          ],
        })
        .promise();

      return populateResponse(STATUS_CODES.OK, 'Post deleted');
    } catch (error) {
      if ((error as any).code === 'ConditionalCheckFailedException') {
        return populateResponse(
          STATUS_CODES.NOT_FOUND,
          makeCustomError('You cannot delete this post', CUSTOM_ERROR_CODES.RESOURCE_NOT_FOUND),
        );
      }

      console.error(error);
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Internal Server Error', CUSTOM_ERROR_CODES.POST_ERROR),
      );
    }
  },
});
