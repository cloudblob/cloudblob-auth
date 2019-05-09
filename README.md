# cloudblob-auth
[![Build status](https://api.travis-ci.com/cloudblob/cloudblob-auth.svg?branch=master)](https://travis-ci.com/cloudblob/cloudblob-auth/)
[![Coverage Status](https://coveralls.io/repos/github/cloudblob/cloudblob-auth/badge.svg?branch=master)](https://coveralls.io/github/cloudblob/cloudblob-auth?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/0948a0f41ad87987c0fb/maintainability)](https://codeclimate.com/github/cloudblob/cloudblob-auth/maintainability)

JWT authorization helpers running on cloudblob-store. Use this library in a serverless project or with [cloudblob-server](https://github.com/cloudblob/cloudblob-server).


## Getting Started

Install the library with `npm`
```
npm install @cloudblob/auth
```

If your using yarn

```
yarn add @cloudblob/auth
```

And then simply configure your cloudblob-store and use the helpers.

```javascript
var clobauth = require('@cloudblob/auth')


var auth = clobauth.configure({
    storeDB: store, // *Required - an instance of cloudblob-store
    secret: "CbYc5mSAaAZW82YxXR40TqoX", // *Required - secret to use for JWT signing
    authNamespace: "auth", // (Optional) - this defaults to 'auth',
    tokenExpiry: 12 * 60 * 60 // (Optional) In seconds - defaults to 1 day/86400 seconds
})

auth.register(username, password, function(err, res) {
    if (err) {
        console.error(err.msg)
    } else {
        // print the JWT token for the newly registered user's session
        console.log(res)
        /*
        {
            token: "eyJhbGciOi...."
        }
        */
    }
})

auth.login(username, password, function(err, res) {
    if (err) {
        console.error(err.msg)
    } else {
        // print the JWT token for the user login session.
        console.log(res)
        /*
        {
            token: "eyJhbGciOi...."
        }
        */
    }
})

```