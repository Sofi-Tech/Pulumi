export const validateCommentBody = (
  event: any,
  {
    commentID = false,
    userID = false,
    content = false,
    postID = false,
    replyTo = false,
  }: {
    commentID?: boolean;
    content?: boolean;
    postID?: boolean;
    replyTo?: boolean;
    userID?: boolean;
  },
) => {
  try {
    let { body } = event as { body: string };
    if (!body) body = '{}';
    const parsed = JSON.parse(body);

    if (!parsed) return { parsed: null, error: 'Missing body' };

    // type validation
    if (parsed.commentID && typeof parsed.commentID !== 'string')
      return { parsed: null, error: 'commentID should be a string' };

    if (parsed.postID && typeof parsed.postID !== 'string') return { parsed: null, error: 'postID should be a string' };

    if (parsed.replyTo && typeof parsed.replyTo !== 'string')
      return { parsed: null, error: 'replyTo should be a string' };

    if (parsed.userID && typeof parsed.userID !== 'string') return { parsed: null, error: 'userID should be a string' };

    if (parsed.content && typeof parsed.content !== 'string')
      return { parsed: null, error: 'content should be a string' };

    // value validation
    if (!parsed.postID && postID) return { parsed: null, error: 'Missing postID' };

    if (!parsed.replyTo && replyTo) return { parsed: null, error: 'Missing replyTo' };

    if (!parsed.commentID && commentID) return { parsed: null, error: 'Missing commentID' };

    if (!parsed.userID && userID) return { parsed: null, error: 'Missing userID' };

    if (!parsed.content && content) return { parsed: null, error: 'Missing content' };

    if (content && parsed.content.length > 500) return { parsed: null, error: 'Content too long' };

    return { parsed, error: null };
  } catch {
    return { parsed: null, error: 'Invalid body' };
  }
};
