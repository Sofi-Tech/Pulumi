import { Comments } from './tables/comment';
import { Posts } from './tables/post';
import { Tags } from './tables/tags';
import { Token } from './tables/token';
import { Users } from './tables/user';

// export table name
export const PostsTable = Posts.name;
export const UsersTable = Users.name;
export const TokenTable = Token.name;
export const CommentsTable = Comments.name;
export const TagsTable = Tags.name;
