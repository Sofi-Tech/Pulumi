/* eslint-disable id-length */
import process from 'node:process';

import { sdk } from '@pulumi/aws';

import 'dotenv/config';

const client = new sdk.DynamoDB.DocumentClient({
  endpoint: process.env.dbEndPoint!,
  region: 'ap-south-1',
  credentials: {
    accessKeyId: 'fakekeyid',
    secretAccessKey: 'fakekey,',
  },
});

// delete all the items from posts and users table
client.scan({ TableName: 'posts' }, async (_, data) => {
  const items = data.Items;
  // batch delete all the posts only 25 at a time
  for (let i = 0; i < items!.length; i += 25) {
    await client

      .batchWrite({
        RequestItems: {
          posts: items!.slice(i, i + 25).map((item: any) => ({
            DeleteRequest: {
              Key: {
                postID: item.postID,
                userID: item.userID,
              },
            },
          })),
        },
      })
      .promise();
  }

  console.log(`delete ${items!.length} posts`);
});

// delete all the items from tags table
client.scan({ TableName: 'tags' }, async (_, data) => {
  const items = data.Items;
  // batch delete all the posts only 25 at a time
  for (let i = 0; i < items!.length; i += 25) {
    await client
      .batchWrite({
        RequestItems: {
          tags: items!.slice(i, i + 25).map((item: any) => ({
            DeleteRequest: {
              Key: {
                postID: item.postID,
                tag: item.tag,
              },
            },
          })),
        },
      })
      .promise();
  }

  console.log(`delete ${items!.length} tags`);
});

// delete all the items from users table

client.scan({ TableName: 'users' }, async (_, data) => {
  const items = data.Items;
  // batch delete all the posts only 25 at a time
  for (let i = 0; i < items!.length; i += 25) {
    await client

      .batchWrite({
        RequestItems: {
          users: items!.slice(i, i + 25).map((item: any) => ({
            DeleteRequest: {
              Key: {
                email: item.email,
              },
            },
          })),
        },
      })
      .promise();
  }

  console.log(`delete ${items!.length} users`);
});
