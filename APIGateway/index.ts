import { API } from '@pulumi/awsx/classic/apigateway';

import { COMMENT_ROUTES } from '#routes/comments';
import { POST_ROUTES } from '#routes/posts';
import { USER_ROUTES } from '#routes/users';

/**
 * The API gateway for the blog
 * @description
 * - The API gateway is used to route requests to the lambda functions
 * - The API gateway is used to authenticate users
 * - The API gateway is used to validate requests
 *
 * @see https://www.pulumi.com/registry/packages/aws/api-docs/apigateway/
 * @see https://www.pulumi.com/registry/packages/aws/api-docs/apigateway/restapi/
 */
export const apiGateway = new API('blog-api', {
  routes: [...POST_ROUTES, ...USER_ROUTES, ...COMMENT_ROUTES],
  restApiArgs: {
    binaryMediaTypes: [],
  },
  stageName: 'dev',
});
