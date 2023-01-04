import { lambda, sdk } from '@pulumi/aws';

import { getToken } from '../../auth';

import type { IUser } from '#tables/tables/user';
import type { lambdaEvent } from '#utils/util';

import { UsersTable } from '#tables/index';
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

/**
 * The updateUser lambda
 * @description
 * - The lambda is used to update a user
 * - The lambda is triggered by a PATCH request to /users/update/{userID}
 *
 * @see https://www.pulumi.com/docs/guides/crosswalk/aws/api-gateway/#lambda-request-handling
 */
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
    if (!email) {
      return populateResponse(
        STATUS_CODES.UNAUTHORIZED,
        makeCustomError('Unauthorized', CUSTOM_ERROR_CODES.USER_ERROR),
      );
    }

    const { parsed, error } = validateUserBody(event, {});
    if (!parsed || error) {
      return populateResponse(
        STATUS_CODES.BAD_REQUEST,
        makeCustomError(error ?? 'Bad Request', CUSTOM_ERROR_CODES.BODY_NOT_VALID),
      );
    }

    const client = new sdk.DynamoDB.DocumentClient(currentEndpoint);
    const { name, tags } = parsed as IUser;
    const updateObj = {
      ...(name && { name }),
      ...(tags && { tags }),
      ...(name || tags ? { updated: Date.now() } : {}),
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
