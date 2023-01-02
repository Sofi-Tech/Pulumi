import { lambda, sdk } from '@pulumi/aws';

import { getToken } from '../../auth';

import type { CComment, IComment } from '#tables/tables/comment';
import type { lambdaEvent } from '#utils/util';

import { CommentsTable, PostsTable } from '#tables/index';
import { validateCommentBody } from '#tables/validation/comments';
import {
  decodeJWT,
  generateFlake,
  populateResponse,
  commentEpoch,
  STATUS_CODES,
  CUSTOM_ERROR_CODES,
  makeCustomError,
} from '#utils/util';

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
    if (!parsed || error)
      return populateResponse(
        STATUS_CODES.BAD_REQUEST,
        makeCustomError(error ?? 'Bad Request', CUSTOM_ERROR_CODES.BODY_NOT_VALID),
      );

    const { content, replyTo } = parsed as IComment & Pick<CComment, 'content' | 'replyTo'>;
    const client = new sdk.DynamoDB.DocumentClient();

    const userID = decodeJWT(getToken(event)).data?.id;

    if (!userID) {
      return populateResponse(
        STATUS_CODES.UNAUTHORIZED,
        makeCustomError('Unauthorized', CUSTOM_ERROR_CODES.USER_NOT_AUTHORIZED),
      );
    }

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

        if (!item) {
          return populateResponse(
            STATUS_CODES.NOT_FOUND,
            makeCustomError('Comment not found', CUSTOM_ERROR_CODES.RESOURCE_NOT_FOUND),
          );
        }

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

      if (!item) {
        return populateResponse(
          STATUS_CODES.NOT_FOUND,
          makeCustomError('Post not found', CUSTOM_ERROR_CODES.RESOURCE_NOT_FOUND),
        );
      }

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
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Error creating comment', CUSTOM_ERROR_CODES.COMMENT_ERROR),
      );
    }
  },
});
