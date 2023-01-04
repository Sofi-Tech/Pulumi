// write get posts lambda

import { lambda, sdk } from '@pulumi/aws';

import type { lambdaEvent } from '#utils/util';

import { PostsTable, TagsTable } from '#tables/index';
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

      // we use this approach as batch get and transact get have a limit of 25
      // approach two would be to paginate and do 25 at a time.
      const posts = Items.map(async post => {
        const { timestamp } = deconstruct(post.postID, postEpoch);
        const { Items: tags } = await client
          .query({
            TableName: TagsTable.get(),
            IndexName: 'postID',
            KeyConditionExpression: 'postID = :postID',
            ExpressionAttributeValues: {
              ':postID': post.postID,
            },
          })
          .promise();
        if (tags) return { ...post, createdAt: timestamp, tags: tags.map(tag => tag.tag) };
        return { ...post, createdAt: timestamp };
      });
      return populateResponse(STATUS_CODES.OK, await Promise.all(posts));
    } catch (error) {
      console.error(error);
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Internal Server Error', CUSTOM_ERROR_CODES.POST_ERROR),
      );
    }
  },
});
