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

    // type validation
    if (parsed.postID && typeof parsed.postID !== 'string') return { parsed: null, error: 'postID should be a string' };

    if (parsed.userID && typeof parsed.userID !== 'string') return { parsed: null, error: 'userID should be a string' };

    if (parsed.title && typeof parsed.title !== 'string') return { parsed: null, error: 'title should be a string' };

    if (parsed.content && typeof parsed.content !== 'string')
      return { parsed: null, error: 'content should be a string' };

    if (parsed.tags && Array.isArray(tags)) return { parsed: null, error: 'tags should be of array type' };

    // value validation
    if (!parsed.postID && postID) return { parsed: null, error: 'Missing postID' };

    if (!parsed.userID && userID) return { parsed: null, error: 'Missing userID' };

    if (!parsed.title && title) return { parsed: null, error: 'Missing title' };

    if (!parsed.content && content) return { parsed: null, error: 'Missing content' };

    if (!parsed.tags && tags) return { parsed: null, error: 'Missing tags' };

    return { parsed, error: null };
  } catch {
    return { parsed: null, error: 'Invalid body' };
  }
};
