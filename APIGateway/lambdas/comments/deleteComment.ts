import { lambda, sdk } from '@pulumi/aws';

import { CommentsTable } from '../../../database/index';
import { getToken } from '../../auth';

import type { lambdaEvent } from '#utils/util';

import { decodeJWT, populateResponse, STATUS_CODES } from '#utils/util';

export const deleteComments = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('deleteComments', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const { commentID } = (event as any).pathParameters;

    const userID = decodeJWT(getToken(event as any)).data?.id;
    if (!userID) return populateResponse(STATUS_CODES.UNAUTHORIZED, 'Unauthorized');

    const client = new sdk.DynamoDB.DocumentClient();
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
      if ((error as any).code === 'ConditionalCheckFailedException')
        return populateResponse(STATUS_CODES.NOT_FOUND, 'You cannot delete this comment');

      console.error(error);
      return populateResponse(STATUS_CODES.INTERNAL_SERVER_ERROR, 'Error updating post');
    }
  },
});
