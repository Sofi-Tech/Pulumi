import { dynamodb } from '@pulumi/aws';

/**
 * Posts table for posts
 * @description
 * - postID: post id
 * - userID: user id
 * - createdAt can be extracted from the postID using destruct method in utils.ts
 *
 * We use this table to query posts by user
 * The feed system for this blog is the union of posts and tags table
 * Currently the feed system can display 20 posts at a time and is paginated
 *
 * @example {
 * postID: 'some',
 * userID: 'some'
 * }
 *
 * @see https://www.pulumi.com/docs/reference/pkg/aws/dynamodb/table/
 * @see https://www.pulumi.com/docs/reference/pkg/aws/dynamodb/table/#globalsecondaryindexes
 */
export const Posts = new dynamodb.Table('posts', {
  name: 'posts',
  attributes: [
    {
      name: 'postID',
      type: 'S',
    },
    {
      name: 'userID',
      type: 'S',
    },
  ],
  billingMode: 'PAY_PER_REQUEST',
  hashKey: 'userID',
  rangeKey: 'postID',
  globalSecondaryIndexes: [
    {
      name: 'postID',
      hashKey: 'postID',
      projectionType: 'ALL',
      readCapacity: 400,
      writeCapacity: 400,
    },
  ],
  tags: {
    Name: 'posts',
  },
});

export interface IPost {
  content?: string;
  postID?: string;
  tags?: string[];
  title?: string;
  updatedAt?: number;
  userID?: string;
}

export const postSchema = {
  content: '',
  postID: '',
  tags: [],
  title: '',
  updatedAt: 0,
  userID: '',
};
export type CPost = Required<IPost>;
