// import { ApiKey, UsagePlan, UsagePlanKey } from '@pulumi/aws/apigateway';
import { API } from '@pulumi/awsx/classic/apigateway';

import { COMMENT_ROUTES } from '#routes/comments';
import { POST_ROUTES } from '#routes/posts';
import { USER_ROUTES } from '#routes/users';

// const apiKey = new ApiKey('blog-api', {
//   description: 'Blog API Key',
//   enabled: true,
//   value: 'key',
// });

export const apiGateway = new API('blog-api', {
  routes: [...POST_ROUTES, ...USER_ROUTES, ...COMMENT_ROUTES],
  restApiArgs: {
    binaryMediaTypes: [],
  },
  stageName: 'dev',
});
