import { authLambda } from '../auth';

import type { LambdaAuthorizer, Route } from '@pulumi/awsx/classic/apigateway';

import { createPosts, deletePost, getPosts, updatePosts, feed, getPost } from '#lambdas/index';

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
 * The routes for the posts
 * @description
 * - The routes are used to route requests to the lambda functions
 *
 * @see https://www.pulumi.com/registry/packages/aws-apigateway/api-docs/restapi/#route
 */
export const POST_ROUTES: Route[] = [
  {
    path: '/posts/create',
    method: 'POST',
    eventHandler: createPosts,
    authorizers,
  },
  {
    path: '/posts/update/{postID}',
    method: 'PATCH',
    requiredParameters: [{ name: 'postID', in: 'path' }],
    eventHandler: updatePosts,
  },
  {
    path: '/posts/delete/{postID}',
    method: 'DELETE',
    requiredParameters: [{ name: 'postID', in: 'path' }],
    eventHandler: deletePost,
    authorizers,
  },
  {
    path: '/posts/post/{postID}',
    method: 'GET',
    requiredParameters: [{ name: 'postID', in: 'path' }],
    eventHandler: getPost,
  },
  {
    path: '/posts/{userID}',
    method: 'GET',
    requiredParameters: [{ name: 'userID', in: 'path' }],
    eventHandler: getPosts,
  },
  {
    path: '/posts/feed/{postID}',
    method: 'GET',
    eventHandler: feed,
    requiredParameters: [{ name: 'postID', in: 'path' }],
    authorizers,
  },
];
