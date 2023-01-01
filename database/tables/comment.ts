import { dynamodb } from '@pulumi/aws';

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
      readCapacity: 1,
      writeCapacity: 1,
    },
    {
      name: 'commentID',
      hashKey: 'commentID',
      projectionType: 'ALL',
      readCapacity: 1,
      writeCapacity: 1,
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

export type CComment = Required<IComment>;
