import process from 'node:process';

import { userSchema } from '#tables/tables/user';

/**
 * Validates the body of a user request
 * We have out own validating function because current pulumi does not support any validation package
 *
 * @param event The customLambdaEvent object from the lambda function handler
 * @param param1 Object containing the required fields
 * @returns parsed body and error if any
 */
export const validateUserBody = (
  event: any,
  {
    userID = false,
    name = false,
    email = false,
    password = false,
    tags = false,
  }: {
    email?: boolean;
    name?: boolean;
    password?: boolean;
    tags?: boolean;
    userID?: boolean;
  },
) => {
  try {
    let { body } = event as { body: string };
    if (!body) body = '{}';
    const parsed = JSON.parse(body);

    if (!parsed) return { parsed: null, error: 'Missing body' };

    const unknownFields = Object.keys(parsed).filter(key => !Object.keys(userSchema).includes(key));
    if (unknownFields.length) return { parsed: null, error: `Unknown fields: ${unknownFields.join(', ')}` };

    // type validation
    if (parsed.userID && typeof parsed.userID !== 'string') return { parsed: null, error: 'userID should be a string' };

    if (parsed.name && typeof parsed.name !== 'string') return { parsed: null, error: 'name should be a string' };

    if (parsed.email && typeof parsed.email !== 'string') return { parsed: null, error: 'email should be a string' };

    if (parsed.password && typeof parsed.password !== 'string')
      return { parsed: null, error: 'password should be a string' };

    // value validation
    if (!parsed.userID && userID) return { parsed: null, error: 'Missing userID' };

    if (!parsed.name && name) return { parsed: null, error: 'Missing name' };

    if (!parsed.email && email) return { parsed: null, error: 'Missing email' };

    if (!parsed.password && password) return { parsed: null, error: 'Missing password' };

    if (!parsed.tags?.[0] && tags) return { parsed: null, error: 'Missing tags' };

    if (tags && !Array.isArray(parsed.tags)) return { parsed: null, error: 'tags should be an array' };

    if (parsed.tags && !parsed.tags.every((tag: string) => typeof tag === 'string')) {
      return { parsed: null, error: 'tags should be an array of strings' };
    }

    if (parsed.tags && !parsed.tags.every((tag: string) => tag.length > 2)) {
      return { parsed: null, error: 'tags should be greater than 2 characters' };
    }

    if (tags && parsed.tags?.length > 5) return { parsed: null, error: 'only 5 tags allowed at max' };

    if (
      email &&
      // eslint-disable-next-line prefer-named-capture-group, unicorn/no-unsafe-regex
      !/^(([^\s"(),.:;<>@[\]]+(\.[^\s"(),.:;<>@[\]]+)*)|(".+"))@((?!-)([^\s"(),.:;<>@[\]]+\.)+[^\s"(),.:;<>@[\]]+)[^\s"(),.:;<>@[\]-]$/i.test(
        parsed.email,
      )
    ) {
      return { parsed: null, error: 'Invalid email' };
    }

    if (name && !/^[ A-Za-z]{2,30}$/.test(parsed.name)) {
      return { parsed: null, error: 'Name must be between 2 and 30 characters' };
    }

    if (
      password &&
      !/^(?=.*\d)(?=.*[!#$%&*@^])(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(parsed.password) &&
      process.env.NODE_ENV !== 'development'
    ) {
      return {
        parsed: null,
        error:
          'Password must be min 8 letter password, with at least a symbol, upper and lower case letters and a number',
      };
    }

    if (parsed.tags) parsed.tags = parsed.tags.map((tag: string) => tag.toLowerCase());

    return { parsed, error: null };
  } catch (error) {
    console.error(error);
    return { parsed: null, error: 'Something went wrong while validating the body, Check if its a valid object' };
  }
};
