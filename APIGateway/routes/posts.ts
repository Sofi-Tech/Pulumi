import { authLambda } from '../../APIGateway/auth';
import { createPosts, updatePosts } from '../lambdas/index';

import type { LambdaAuthorizer, Route } from '@pulumi/awsx/classic/apigateway';

export const POST_ROUTES: Route[] = [
  {
    path: '/posts/create',
    method: 'POST',
    eventHandler: createPosts,
    authorizers: [
      {
        authType: 'custom',
        parameterName: 'Authorization',
        type: 'request',
        identitySource: ['method.request.header.Authorization'],
        handler: authLambda,
        authorizerResultTtlInSeconds: 0,
      } as LambdaAuthorizer,
    ],
  },
  {
    path: '/posts/update',
    method: 'PATCH',
    eventHandler: updatePosts,
  },
  // {
  //   path: '/users/{id}/delete',
  //   method: 'POST',
  //   eventHandler: users.deleteUser,
  // },
  // { path: '/users', method: 'GET', eventHandler: users.getAllUsers },
];
