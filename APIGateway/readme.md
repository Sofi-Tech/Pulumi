## This directory consists of routes and lambdas for the API Gateway.

If any route is causing issues for body validation even though the body is correct, then please use

```bash
yarn pushWithRefresh
```

This will refresh the stack and deploy missing/broken changes the aws.

## Routes and Lambdas

```mermaid
graph LR
routes --> comments
routes --> posts
routes --> users

comments --> createComment
comments --> deleteComment
comments --> getComment
comments --> updateComment

posts --> createPost
posts --> deletePost
posts --> getPost
posts --> updatePost
posts --> feed
posts --> getPosts

users --> signup
users --> signin
users --> signout
users --> getUser
users --> updateUser
```

## Lambdas

- [Users Lambdas](./lambdas/users/)
- [Posts Lambdas](./lambdas/posts/)
- [Comments Lambdas](./lambdas/comments/)

## Routes

- [Users Routes](./routes/users/)
- [Posts Routes](./routes/posts/)
- [Comments Routes](./routes/comments/)
