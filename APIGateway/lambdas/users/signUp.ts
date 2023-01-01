import { lambda, sdk } from '@pulumi/aws';

import type { CUser, IUser } from '#tables/tables/user';

import { UsersTable } from '#tables/index';
import { validateUserBody } from '#tables/validation/users';
import { cryptoEncrypt, generateFlake, userEpoch, jwtSign, populateResponse } from '#utils/util';

export const signUp = new lambda.CallbackFunction('signUp', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const { error, parsed } = validateUserBody(event, { email: true, password: true, name: true });

    if (!parsed || error) return populateResponse(400, error ?? 'Bad Request');
    const { email, password } = parsed as CUser;
    const id = generateFlake(Date.now(), userEpoch);

    try {
      const token = jwtSign(id);
      const user: IUser = {
        userID: id,
        email,
        password: cryptoEncrypt(password),
        token: cryptoEncrypt(token),
      };
      const client = new sdk.DynamoDB.DocumentClient();
      await client
        .put({
          TableName: UsersTable.get(),
          Item: user,
          ConditionExpression: 'attribute_not_exists(email) AND attribute_not_exists(userID)',
        })
        .promise();

      delete user.token;
      return populateResponse(200, { ...user, token });
    } catch (error) {
      if ((error as any).code === 'ConditionalCheckFailedException')
        return populateResponse(400, 'User with that email already exists');

      console.error(error);
      return populateResponse(500, 'Internal Server Error');
    }
  },
});
