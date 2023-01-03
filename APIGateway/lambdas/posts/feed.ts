// write lambda function to get posts for a user feed with tags of inside user

import { lambda, sdk } from '@pulumi/aws';

import { getToken } from '../../auth';

import type { CUser, IUser } from '#tables/tables/user';
import type { lambdaEvent } from '#utils/util';

import { PostsTable, TagsTable, UsersTable } from '#tables/index';
import {
  currentEndpoint,
  CUSTOM_ERROR_CODES,
  makeCustomError,
  decodeJWT,
  populateResponse,
  STATUS_CODES,
} from '#utils/util';

/**
 * The feed lambda
 * @description
 * - The lambda is used to get the feed of a user
 * - The lambda is triggered by a GET request to /posts/feed/{postID}
 *
 * The postID is used to get the next 10 posts from the feed and use null to get the first 10 posts
 * @see https://www.pulumi.com/docs/guides/crosswalk/aws/api-gateway/#lambda-request-handling
 */
export const feed = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('feed', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const userID = decodeJWT(getToken(event)).data?.id;
    let { postID }: any = event.pathParameters!;
    if (postID === 'null') postID = null;

    const client = new sdk.DynamoDB.DocumentClient(currentEndpoint);
    try {
      const { Items } = await client
        .query({
          TableName: UsersTable.get(),
          IndexName: 'userID',
          KeyConditionExpression: 'userID = :id',
          ExpressionAttributeValues: {
            ':id': userID,
          },
        })
        .promise();

      if (!Items?.length) {
        return populateResponse(
          STATUS_CODES.NOT_FOUND,
          makeCustomError('User not found', CUSTOM_ERROR_CODES.USER_NOT_FOUND),
        );
      }

      const { tags } = Items[0] as IUser & Pick<CUser, 'tags'>;
      // batch get all the tags
      const promises = [];
      for (const tag of tags) {
        promises.push(
          client
            .query({
              TableName: TagsTable.get(),
              IndexName: 'tag-index',
              KeyConditionExpression: 'tag = :tag',
              ExpressionAttributeValues: {
                ':tag': tag,
              },
              // since a user can have upto 5 tags and each tag can have upto 1000s of posts so we need to limit the query as the user cannot read all the posts
              Limit: 500,
            })
            .promise(),
        );
      }

      const results = await Promise.all(promises);
      const postsIds = results.map(result => result.Items?.map(item => item.postID));

      // unique postIds using set
      const uniquePostsIds = [...new Set(postsIds.flat() as string[])];

      // use postID to get the next postIds from the array
      let nextPostIds: string[] | null = null;
      if (postID) {
        const idx = uniquePostsIds.indexOf(postID);
        nextPostIds = uniquePostsIds.slice(idx + 1);
      }

      // only 20 posts
      const postsToFeed = nextPostIds?.slice(0, 20) ?? uniquePostsIds.slice(0, 20);
      const postPromises = [];
      for (const postId of postsToFeed) {
        postPromises.push(
          client
            .query({
              TableName: PostsTable.get(),
              IndexName: 'postID',
              KeyConditionExpression: 'postID = :postID',
              ExpressionAttributeValues: {
                ':postID': postId,
              },
            })
            .promise(),
        );
      }

      const postResults = await Promise.all(postPromises);
      const posts = [];
      for (const postResult of postResults) {
        if (!postResult.Items) continue;
        posts.push(...postResult.Items);
      }

      if (!posts.length) return populateResponse(STATUS_CODES.OK, []);
      return populateResponse(STATUS_CODES.OK, posts);
    } catch (error) {
      console.error(error);
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Internal Server Error', CUSTOM_ERROR_CODES.POST_ERROR),
      );
    }
  },
});
