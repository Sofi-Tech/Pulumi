import { lambda, sdk } from '@pulumi/aws';

import type { CUser, IUser } from '#tables/tables/user';
import type { classic } from '@pulumi/awsx';

import { TokenTable, UsersTable } from '#tables/index';
import { cryptoDecrypt, decodeJWT, jwtVerify } from '#utils/util';

export const getToken = (event: classic.apigateway.AuthorizerEvent): string => {
  const header = event.headers?.Authorization;
  if (header && header.split(' ')[0] === 'Bearer') return header.split(' ')[1];
  return '';
};

const authenticate = async (event: classic.apigateway.AuthorizerEvent): Promise<string> => {
  const token = getToken(event);
  const decoded = decodeJWT(token);

  if (!decoded.success) return 'Deny';

  const id = decoded.data?.id;
  if (!id) return 'Deny';

  try {
    const client = new sdk.DynamoDB.DocumentClient();
    const promises = [
      client
        .query({
          TableName: UsersTable.get(),
          IndexName: 'userID',
          KeyConditionExpression: 'userID = :id',
          ExpressionAttributeValues: {
            ':id': id,
          },
        })
        .promise(),
      // get blacklisted token
      client
        .query({
          TableName: TokenTable.get(),
          IndexName: 'token',
          KeyConditionExpression: '#tk = :tk',
          ExpressionAttributeValues: {
            ':tk': token,
          },
          ExpressionAttributeNames: {
            '#tk': 'token',
          },
        })
        .promise(),
    ];
    const [result, blacklistedTokens] = await Promise.all(promises);

    // check if token is blacklisted
    if (blacklistedTokens.Items?.length) {
      const isTokenBlacklisted = blacklistedTokens.Items.some(item => item.token === token);
      if (isTokenBlacklisted) return 'Deny';
    }

    const { Items } = result;
    if (!Items?.length || !Items[0]?.token) return 'Deny';
    const { token: hashedToken } = Items[0] as IUser & Pick<CUser, 'token'>;

    // check if the token is from the correct user
    if (cryptoDecrypt(hashedToken) === token) {
      const verifiedJWT = jwtVerify(token);
      if (!verifiedJWT.success) return 'Deny';
      return 'Allow';
    }

    return 'Deny';
  } catch (error) {
    console.error(error);
    return 'Deny';
  }
};

export const authLambda = new lambda.CallbackFunction('authMiddleware', {
  callback: async (event: classic.apigateway.AuthorizerEvent) => {
    let effect = 'Allow';
    try {
      effect = await authenticate(event);
    } catch {
      effect = 'Deny';
    }

    return {
      principalId: 'my-user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: event.methodArn,
          },
        ],
      },
    };
  },
});
