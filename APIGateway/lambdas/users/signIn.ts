import { lambda, sdk } from '@pulumi/aws';

import type { CUser, IUser } from '#tables/tables/user';

import { TokenTable, UsersTable } from '#tables/index';
import { validateUserBody } from '#tables/validation/users';
import {
  cryptoDecrypt,
  cryptoEncrypt,
  decodeJWT,
  STATUS_CODES,
  jwtSign,
  populateResponse,
  updateObject,
} from '#utils/util';

export const signIn = new lambda.CallbackFunction('signIn', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const { parsed, error } = validateUserBody(event, { email: true });
    if (!parsed || error) return populateResponse(STATUS_CODES.BAD_REQUEST, error ?? 'Bad Request');

    const { email, password } = parsed as CUser;

    try {
      const client = new sdk.DynamoDB.DocumentClient();

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

      if (!user) return populateResponse(STATUS_CODES.NOT_FOUND, 'User not found');

      const { password: hashedPassword, userID, token: hashedToken } = user as CUser;

      if (cryptoDecrypt(hashedPassword) === password) {
        // sign token
        const token = jwtSign(userID);
        const updateObj: IUser = {
          token: cryptoEncrypt(token),
        };
        const { ExpressionAttributeNames, ExpressionAttributeValues, UpdateExpression } = updateObject(updateObj);
        const userDbToken = cryptoDecrypt(hashedToken);
        const expires = decodeJWT(userDbToken).data?.exp;
        if (!expires) return populateResponse(STATUS_CODES.INTERNAL_SERVER_ERROR, 'Something went wrong');

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
                token: userDbToken,
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
        return populateResponse(STATUS_CODES.OK, { ...user, token });
      }

      return populateResponse(STATUS_CODES.UNAUTHORIZED, 'Wrong password');
    } catch (error) {
      console.error(error);
      return populateResponse(STATUS_CODES.INTERNAL_SERVER_ERROR, 'Something went wrong');
    }
  },
});
