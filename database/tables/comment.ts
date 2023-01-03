import { dynamodb } from '@pulumi/aws';

/**
 * Comments table for posts
 * @description
 * - commentID: comment id
 * - userID: user id
 * - postID: post id
 * - createdAt can be extracted from the commentID using destruct method in utils.ts
 *
 * We use this table to query comments by user and post
 * The comments system is not fully implemented yet
 * @example {
 * commentID: 'some',
 * userID: 'some',
 * postID: 'some'
 * }
 *
 * @see https://www.pulumi.com/docs/reference/pkg/aws/dynamodb/table/
 * @see https://www.pulumi.com/docs/reference/pkg/aws/dynamodb/table/#globalsecondaryindexes
 */
export const Comments = new dynamodb.Table('comments', {
  name: 'comments',
  attributes: [
    {
      name: 'commentID',
      type: 'S',
    },
    {
      name: 'userID',
      type: 'S',
    },
    {
      name: 'postID',
      type: 'S',
    },
  ],
  billingMode: 'PAY_PER_REQUEST',
  hashKey: 'userID',
  rangeKey: 'commentID',
  globalSecondaryIndexes: [
    {
      name: 'postID',
      hashKey: 'postID',
      projectionType: 'ALL',
      readCapacity: 400,
      writeCapacity: 400,
    },
    {
      name: 'commentID',
      hashKey: 'commentID',
      projectionType: 'ALL',
      readCapacity: 400,
      writeCapacity: 400,
    },
  ],
  tags: {
    Name: 'comments',
  },
});

export interface IComment {
  commentID?: string;
  content?: string;
  postID?: string;
  replyTo?: string;
  updatedAt?: number;
  userID?: string;
}

export const commentSchema = {
  commentID: '',
  content: '',
  postID: '',
  replyTo: '',
  updatedAt: 0,
  userID: '',
};

export type CComment = Required<IComment>;
