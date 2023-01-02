/* eslint-disable id-length */
import { sdk } from '@pulumi/aws';

import { generateFlake, postEpoch, userEpoch } from '#utils/util';

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
  const postID = generateFlake(Date.now(), postEpoch);
  const userID = generateFlake(Date.now(), userEpoch);
  const post = {
    postID,
    userID,
    title: 'title',
    content: 'content',
    // create random tags
    tags: Array.from({ length: Math.floor(Math.random() * 10) }, () => Math.random().toString(36).slice(2, 15)),
  };

  const user = {
    name: 'name',
    tags: Array.from({ length: Math.floor(Math.random() * 10) }, () => Math.random().toString(36).slice(2, 15)),
    userID,
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    email: `${userID + postID}@gmail.com`.toLowerCase(),
    password: 'password',
    token: 'token',
  };

  arr.push({
    Put: {
      TableName: 'posts',
      Item: post,
      ConditionExpression: 'attribute_not_exists(postID)',
    },
  });
  arr.push({
    Put: {
      TableName: 'users',
      Item: user,
      ConditionExpression: 'attribute_not_exists(email) AND attribute_not_exists(userID)',
    },
  });
  if (arr.length === 24) {
    void client
      .transactWrite({
        TransactItems: arr,
      })
      .promise();
    arr = [];
  }
}
