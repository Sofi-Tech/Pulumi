import { lambda, sdk } from '@pulumi/aws';

import { CommentsTable } from '../../../database/index';
import { getToken } from '../../auth';

import type { CComment, IComment } from '#tables/tables/comment';
import type { lambdaEvent } from '#utils/util';

import { validateCommentBody } from '#tables/validation/comments';
import { decodeJWT, populateResponse, STATUS_CODES, updateObject } from '#utils/util';

export const updateComments = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('updateComments', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const { commentID } = event.pathParameters!;
    const { error, parsed } = validateCommentBody(event, { content: true });
    if (!parsed || error) return populateResponse(STATUS_CODES.BAD_REQUEST, error ?? 'Bad Request');

    const { content } = parsed as IComment & Pick<CComment, 'commentID' | 'content'>;
    const userID = decodeJWT(getToken(event)).data?.id;
    if (!userID) return populateResponse(STATUS_CODES.UNAUTHORIZED, 'Unauthorized');

    const updateObj: IComment = {
      content,
      updatedAt: Date.now(),
    };

    if (!Object.keys(updateObj).length) return populateResponse(STATUS_CODES.BAD_REQUEST, 'No fields to update');

    const { ExpressionAttributeNames, ExpressionAttributeValues, UpdateExpression } = updateObject(updateObj);

    const client = new sdk.DynamoDB.DocumentClient();
    try {
      await client
        .update({
          TableName: CommentsTable.get(),
          Key: {
            commentID,
            userID,
          },
          ConditionExpression: 'attribute_exists(commentID)',
          UpdateExpression,
          ExpressionAttributeNames,
          ExpressionAttributeValues,
        })
        .promise();
      return populateResponse(STATUS_CODES.OK, {
        patchedFields: {
          ...updateObj,
        },
      });
    } catch (error) {
      if ((error as any).code === 'ConditionalCheckFailedException')
        return populateResponse(STATUS_CODES.NOT_FOUND, 'Comment not found');

      console.error(error);
      return populateResponse(STATUS_CODES.INTERNAL_SERVER_ERROR, 'Error updating post');
    }
  },
});
