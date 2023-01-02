import { authLambda } from '../auth';

import type { LambdaAuthorizer, Route } from '@pulumi/awsx/classic/apigateway';

import { createComment, updateComments, deleteComments, getComments } from '#lambdas/index';

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
