import { postSchema } from '#tables/tables/post';

/**
 * Validate the post body
 * We have out own validating function because current pulumi does not support any validation package
 *
 * @param event The customLambdaEvent object from the lambda function handler
 * @param param1 Object containing the required fields
 * @returns
 */
export const validatePostBody = (
  event: any,
  {
    postID = false,
    userID = false,
    title = false,
    content = false,
    tags = false,
  }: {
    content?: boolean;
    postID?: boolean;
    tags?: boolean;
    title?: boolean;
    userID?: boolean;
  },
) => {
  try {
    let { body } = event as { body: string };
    if (!body) body = '{}';
    const parsed = JSON.parse(body);

    if (!parsed) return { parsed: null, error: 'Missing body' };

    const unknownFields = Object.keys(parsed).filter(key => !Object.keys(postSchema).includes(key));
    if (unknownFields.length) return { parsed: null, error: `Unknown fields: ${unknownFields.join(', ')}` };

    // type validation
    if (parsed.postID && typeof parsed.postID !== 'string') return { parsed: null, error: 'postID should be a string' };

    if (parsed.userID && typeof parsed.userID !== 'string') return { parsed: null, error: 'userID should be a string' };

    if (parsed.title && typeof parsed.title !== 'string') return { parsed: null, error: 'title should be a string' };

    if (parsed.content && typeof parsed.content !== 'string')
      return { parsed: null, error: 'content should be a string' };

    // value validation
    if (!parsed.postID && postID) return { parsed: null, error: 'Missing postID' };

    if (!parsed.userID && userID) return { parsed: null, error: 'Missing userID' };

    if (!parsed.title && title) return { parsed: null, error: 'Missing title' };

    if (!parsed.content && content) return { parsed: null, error: 'Missing content' };

    if (!parsed.tags?.[0] && tags) return { parsed: null, error: 'Missing tags' };

    if (tags && !Array.isArray(parsed.tags)) return { parsed: null, error: 'tags should be an array' };

    if (parsed.tags && !parsed.tags.every((tag: string) => typeof tag === 'string')) {
      return { parsed: null, error: 'tags should be an array of strings' };
    }

    if (tags && parsed.tags?.length > 5) return { parsed: null, error: 'only 5 tags allowed at max' };

    if (parsed.tags && !parsed.tags.every((tag: string) => tag.length > 2)) {
      return { parsed: null, error: 'tags should be greater than 2 characters' };
    }

    if (parsed.tags) parsed.tags = parsed.tags.map((tag: string) => tag.toLowerCase());

    return { parsed, error: null };
  } catch {
    return { parsed: null, error: 'Something went wrong while validating the body, Check if its a valid object' };
  }
};
