import { lambda, sdk } from '@pulumi/aws';

import { getToken } from '../../auth';

import type { lambdaEvent } from '#utils/util';

import { CommentsTable } from '#tables/index';
import {
  currentEndpoint,
  CUSTOM_ERROR_CODES,
  makeCustomError,
  decodeJWT,
  populateResponse,
  STATUS_CODES,
} from '#utils/util';

/**
 * Delete a comment from the database
 * @description
 * - The comment is deleted from the database
 * - The lambda is triggered by a DELETE request to /comments/delete/{commentID}
 *
 * @see https://www.pulumi.com/docs/guides/crosswalk/aws/api-gateway/#lambda-request-handling
 */
export const deleteComments = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('deleteComments', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const { commentID } = event.pathParameters!;

    const userID = decodeJWT(getToken(event)).data?.id;

    if (!userID) {
      return populateResponse(
        STATUS_CODES.UNAUTHORIZED,
        makeCustomError('Unauthorized', CUSTOM_ERROR_CODES.USER_NOT_AUTHORIZED),
      );
    }

    const client = new sdk.DynamoDB.DocumentClient(currentEndpoint);
    try {
      await client
        .delete({
          TableName: CommentsTable.get(),
          Key: {
            commentID,
            userID,
          },
          ConditionExpression: 'attribute_exists(commentID) AND attribute_exists(userID)',
        })
        .promise();

      return populateResponse(STATUS_CODES.OK, 'Comment deleted');
    } catch (error) {
      if ((error as any).code === 'ConditionalCheckFailedException') {
        return populateResponse(
          STATUS_CODES.NOT_FOUND,
          makeCustomError('You cannot delete this comment', CUSTOM_ERROR_CODES.USER_NOT_AUTHORIZED),
        );
      }

      console.error(error);
      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Error updating post', CUSTOM_ERROR_CODES.COMMENT_ERROR),
      );
    }
  },
});
