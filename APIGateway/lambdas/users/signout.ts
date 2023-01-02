import { lambda, sdk } from '@pulumi/aws';

import { TokenTable, UsersTable } from '../../../database/index';

import type { CUser, IUser } from '#tables/tables/user';
import type { lambdaEvent } from '#utils/util';

import { validateUserBody } from '#tables/validation/users';
import {
  currentEndpoint,
  CUSTOM_ERROR_CODES,
  makeCustomError,
  jwtSign,
  updateObject,
  cryptoDecrypt,
  cryptoEncrypt,
  decodeJWT,
  populateResponse,
  STATUS_CODES,
} from '#utils/util';

export const signout = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('signout', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const { parsed, error } = validateUserBody(event, { email: true, password: true });
    if (!parsed || error) {
      return populateResponse(
        STATUS_CODES.BAD_REQUEST,
        makeCustomError(error ?? 'Bad Request', CUSTOM_ERROR_CODES.BODY_NOT_VALID),
      );
    }

    const { email, password } = parsed as IUser & Pick<CUser, 'email' | 'password'>;

    try {
      const client = new sdk.DynamoDB.DocumentClient(currentEndpoint);

      // Get user from database
      const Item = await client
        .get({
          TableName: UsersTable.get(),
          Key: {
            email,
          },
        })
        .promise();

      const { Item: user } = Item;

      if (!user) {
        return populateResponse(
          STATUS_CODES.NOT_FOUND,
          makeCustomError('User not found', CUSTOM_ERROR_CODES.USER_NOT_FOUND),
        );
      }

      const { password: hashedPassword, userID, token: hashedToken } = user as CUser;

      if (cryptoDecrypt(hashedPassword) === password) {
        // sign token
        const token = jwtSign(userID, email);
        const updateObj: IUser = {
          token: cryptoEncrypt(token),
        };
        const { ExpressionAttributeNames, ExpressionAttributeValues, UpdateExpression } = updateObject(updateObj);
        const userDbToken = cryptoDecrypt(hashedToken);
        const expires = decodeJWT(userDbToken).data?.exp;
        if (!expires) {
          return populateResponse(
            STATUS_CODES.INTERNAL_SERVER_ERROR,
            makeCustomError('Seems like an invalid token', CUSTOM_ERROR_CODES.USER_ERROR),
          );
        }

        // Update token in database
        await client
          .update({
            TableName: UsersTable.get(),
            Key: {
              email,
            },
            ExpressionAttributeNames,
            ExpressionAttributeValues,
            UpdateExpression,
          })
          .promise();

        // Delete token from database
        await client
          .put({
            TableName: TokenTable.get(),
            Item: {
              token: userDbToken,
              userID,
              expires,
            },
          })
          .promise();

        return populateResponse(STATUS_CODES.OK, 'User signed out');
      }

      return populateResponse(
        STATUS_CODES.UNAUTHORIZED,
        makeCustomError('Wrong password', CUSTOM_ERROR_CODES.USER_NOT_AUTHORIZED),
      );
    } catch (error) {
      console.error(error);
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Something went wrong', CUSTOM_ERROR_CODES.USER_ERROR),
      );
    }
  },
});
