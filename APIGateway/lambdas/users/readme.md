# Users Lambdas

This directory contains the code for the users lambdas.

## Description

- [getUser.ts ](./getUser.ts) - Gets a user from the database.

Triggered by an HTTP `GET` request to the `/users/{userID}` endpoint.
Triggered by an HTTP `GET` request to the `/users/email/{email}` endpoint.

- [updateUser.ts ](./updateUser.ts) - Updates a user in the database.

Triggered by an HTTP `PUT` request to the `/users/update/{userID}` endpoint.

- [login.ts ](./signin.ts) - Logs a user in.

Triggered by an HTTP `POST` request to the `/users/signin` endpoint.

- [signup.ts ](./signup.ts) - Signs a user up.

Triggered by an HTTP `POST` request to the `/users/signup` endpoint.

- [signout.ts ](./signout.ts) - Signs a user out.

Triggered by an HTTP `POST` request to the `/users/signout` endpoint.
