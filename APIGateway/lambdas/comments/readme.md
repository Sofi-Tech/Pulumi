# Comments Lambdas

This directory contains the code for the comments lambdas.

## Description

- [createComment.ts ](./createComment.ts) - Creates a new comment in the database.

Triggered by an HTTP `POST` request to the `/comments/create/{postID}` endpoint.

- [deleteComment.ts ](./deleteComment.ts) - Deletes a comment from the database.

Triggered by an HTTP `DELETE` request to the `/comments/delete/{commentID}` endpoint.

- [getComment.ts ](./getComment.ts) - Gets a comment from the database.

Triggered by an HTTP `GET` request to the `/comments/get/{commentID}` endpoint.

- [getComments.ts ](./getComments.ts) - Gets all comments for a post from the database.

Triggered by an HTTP `GET` request to the `/comments/{postID}` endpoint.

- [updateComment.ts ](./updateComment.ts) - Updates a comment in the database.

Triggered by an HTTP `PUT` request to the `/comments/update/{commentID}` endpoint.
