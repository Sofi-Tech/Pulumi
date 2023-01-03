# Posts Lambdas

This directory contains the code for the posts lambdas.

## Description

- [createPost.ts ](./createPost.ts) - Creates a new post in the database.

Triggered by an HTTP `POST` request to the `/posts/create` endpoint.

- [deletePost.ts ](./deletePost.ts) - Deletes a post from the database.

Triggered by an HTTP `DELETE` request to the `/posts/delete/{postID}` endpoint.

- [getPost.ts ](./getPost.ts) - Gets a post from the database.

Triggered by an HTTP `GET` request to the `/posts/post/{postID}` endpoint.

- [getPosts.ts ](./getPosts.ts) - Gets all posts from the database.

Triggered by an HTTP `GET` request to the `/posts` endpoint.

- [updatePost.ts ](./updatePost.ts) - Updates a post in the database.

Triggered by an HTTP `PUT` request to the `/posts/update/{postID}` endpoint.

- [feed.ts ](./feed.ts) - Gets all feed for the logged in user.

Triggered by an HTTP `GET` request to the `/posts/feed/{postID}` endpoint.
The postID can be set to null to get the latest posts. The postID can be set to a postID to get the posts after that post.
