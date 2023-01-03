import { authLambda } from '../auth';

import type { LambdaAuthorizer, Route } from '@pulumi/awsx/classic/apigateway';

import { createComment, updateComments, deleteComments, getComments } from '#lambdas/index';

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
 * The routes for the comments
 * @description
 * - The routes are used to route requests to the lambda functions
 *
 * @see https://www.pulumi.com/registry/packages/aws-apigateway/api-docs/restapi/#route
 */
export const COMMENT_ROUTES: Route[] = [
  {
    path: '/comments/create/{postID}',
    method: 'POST',
    requiredParameters: [{ name: 'postID', in: 'path' }],
    eventHandler: createComment,
    authorizers,
  },
  {
    path: '/comments/update/{commentID}',
    method: 'PATCH',
    requiredParameters: [{ name: 'commentID', in: 'path' }],
    eventHandler: updateComments,
    authorizers,
  },
  {
    path: '/comments/delete/{commentID}',
    method: 'DELETE',
    requiredParameters: [{ name: 'commentID', in: 'path' }],
    eventHandler: deleteComments,
    authorizers,
  },
  {
    path: '/comments/{postID}',
    method: 'GET',
    requiredParameters: [{ name: 'postID', in: 'path' }],
    eventHandler: getComments,
  },
];
