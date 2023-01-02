import { lambda, sdk } from '@pulumi/aws';

import type { lambdaEvent } from '#utils/util';

import { CommentsTable } from '#tables/index';
import { CUSTOM_ERROR_CODES, makeCustomError, populateResponse, STATUS_CODES } from '#utils/util';

export const getComments = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('getComments', {
  callback: async event => {
    const { postID } = event.pathParameters!;

    const client = new sdk.DynamoDB.DocumentClient();
    try {
      const items = await client
        .query({
          TableName: CommentsTable.get(),
          KeyConditionExpression: 'postID = :postID',
          IndexName: 'postID',
          ExpressionAttributeValues: {
            ':postID': postID,
          },
        })
        .promise()
        .then(data => data.Items ?? [])
        .catch(() => []);

      if (!items.length) {
        return populateResponse(
          STATUS_CODES.NOT_FOUND,
          makeCustomError('Post not found', CUSTOM_ERROR_CODES.RESOURCE_NOT_FOUND),
        );
      }

      const comments = items.filter(item => !item.replyTo);
      const replies = items.filter(item => item.replyTo);

      const repliesMap = replies.reduce((acc, reply) => {
        if (!acc[reply.replyTo]) acc[reply.replyTo] = [];
        acc[reply.replyTo].push({ content: reply.content, commentID: reply.commentID, userID: reply.userID });
        return acc;
      }, {});

      const commentsWithReplies = comments.map(comment => ({
        ...comment,
        replies: repliesMap[comment.commentID] || [],
      }));
      return populateResponse(STATUS_CODES.OK, commentsWithReplies);
    } catch (error) {
      console.error(error);
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Error getting comments', CUSTOM_ERROR_CODES.COMMENT_ERROR),
      );
    }
  },
});
