import { lambda, sdk } from '@pulumi/aws';

import { CommentsTable } from '../../../database/index';
import { getToken } from '../../auth';

import type { CComment, IComment } from '#tables/tables/comment';
import type { lambdaEvent } from '#utils/util';

import { validateCommentBody } from '#tables/validation/comments';
import {
  currentEndpoint,
  CUSTOM_ERROR_CODES,
  makeCustomError,
  decodeJWT,
  populateResponse,
  STATUS_CODES,
  updateObject,
} from '#utils/util';

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
    if (!parsed || error) {
      return populateResponse(
        STATUS_CODES.BAD_REQUEST,
        makeCustomError(error ?? 'Bad Request', CUSTOM_ERROR_CODES.BODY_NOT_VALID),
      );
    }

    const { content } = parsed as IComment & Pick<CComment, 'commentID' | 'content'>;
    const userID = decodeJWT(getToken(event)).data?.id;

    if (!userID) {
      return populateResponse(
        STATUS_CODES.UNAUTHORIZED,
        makeCustomError('Unauthorized', CUSTOM_ERROR_CODES.USER_NOT_AUTHORIZED),
      );
    }

    const updateObj: IComment = {
      content,
      updatedAt: Date.now(),
    };

    if (!Object.keys(updateObj).length)
      return populateResponse(
        STATUS_CODES.BAD_REQUEST,
        makeCustomError('No fields to update', CUSTOM_ERROR_CODES.COMMENT_ERROR),
      );

    const { ExpressionAttributeNames, ExpressionAttributeValues, UpdateExpression } = updateObject(updateObj);

    const client = new sdk.DynamoDB.DocumentClient(currentEndpoint);
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
        return populateResponse(
          STATUS_CODES.NOT_FOUND,
          makeCustomError('Comment not found', CUSTOM_ERROR_CODES.RESOURCE_NOT_FOUND),
        );

      console.error(error);
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Error updating post', CUSTOM_ERROR_CODES.COMMENT_ERROR),
      );
    }
  },
});
