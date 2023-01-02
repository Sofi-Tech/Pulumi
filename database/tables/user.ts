import { dynamodb } from '@pulumi/aws';

export const Users = new dynamodb.Table('users', {
  name: 'users',
  attributes: [
    {
      name: 'email',
      type: 'S',
    },
    {
      name: 'userID',
      type: 'S',
    },
  ],
  billingMode: 'PAY_PER_REQUEST',
  hashKey: 'email',
  // We don't have a range key for this table so we can have unique email addresses.
  // Primary key is just email, having rangeKey as userID will make the primary key unique hashKey + rangeKey.
  // Therefore this can cause issues when we want to have unique email addresses
  globalSecondaryIndexes: [
    {
      name: 'userID',
      hashKey: 'userID',
      projectionType: 'ALL',
      writeCapacity: 400,
      readCapacity: 400,
    },
  ],
  tags: {
    Name: 'users',
  },
});

export interface IUser {
  email?: string;
  name?: string;
  password?: string;
  tags?: string[];
  token?: string;
  userID?: string;
}

export type CUser = Required<IUser>;
