// write get posts lambda

import { lambda, sdk } from '@pulumi/aws';

import { PostsTable } from '../../../database/index';

import type { lambdaEvent } from '#utils/util';

import { currentEndpoint, CUSTOM_ERROR_CODES, makeCustomError, populateResponse, STATUS_CODES } from '#utils/util';

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

      return populateResponse(STATUS_CODES.OK, Items);
    } catch (error) {
      console.error(error);
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Internal Server Error', CUSTOM_ERROR_CODES.POST_ERROR),
      );
    }
  },
});
