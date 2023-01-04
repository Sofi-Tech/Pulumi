import { lambda, sdk } from '@pulumi/aws';

import { getToken } from '../../auth';

import type { CPost, IPost } from '#tables/tables/post';
import type { lambdaEvent } from '#utils/util';

import { PostsTable, TagsTable } from '#tables/index';
import { validatePostBody } from '#tables/validation/posts';
import {
  currentEndpoint,
  CUSTOM_ERROR_CODES,
  makeCustomError,
  decodeJWT,
  populateResponse,
  STATUS_CODES,
  updateObject,
} from '#utils/util';

/**
 * The update post lambda
 * @description
 * - The lambda is used to update a post
 * - The lambda is triggered by a POST request to /posts/update
 *
 * @see https://www.pulumi.com/docs/guides/crosswalk/aws/api-gateway/#lambda-request-handling
 */
export const updatePosts = new lambda.CallbackFunction<
  lambdaEvent,
  {
    body: string;
    statusCode: number;
  }
>('updatePosts', {
  runtime: lambda.Runtime.NodeJS16dX,
  callback: async event => {
    const { error, parsed } = validatePostBody(event, {});
    if (!parsed || error) {
      return populateResponse(
        STATUS_CODES.BAD_REQUEST,
        makeCustomError(error ?? 'Bad Request', CUSTOM_ERROR_CODES.BODY_NOT_VALID),
      );
    }

    const { postID } = event.pathParameters!;

    const { title, content, tags } = parsed as IPost & Pick<CPost, 'postID'>;
    const userID = decodeJWT(getToken(event)).data?.id;

    if (!userID) {
      return populateResponse(
        STATUS_CODES.UNAUTHORIZED,
        makeCustomError('Unauthorized', CUSTOM_ERROR_CODES.USER_NOT_AUTHORIZED),
      );
    }

    const updateObj = {
      ...(title && { title }),
      ...(content && { content }),
      ...(title || content || tags ? { updated: Date.now() } : {}),
    };

    const tagsToStore =
      tags?.map((tag: string) => ({
        Put: {
          TableName: TagsTable.get(),
          Item: {
            postID,
            tag,
          },
        },
      })) ?? null;

    if (!Object.keys(updateObj).length) {
      return populateResponse(
        STATUS_CODES.BAD_REQUEST,
        makeCustomError('No fields to update', CUSTOM_ERROR_CODES.POST_ERROR),
      );
    }

    const { ExpressionAttributeNames, ExpressionAttributeValues, UpdateExpression } = updateObject(updateObj);

    const client = new sdk.DynamoDB.DocumentClient(currentEndpoint);
    try {
      // fetch the tag first
      if (tagsToStore?.length) {
        const { Items } = await client
          .query({
            TableName: TagsTable.get(),
            IndexName: 'postID',
            KeyConditionExpression: 'postID = :postID',
            ExpressionAttributeValues: {
              ':postID': postID,
            },
          })
          .promise();

        if (!Items?.length)
          return populateResponse(
            STATUS_CODES.NOT_FOUND,
            makeCustomError('Post not found', CUSTOM_ERROR_CODES.POST_ERROR),
          );

        const oldTag = Items[0].tag;
        // delete old tag from tag table
        await client
          .transactWrite({
            TransactItems: [
              // delete old tag
              {
                Delete: {
                  TableName: TagsTable.get(),
                  Key: {
                    postID,
                    tag: oldTag,
                  },
                },
              },
              // add new tags
              ...tagsToStore,
            ],
          })
          .promise();
      }

      await client
        .update({
          TableName: PostsTable.get(),
          Key: {
            userID,
            postID,
          },
          ConditionExpression: 'attribute_exists(postID)',
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
      console.error(error);
      if ((error as any).code === 'ConditionalCheckFailedException') {
        return populateResponse(
          STATUS_CODES.NOT_FOUND,
          makeCustomError('You cannot update this post', CUSTOM_ERROR_CODES.USER_NOT_AUTHORIZED),
        );
      }

      return populateResponse(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
        makeCustomError('Error updating post', CUSTOM_ERROR_CODES.POST_ERROR),
      );
    }
  },
});
