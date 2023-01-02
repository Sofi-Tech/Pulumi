// write get posts lambda

import { lambda, sdk } from '@pulumi/aws';

import { PostsTable } from '../../../database/index';

import type { lambdaEvent } from '#utils/util';

import { currentEndpoint, CUSTOM_ERROR_CODES, makeCustomError, populateResponse, STATUS_CODES } from '#utils/util';

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
      return populateResponse(STATUS_CODES.OK, post);
    } catch (error) {
      console.error(error);
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Internal Server Error', CUSTOM_ERROR_CODES.POST_ERROR),
      );
    }
  },
});
