import { authLambda } from '../auth';

import type * as awsx from '@pulumi/awsx';
import type { LambdaAuthorizer } from '@pulumi/awsx/classic/apigateway';

import { signUp, signIn, signout, getUser, getUserByEmail, updateUser } from '#lambdas/index';

const authorizers = [
  {
    authType: 'custom',
    parameterName: 'Authorization',
    type: 'request',
    identitySource: ['method.request.header.Authorization'],
    handler: authLambda,
    authorizerResultTtlInSeconds: 0,
  } as LambdaAuthorizer,
];
export const USER_ROUTES: awsx.classic.apigateway.Route[] = [
  {
    path: '/users/signup',
    method: 'POST',
    eventHandler: signUp,
  },
  {
    path: '/users/signin',
    method: 'POST',
    eventHandler: signIn,
  },
  {
    path: '/users/signout',
    method: 'POST',
    eventHandler: signout,
  },
  {
    path: '/users/{userID}',
    method: 'GET',
    requiredParameters: [{ name: 'userID', in: 'path' }],
    eventHandler: getUser,
  },
  {
    path: '/users/email/{email}',
    method: 'GET',
    requiredParameters: [{ name: 'email', in: 'path' }],
    eventHandler: getUserByEmail,
  },
  {
    path: '/users/update/{userID}',
    method: 'PATCH',
    requiredParameters: [{ name: 'userID', in: 'path' }],
    eventHandler: updateUser,
    authorizers,
  },
];
