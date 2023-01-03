import { dynamodb } from '@pulumi/aws';

/**
 * Tags table for posts
 * @description
 * - postID: post id
 * - tag: tag
 * We use this table to query posts by tag
 * @example {
 * postID: 'some',
 * tag: 'tag'
 * }
 *
 * @see https://www.pulumi.com/docs/reference/pkg/aws/dynamodb/table/
 * @see https://www.pulumi.com/docs/reference/pkg/aws/dynamodb/table/#globalsecondaryindexes
 */
export const Tags = new dynamodb.Table('tags', {
  name: 'tags',
  attributes: [
    {
      name: 'postID',
      type: 'S',
    },
    {
      name: 'tag',
      type: 'S',
    },
  ],
  billingMode: 'PAY_PER_REQUEST',
  hashKey: 'tag',
  rangeKey: 'postID',
  globalSecondaryIndexes: [
    {
      name: 'postID',
      hashKey: 'postID',
      projectionType: 'ALL',
      readCapacity: 400,
      writeCapacity: 400,
    },
    {
      name: 'tag-index',
      hashKey: 'tag',
      projectionType: 'ALL',
      readCapacity: 400,
      writeCapacity: 400,
    },
  ],
  tags: {
    Name: 'tags',
  },
});

export interface ITags {
  postID?: string;
  tag?: string;
}

export const tagsSchema = {
  postID: '',
  tag: '',
};

export type CTags = Required<ITags>;
