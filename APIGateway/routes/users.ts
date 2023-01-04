import { authLambda } from '../auth';

import type { LambdaAuthorizer, Route } from '@pulumi/awsx/classic/apigateway';

import { signUp, signIn, signout, getUser, getUserByEmail, updateUser } from '#lambdas/index';

/**
 * The authorizers for the comments routes
 * @description
 * - The authorizers are used to authorize requests to the lambda functions
 *
 * @see https://www.pulumi.com/registry/packages/aws-apigateway/api-docs/restapi/#authorizer
 */
export const authorizers = [
  {
    authType: 'custom',
    parameterName: 'Authorization',
    type: 'request',
    identitySource: ['method.request.header.Authorization'],
    handler: authLambda,
    authorizerResultTtlInSeconds: 0,
  } as LambdaAuthorizer,
];

/**
 * The routes for the users
 * @description
 * - The routes are used to route requests to the lambda functions
 *
 * @see https://www.pulumi.com/registry/packages/aws-apigateway/api-docs/restapi/#route
 */
export const USER_ROUTES: Route[] = [
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
    path: '/users/update/me',
    method: 'PATCH',
    eventHandler: updateUser,
    authorizers,
  },
];
