/* eslint-disable promise/prefer-await-to-then */
/* eslint-disable id-length */
import process from 'node:process';

import { sdk } from '@pulumi/aws';

import { generateFlake, postEpoch, userEpoch } from '#utils/util';
import 'dotenv/config';

const client = new sdk.DynamoDB.DocumentClient({
  endpoint: process.env.dbEndPoint,
  region: 'ap-south-1',
  credentials: {
    accessKeyId: 'fakekeyid',
    secretAccessKey: 'fakekey,',
  },
});

let arr: any = [];

// fill 100k users in the database
for (let i = 0; i < 20_000; i++) {
  const postID = generateFlake(Date.now(), postEpoch);
  const userID = generateFlake(Date.now(), userEpoch);
  console.log(postID, userID);
  const preDefinedSoftwareTags = ['react', 'node', 'typescript', 'aws', 'pulumi', 'python', 'java', 'c++', 'c#', 'c'];

  // create tags for the user and the post should be less than 5 and greater than 1 in length
  const userTags = Array.from(
    { length: Math.floor(Math.random() * 5) + 1 },
    () => preDefinedSoftwareTags[Math.floor(Math.random() * preDefinedSoftwareTags.length)],
  );
  const postTags = Array.from(
    { length: Math.floor(Math.random() * 5) + 1 },
    () => preDefinedSoftwareTags[Math.floor(Math.random() * preDefinedSoftwareTags.length)],
  );
  // remove duplicate tags
  const uniqueUserTags = [...new Set(userTags)];
  const uniquePostTags = [...new Set(postTags)];

  const tagsToStore = uniquePostTags.map((tag: string) => ({
    Put: {
      TableName: 'tags',
      Item: {
        postID,
        tag,
      },
    },
  }));

  arr.push({
    Put: {
      TableName: 'posts',
      Item: {
        postID,
        userID,
        title: 'title',
        content: 'content',
      },
      ConditionExpression: 'attribute_not_exists(postID)',
    },
  });
  arr.push({
    Put: {
      TableName: 'users',
      Item: {
        name: 'name',
        tags: uniqueUserTags,
        userID,
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        email: `${userID + postID}@gmail.com`.toLowerCase(),
        password: 'password',
        token: 'token',
      },
      ConditionExpression: 'attribute_not_exists(email) AND attribute_not_exists(userID)',
    },
  });

  arr.push(...tagsToStore);

  // transaction can only have 25 items so check arr length and send the transaction
  if (arr.length === 25 || (arr.length > 10 && arr.length < 25)) {
    console.log('sending transaction');
    const params = {
      TransactItems: arr,
    };

    client
      .transactWrite(params)
      .promise()
      .then(data => {
        console.log(data);
        return data;
      })
      .catch(error => console.log(error));

    arr = [];
  }
}
