import 'dotenv/config';
import process from 'node:process';

import { lambda, sdk } from '@pulumi/aws';

import type { CUser, IUser } from '#tables/tables/user';
import type { lambdaEvent } from '#utils/util';

import { TokenTable, UsersTable } from '#tables/index';
import { validateUserBody } from '#tables/validation/users';
import {
  deconstruct,
  userEpoch,
  currentEndpoint,
  CUSTOM_ERROR_CODES,
  makeCustomError,
  cryptoDecrypt,
  cryptoEncrypt,
  decodeJWT,
  STATUS_CODES,
  jwtSign,
  populateResponse,
  updateObject,
} from '#utils/util';

/**
 * The signIn lambda
 * @description
 * - The lambda is used to sign in a user
 * - The lambda is triggered by a POST request to /users/signIn
 *
 * @see https://www.pulumi.com/docs/guides/crosswalk/aws/api-gateway/#lambda-request-handling
 */
export const signIn = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('signIn', {
  runtime: lambda.Runtime.NodeJS16dX,
  environment: {
    variables: {
      NODE_ENV: process.env.NODE_ENV!,
    },
  },
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

      if (
        cryptoDecrypt(hashedPassword) === password ||
        // since we don't store hashed password in development
        (process.env.NODE_ENV === 'development' && hashedPassword === password)
      ) {
        // sign token
        const token = jwtSign(userID, email);
        const updateObj: IUser = {
          token: cryptoEncrypt(token),
        };
        const { ExpressionAttributeNames, ExpressionAttributeValues, UpdateExpression } = updateObject(updateObj);
        const userDbToken = cryptoDecrypt(hashedToken);
        const expires = decodeJWT(userDbToken).data?.exp ?? Date.now();
        if (!expires && process.env.NODE_ENV !== 'development') {
          return populateResponse(
            STATUS_CODES.INTERNAL_SERVER_ERROR,
            makeCustomError('Seems like an invalid token', CUSTOM_ERROR_CODES.USER_ERROR),
          );
        }

        const tItems = [
          {
            // update token
            Update: {
              TableName: UsersTable.get(),
              Key: { email },
              ConditionExpression: 'attribute_exists(email) AND attribute_exists(userID)',
              ExpressionAttributeNames,
              ExpressionAttributeValues,
              UpdateExpression,
            },
          },
          {
            // blacklist old token
            Put: {
              TableName: TokenTable.get(),
              Item: {
                token: userDbToken || 'token',
                userID,
                expires,
              },
            },
          },
        ];

        await client
          .transactWrite({
            TransactItems: tItems,
          })
          .promise();
        delete user.password;
        delete user.token;
        const { timestamp } = deconstruct(userID, userEpoch);
        return populateResponse(STATUS_CODES.OK, { ...user, token, createdAt: timestamp });
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
