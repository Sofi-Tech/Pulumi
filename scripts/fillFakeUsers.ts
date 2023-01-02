/* eslint-disable id-length */
import { sdk } from '@pulumi/aws';

import { generateFlake, userEpoch } from '#utils/util';

const client = new sdk.DynamoDB.DocumentClient({
  endpoint: 'http://78.46.102.232:8000',
  region: 'ap-south-1',
  credentials: {
    accessKeyId: 'fakekeyid',
    secretAccessKey: 'fakekey,',
  },
});

let arr: any = [];
// fill 100k users in the database
for (let i = 0; i < 100_000; i++) {
  console.log(i);
  const userID = generateFlake(Date.now(), userEpoch);
  const username = `user${userID}`;
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  const email = `${username + Math.floor(Math.random() * 1_000)}@gmail.com`.toLowerCase();
  const password = 'password';
  const token = 'token';
  const name = 'name';
  const tags = ['tag1', 'tag2', 'tag3'];

  const user = {
    name,
    tags,
    userID,
    email,
    password,
    token,
  };

  arr.push({
    Put: {
      TableName: 'users',
      Item: user,
      ConditionExpression: 'attribute_not_exists(email) AND attribute_not_exists(userID)',
    },
  });
  if (arr.length === 25) {
    void client
      .transactWrite({
        TransactItems: arr,
      })
      .promise();
    arr = [];
  }
}
