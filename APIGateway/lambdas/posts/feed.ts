// write lambda function to get posts for a user feed with tags of inside user

import { lambda, sdk } from '@pulumi/aws';

import { PostsTable, UsersTable } from '../../../database/index';
import { getToken } from '../../auth';

import type { CUser, IUser } from '#tables/tables/user';
import type { lambdaEvent } from '#utils/util';

import { CUSTOM_ERROR_CODES, makeCustomError, decodeJWT, populateResponse, STATUS_CODES } from '#utils/util';

export const feed = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('feed', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const userID = decodeJWT(getToken(event)).data?.id;

    const client = new sdk.DynamoDB.DocumentClient();
    try {
      const { Items } = await client
        .query({
          TableName: UsersTable.get(),
          IndexName: 'userID',
          KeyConditionExpression: 'userID = :id',
          ExpressionAttributeValues: {
            ':id': userID,
          },
        })
        .promise();

      if (!Items?.length) {
        return populateResponse(
          STATUS_CODES.NOT_FOUND,
          makeCustomError('User not found', CUSTOM_ERROR_CODES.USER_NOT_FOUND),
        );
      }

      const { tags } = Items[0] as IUser & Pick<CUser, 'tags'>;

      const ExpressionAttributeValues = tags.reduce<Record<string, string>>((acc, tag, index) => {
        acc[`:tags${index}`] = tag;
        return acc;
      }, {});
      const FilterExpression = tags.reduce<string>((acc, _, index) => {
        if (index === 0) return `contains(tags, :tags${index})`;
        return `${acc} OR contains(tags, :tags${index})`;
      }, '');

      // expensive operation
      const { Items: posts } = await client
        .scan({
          TableName: PostsTable.get(),
          FilterExpression,
          Limit: 10,
          ExpressionAttributeValues,
        })
        .promise();

      if (!posts?.length) {
        return populateResponse(
          STATUS_CODES.NOT_FOUND,
          makeCustomError('Nothing found', CUSTOM_ERROR_CODES.RESOURCE_NOT_FOUND),
        );
      }

      return populateResponse(STATUS_CODES.OK, posts);
    } catch (error) {
      console.error(error);
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Internal Server Error', CUSTOM_ERROR_CODES.POST_ERROR),
      );
    }
  },
});
