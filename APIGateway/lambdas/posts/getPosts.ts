// write get posts lambda

import { lambda, sdk } from '@pulumi/aws';

import type { lambdaEvent } from '#utils/util';

import { PostsTable } from '#tables/index';
import {
  deconstruct,
  postEpoch,
  currentEndpoint,
  CUSTOM_ERROR_CODES,
  makeCustomError,
  populateResponse,
  STATUS_CODES,
} from '#utils/util';

/**
 * Get all posts
 * @description
 * - The posts are retrieved from the database
 * - The lambda is triggered by a GET request to /posts/{userID}
 *
 * @see https://www.pulumi.com/docs/guides/crosswalk/aws/api-gateway/#lambda-request-handling
 */
export const getPosts = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('getPosts', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const { userID } = event.pathParameters!;
    const client = new sdk.DynamoDB.DocumentClient(currentEndpoint);

    try {
      const { Items } = await client
        .query({
          TableName: PostsTable.get(),
          KeyConditionExpression: 'userID = :userID',
          ExpressionAttributeValues: {
            ':userID': userID,
          },
        })
        .promise();

      if (!Items) {
        return populateResponse(
          STATUS_CODES.NOT_FOUND,
          makeCustomError('No posts found', CUSTOM_ERROR_CODES.RESOURCE_NOT_FOUND),
        );
      }

      return populateResponse(
        STATUS_CODES.OK,
        Items.map(post => {
          const { timestamp } = deconstruct(post.postID, postEpoch);
          return { ...post, createdAt: timestamp };
        }),
      );
    } catch (error) {
      console.error(error);
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Internal Server Error', CUSTOM_ERROR_CODES.POST_ERROR),
      );
    }
  },
});
