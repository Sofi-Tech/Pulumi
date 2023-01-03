import { dynamodb } from '@pulumi/aws';

/**
 * Users table
 * @description
 * This table is used to store user information
 * - email is the primary key and is unique
 * - userID is a global secondary index and is unique
 * - tags are used to filter posts and are mandatory on signup.
 * Tags have a limit of 5 and are unique
 * - createdAt can be extracted from the userID using destruct method in utils.ts
 *
 * @example {
 * email: 'email@gmail.com',
 * name: 'some name',
 * password: 'Password1@'
 * tags: ['react', 'node', 'typescript', 'aws', 'pulumi'],
 * token: 'token',
 * userID: 'some unique id'
 * }
 *
 * @see https://www.pulumi.com/docs/reference/pkg/aws/dynamodb/table/
 * @see https://www.pulumi.com/docs/reference/pkg/aws/dynamodb/table/#globalsecondaryindexes
 */
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

export const userSchema = {
  email: '',
  name: '',
  password: '',
  tags: [],
  token: '',
  userID: '',
};

export type CUser = Required<IUser>;
