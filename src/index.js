"use strict";
/**
 * Auth routes & middelware to use with cloudblob-server or serverless
 */
var jwt = require('jsonwebtoken')
var bcrypt = require('bcryptjs')

// This key should be overriden for production using the 'configure' helper.
var secretKey = null

// this namespace just stores an entity with bcrypt password.
var authNamespace = "auth"
var tokenExpiry = 24 * 60 * 60 // Defaults to 1 day
var store = null

/**
 * Configure store and JWT defaults to use for auth. 
 * 
 * @param {Object} config Configuration to use for auth & JWT lib.
 */
function configure(config) {
  secretKey = config.secret;
  store = config.storeDB

  if (!secretKey)
    throw new Error("Expected auth secret to be configured.")

  if (!store)
    throw new Error("Expected auth storeDB to be configured.")

  tokenExpiry = config.tokenExpiry
  authNamespace = config.authNamespace
}

/**
 * Signs a payload and return JWT.
 * 
 * @param {Object} payload 
 * @returns A signed JWT
 */
function generateToken(payload) {
  return jwt.sign(payload, secretKey, {
    expiresIn:  tokenExpiry
  })
}

/**
 * Helper to login and return JWT for valid user.
 *  
 * @param {String} username Unique username string
 * @param {String} password User password as plaintext string
 * @param {Function} cb Callback function
 */
function login(username, password, cb) {
  if (!store) throw new Error("You need to call 'configure' first before using the login helper.");

  store.get(authNamespace, username).then(auth => {
    bcrypt.compare(password, auth.password).then(res => {
      if (res) {
        cb(null, {
          token: generateToken({roles: auth.roles, permissions: auth.permissions})
        })
      } else {
        cb({
          msg: "Invalid credentials"
        })
      }
    })
  }).catch(err => {
    // if something went wrong it's assumed user doesn't exist or there
    // is an issue with their account.
    console.error(err)
    cb({
      msg: "Invalid credentials"
    })
  })
}


/**
 * Helper for checking if user account exists, and registers account if it doesn't.
 * 
 * @param {String} username Unique username string
 * @param {String} password User password as plaintext string
 * @param {Function} cb Callback function
 */
function register(username, password, cb) {
  if (!store) throw new Error("You need to call 'configure' first before using the register helper.");

  store.exists(authNamespace, username).then(exist => {
    if (exist) {
      cb({
        msg: `User credentials ${username} already exist`
      })
    } else {
      // create the new user storing encrypted password.
      var pw = bcrypt.hashSync(password)
      store.put(authNamespace, {
        username: username,
        password: pw, 
        roles: [], 
        permissions: []
      }).then(res => {
        cb(null, {
          token: generateToken({roles: res.roles, permissions: res.permissions})
        })
      })
    }
  }).catch(err => {
    console.error(err)
    cb({
      msg: "Something went wrong, sorry"
    })
  })
}

module.exports.configure = configure
module.exports.register = register
module.exports.login = login