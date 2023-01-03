# This directory consists of all the database codes.

## Description

The directory consists of two sub-directories:

- [tables](./tables/) - Contains the table creation, schema, types for the DynamoDB database tables.
- [validation](./validation/) - Contains all the validation functions before the data is inserted into the database.

## Tables

- [comments](./tables/comment.ts) - Contains the table creation, schema, types for the comments table.
- [posts](./tables/post.ts) - Contains the table creation, schema, types for the posts table.
- [users](./tables/user.ts) - Contains the table creation, schema, types for the users table.
- [token](./tables/token.ts) - Contains the table creation, schema, types for the token table.
- [tags](./tables/tags.ts) - Contains the table creation, schema, types for the tags table.

## Validation

- [comments](./validation/comments.ts) - Contains the validation functions for the comments table.
- [posts](./validation/posts.ts) - Contains the validation functions for the posts table.
- [users](./validation/users.ts) - Contains the validation functions for the users table.
