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
 * Get a post
 * @description
 * - The post is retrieved from the database
 * - The lambda is triggered by a GET request to /posts/post/{postID}
 *
 * @see https://www.pulumi.com/docs/guides/crosswalk/aws/api-gateway/#lambda-request-handling
 */
export const getPost = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('getPost', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const { postID } = event.pathParameters!;

    const client = new sdk.DynamoDB.DocumentClient(currentEndpoint);
    try {
      const { Items } = await client
        .query({
          TableName: PostsTable.get(),
          KeyConditionExpression: 'postID = :postID',
          ExpressionAttributeValues: {
            ':postID': postID,
          },
          IndexName: 'postID',
        })
        .promise();

      if (!Items?.[0])
        return populateResponse(
          STATUS_CODES.NOT_FOUND,
          makeCustomError('Post not found', CUSTOM_ERROR_CODES.RESOURCE_NOT_FOUND),
        );
      const post = Items[0];
      const { Items: tags } = await client
        .query({
          TableName: TagsTable.get(),
          IndexName: 'postID',
          KeyConditionExpression: 'postID = :postID',
          ExpressionAttributeValues: {
            ':postID': postID,
          },
        })
        .promise();
      if (tags) post.tags = tags.map(tag => tag.tag);
      const { timestamp } = deconstruct(post.postID, postEpoch);
      return populateResponse(STATUS_CODES.OK, { ...post, createdAt: timestamp });
    } catch (error) {
      console.error(error);
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Internal Server Error', CUSTOM_ERROR_CODES.POST_ERROR),
      );
    }
  },
});
