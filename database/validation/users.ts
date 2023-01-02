import process from 'node:process';

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

    console.log(process.env.NODE_ENV);
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
  } catch {
    return { parsed: null, error: 'Invalid body' };
  }
};
