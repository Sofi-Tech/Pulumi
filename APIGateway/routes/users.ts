import { signUp, signIn } from '../lambdas/index';

import type * as awsx from '@pulumi/awsx';

export const USER_ROUTES: awsx.classic.apigateway.Route[] = [
  {
    path: '/users/signup',
    method: 'POST',
    eventHandler: signUp,
    contentType: 'application/json',
  },
  {
    path: '/users/signin',
    method: 'POST',
    eventHandler: signIn,
    contentType: 'application/json',
  },
];
