## HTTP Routes, Responses and Required

# Users

#### SignUp:

    - POST /users/signup

    tokenRequired: false
    Body: {email, password, name}
    Response: {token, user}

#### SignIn:

    - POST /users/signin

    tokenRequired: false
    Body: {email, password}
    Response: {token, user}

#### SignOut:

    - POST /users/signout

    tokenRequired: false
    Body: {email, password}
    Response: {message}

#### GetUser:

    - GET /users/:id
    - GET /users/email/:email

    tokenRequired: false
    Body: {}
    Response: {user}

#### UpdateUser:

    - PATCH /users/:id

    tokenRequired: true
    Body: {name, tags}
    Response: {user}

# Posts

#### CreatePost:

    - POST /posts/create

    tokenRequired: true
    Body: {title, body, tags}
    Response: {post}

#### GetPost:

    - GET /posts/post/:id

    tokenRequired: false
    Body: {}
    Response: {post}

#### GetPosts:

    - GET /posts/:userID

    tokenRequired: false
    Body: {}
    Response: {posts}

#### UpdatePost:

    - PATCH /posts/update/:id

    tokenRequired: true
    Body: {content, title, tags}
    Response: {post}

#### DeletePost:

    - DELETE /posts/delete/:id

    tokenRequired: true
    Body: {}
    Response: {message}

#### Feed:

    - GET /posts/feed/:postID

    tokenRequired: true
    Body: {}
    Response: {posts}
    postID: optional <null | lastPostID> (required for pagination)

# Comments

#### CreateComment:

    - POST /comments/create/:postID

    tokenRequired: true
    Body: {content}
    Response: {comment}

#### GetComments:

    - GET /comments/:postID

    tokenRequired: false
    Body: {}
    Response: {comments}

#### UpdateComment:

    - PATCH /comments/update/:commentID

    tokenRequired: true
    Body: {content}
    Response: {comment}

#### DeleteComment:

    - DELETE /comments/delete/:commentID

    tokenRequired: true
    Body: {}
    Response: {message}
