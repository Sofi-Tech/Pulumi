import { authLambda } from '../../APIGateway/auth';
import { createComment, updateComments } from '../lambdas/index';

import type { LambdaAuthorizer, Route } from '@pulumi/awsx/classic/apigateway';

import { deleteComments } from '#lambdas/comments/deleteComment';
import { getComments } from '#lambdas/comments/getComments';

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
    requiredParameters: [
      { name: 'postID', in: 'path' },
      { name: 'commentID', in: 'path' },
    ],
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
