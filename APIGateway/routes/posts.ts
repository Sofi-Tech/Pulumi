import { authLambda } from '../auth';

import type { LambdaAuthorizer, Route } from '@pulumi/awsx/classic/apigateway';

import { createPosts, deletePost, getPosts, updatePosts, feed, getPost } from '#lambdas/index';

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
export const POST_ROUTES: Route[] = [
  {
    path: '/posts/create',
    method: 'POST',
    eventHandler: createPosts,
    authorizers,
  },
  {
    path: '/posts/update',
    method: 'PATCH',
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
    path: '/posts',
    method: 'GET',
    eventHandler: feed,
    authorizers,
  },
];
