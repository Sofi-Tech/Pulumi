// table to have have blacklisted tokens until they expire

import { Table } from '@pulumi/aws/dynamodb';

// this is used for the logout functionality
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

export type CToken = Required<IToken>;
