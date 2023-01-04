// write lambda function to get posts for a user feed with tags of inside user

import { lambda, sdk } from '@pulumi/aws';

import { getToken } from '../../auth';

import type { IComment } from '#tables/tables/comment';
import type { IPost } from '#tables/tables/post';
import type { CUser, IUser } from '#tables/tables/user';
import type { lambdaEvent } from '#utils/util';

import { CommentsTable, PostsTable, TagsTable, UsersTable } from '#tables/index';
import {
  deconstruct,
  postEpoch,
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
      const postsIdsTags = results.flatMap(result => result.Items);

      interface tagItem {
        postID: string;
        tag: string;
      }
      // unique postIds using set
      const uniquePosts = [...new Set(postsIdsTags as tagItem[])];

      // use postID to get the next postIds from the array
      let nextPostIds: tagItem[] | null = null;
      if (postID) {
        const idx = uniquePosts.indexOf(postID);
        nextPostIds = uniquePosts.slice(idx + 1);
      }

      // only 20 posts
      const postsToFeed = nextPostIds?.slice(0, 20) ?? uniquePosts.slice(0, 20);
      const postPromises = [];
      for (const post of postsToFeed) {
        postPromises.push(
          client
            .query({
              TableName: PostsTable.get(),
              IndexName: 'postID',
              KeyConditionExpression: 'postID = :postID',
              ExpressionAttributeValues: {
                ':postID': post.postID,
              },
            })
            .promise(),
        );
      }

      const postResults = await Promise.all(postPromises);
      const posts = [];
      for (const postResult of postResults) {
        if (!postResult.Items?.[0]) continue;
        // get all the tags for the post
        const tags = postsIdsTags
          .filter(item => item?.postID === postResult.Items?.[0]?.postID)
          .map(item => item?.tag ?? '');
        const { Items: comments } = await client
          .query({
            TableName: CommentsTable.get(),
            IndexName: 'postID',
            KeyConditionExpression: 'postID = :postID',
            ExpressionAttributeValues: {
              ':postID': postResult.Items[0]?.postID,
            },
          })
          .promise();

        posts.push(
          ...postResult.Items.map(
            item =>
              ({
                ...item,
                tag: tags,
                comments:
                  comments?.map((com: IComment) => ({
                    commentID: com.commentID,
                    content: com.content,
                    userID: com.userID,
                  })) ?? [],
              } as IPost),
          ),
        );
      }

      if (!posts.length) return populateResponse(STATUS_CODES.OK, []);
      return populateResponse(
        STATUS_CODES.OK,
        posts.map(post => {
          const { timestamp } = deconstruct(post.postID!, postEpoch);
          return { ...post, createdAt: timestamp };
        }),
      );
    } catch (error) {
      console.error(error);
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Internal Server Error', CUSTOM_ERROR_CODES.POST_ERROR),
      );
    }
  },
});
