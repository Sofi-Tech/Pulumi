import { lambda, sdk } from '@pulumi/aws';

import { getToken } from '../../auth';

import type { CComment, IComment } from '#tables/tables/comment';
import type { lambdaEvent } from '#utils/util';

import { CommentsTable, PostsTable } from '#tables/index';
import { validateCommentBody } from '#tables/validation/comments';
import { decodeJWT, generateFlake, populateResponse, commentEpoch, STATUS_CODES } from '#utils/util';

export const createComment = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('createComment', {
  callback: async event => {
    const { postID } = event.pathParameters!;
    const { error, parsed } = validateCommentBody(event, { content: true });
    if (!parsed || error) return populateResponse(STATUS_CODES.BAD_REQUEST, error ?? 'Bad Request');

    const { content, replyTo } = parsed as IComment & Pick<CComment, 'content' | 'replyTo'>;
    const client = new sdk.DynamoDB.DocumentClient();

    const userID = decodeJWT(getToken(event)).data?.id;
    if (!userID) return populateResponse(STATUS_CODES.UNAUTHORIZED, 'Unauthorized');

    const comment: IComment = {
      commentID: generateFlake(Date.now(), commentEpoch),
      content,
      postID,
      userID,
    };
    try {
      if (replyTo) {
        const item = await client
          .query({
            TableName: CommentsTable.get(),
            KeyConditionExpression: 'commentID = :commentID',
            IndexName: 'commentID',
            ExpressionAttributeValues: {
              ':commentID': replyTo,
            },
          })
          .promise()
          .then(data => data.Items?.[0] ?? null)
          .catch(() => null);

        if (!item) return populateResponse(STATUS_CODES.NOT_FOUND, 'Comment that you want to reply is not found');
        comment.replyTo = replyTo;
      }

      const item = await client
        .query({
          TableName: PostsTable.get(),
          KeyConditionExpression: 'postID = :postID',
          IndexName: 'postID',
          ExpressionAttributeValues: {
            ':postID': postID,
          },
        })
        .promise()
        .then(data => data.Items?.[0] ?? null)
        .catch(() => null);

      if (!item) return populateResponse(STATUS_CODES.NOT_FOUND, 'Post not found');

      await client
        .put({
          TableName: CommentsTable.get(),
          Item: comment,
          ConditionExpression: 'attribute_not_exists(commentID)',
        })
        .promise();

      return populateResponse(STATUS_CODES.OK, comment);
    } catch (error) {
      console.error(error);
      return populateResponse(STATUS_CODES.INTERNAL_SERVER_ERROR, 'Error creating comment');
    }
  },
});
