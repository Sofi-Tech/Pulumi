import { lambda, sdk } from '@pulumi/aws';

import { UsersTable } from '../../../database/index';
import { getToken } from '../../auth';

import type { IUser } from '#tables/tables/user';
import type { lambdaEvent } from '#utils/util';

import { validateUserBody } from '#tables/validation/users';
import {
  currentEndpoint,
  CUSTOM_ERROR_CODES,
  makeCustomError,
  updateObject,
  decodeJWT,
  populateResponse,
  STATUS_CODES,
} from '#utils/util';

export const updateUser = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('updateUser', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const email = decodeJWT(getToken(event)).data?.email;
    const { parsed, error } = validateUserBody(event, {});
    if (!parsed || error) {
      return populateResponse(
        STATUS_CODES.BAD_REQUEST,
        makeCustomError(error ?? 'Bad Request', CUSTOM_ERROR_CODES.BODY_NOT_VALID),
      );
    }

    const client = new sdk.DynamoDB.DocumentClient(currentEndpoint);
    const { name, password, tags } = parsed as IUser;
    const updateObj = {
      ...(name && { name }),
      ...(password && { password }),
      ...(tags && { tags }),
      ...(name || password || tags ? { updated: Date.now() } : {}),
    };

    if (!Object.keys(updateObj).length) {
      return populateResponse(
        STATUS_CODES.BAD_REQUEST,
        makeCustomError('No fields to update', CUSTOM_ERROR_CODES.USER_ERROR),
      );
    }

    const { ExpressionAttributeNames, ExpressionAttributeValues, UpdateExpression } = updateObject(updateObj);

    try {
      await client
        .update({
          TableName: UsersTable.get(),
          Key: {
            email,
          },
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
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Internal Server Error', CUSTOM_ERROR_CODES.USER_ERROR),
      );
    }
  },
});