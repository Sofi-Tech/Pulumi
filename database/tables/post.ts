import { dynamodb } from '@pulumi/aws';

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
      readCapacity: 1,
      writeCapacity: 1,
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

export type CPost = Required<IPost>;
