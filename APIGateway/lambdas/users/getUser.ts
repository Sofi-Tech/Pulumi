import { lambda, sdk } from '@pulumi/aws';

import type { IUser } from '#tables/tables/user';
import type { lambdaEvent } from '#utils/util';

import { UsersTable } from '#tables/index';
import { CUSTOM_ERROR_CODES, makeCustomError, populateResponse, STATUS_CODES } from '#utils/util';

export const getUser = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('getUser', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const { userID } = event.pathParameters!;

    try {
      const client = new sdk.DynamoDB.DocumentClient();
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
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          makeCustomError('User not found', CUSTOM_ERROR_CODES.USER_NOT_FOUND),
        );
      }

      const user = Items[0] as IUser;
      return populateResponse(STATUS_CODES.OK, user);
    } catch (error) {
      if ((error as any).code === 'ConditionalCheckFailedException') {
        return populateResponse(
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          makeCustomError('User with that email already exists', CUSTOM_ERROR_CODES.USER_ALREADY_EXISTS),
        );
      }

      console.error(error);
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Internal Server Error', CUSTOM_ERROR_CODES.USER_ERROR),
      );
    }
  },
});

export const getUserByEmail = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('getUserByEmail', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const { email } = event.pathParameters!;

    try {
      const client = new sdk.DynamoDB.DocumentClient();
      const user = await client
        .get({
          TableName: UsersTable.get(),
          Key: {
            email,
          },
        })
        .promise();

      return populateResponse(STATUS_CODES.OK, user);
    } catch (error) {
      console.error(error);
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Internal Server Error', CUSTOM_ERROR_CODES.USER_ERROR),
      );
    }
  },
});
