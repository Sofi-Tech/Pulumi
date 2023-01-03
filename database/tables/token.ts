import { Table } from '@pulumi/aws/dynamodb';

/**
 * Token table for storing user tokens
 * @description
 * - userID: user id
 * - token: token
 * - expires: token expiration time
 * @example {
 * userID: 'some'
 * token: 'token',
 * expires: 123456789
 * }
 *
 * @see https://www.pulumi.com/docs/reference/pkg/aws/dynamodb/table/
 * @see https://www.pulumi.com/docs/reference/pkg/aws/dynamodb/table/#globalsecondaryindexes
 * @see https://www.pulumi.com/docs/reference/pkg/aws/dynamodb/table/#ttl
 */
export const Token = new Table('token', {
  name: 'tokens',
  attributes: [
    {
      name: 'userID',
      type: 'S',
    },
    {
      name: 'token',
      type: 'S',
    },
    {
      name: 'expires',
      type: 'N',
    },
  ],
  billingMode: 'PAY_PER_REQUEST',
  hashKey: 'userID',
  rangeKey: 'expires',
  ttl: {
    attributeName: 'expires',
    enabled: true,
  },
  globalSecondaryIndexes: [
    {
      name: 'userID',
      hashKey: 'userID',
      projectionType: 'ALL',
    },
    {
      name: 'expires',
      hashKey: 'expires',
      projectionType: 'ALL',
    },
    {
      name: 'token',
      hashKey: 'token',
      projectionType: 'ALL',
    },
  ],
  tags: {
    Name: 'tokens',
  },
});

export interface IToken {
  token?: string;
  userID?: string;
}

export const tokenSchema = {
  token: '',
  userID: '',
};

export type CToken = Required<IToken>;
