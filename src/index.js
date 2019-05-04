"use strict";
/**
 * Auth routes & middelware to use with cloudblob-server or serverless
 */
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')


function Auth() { 
  // This key should be overriden for production using the 'configure' helper.
  this.secretKey = null

  // this namespace just stores an entity with bcrypt password.
  this.authNamespace = "auth"
  this.tokenExpiry = 24 * 60 * 60 // Defaults to 1 day
  this.store = null
}

/**
 * Signs a payload and return JWT.
 * 
 * @param {Object} payload 
 * @returns A signed JWT
 */
Auth.prototype.generateToken = function(payload) {
  return jwt.sign(payload, this.secretKey, {
    expiresIn: this.tokenExpiry
  })
}

/**
 * Helper to login and return JWT for valid user.
 *  
 * @param {String} username Unique username string
 * @param {String} password User password as plaintext string
 * @param {Function} cb Callback function
 */
Auth.prototype.login = function(username, password, cb) {
  if (!this.store) throw new Error("You need to call 'configure' first before using the login helper.");

  this.store.get(this.authNamespace, username).then(auth => {
    bcrypt.compare(password, auth.password).then(res => {
      if (res) {
        cb(null, {
          token: this.generateToken({roles: auth.roles, permissions: auth.permissions})
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
Auth.prototype.register = function(username, password, cb) {
  if (!this.store) throw new Error("You need to call 'configure' first before using the register helper.");

  this.store.exists(this.authNamespace, username).then(exist => {
    if (exist) {
      cb({
        msg: `User credentials ${username} already exists`
      })
    } else {
      // create the new user storing encrypted password.
      var pw = bcrypt.hashSync(password)
      this.store.put(this.authNamespace, {
        username: username,
        password: pw, 
        roles: [], 
        permissions: []
      }, username).then(res => {
        cb(null, {
          token: this.generateToken({roles: res.roles, permissions: res.permissions})
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

/**
 * Configure store and JWT defaults to use for auth. 
 * 
 * @param {Object} config Configuration to use for auth & JWT lib.
 */
function configure(config) {
  var auth = new Auth();
  auth.secretKey = config.secret;
  auth.store = config.storeDB

  if (!auth.secretKey)
    throw new Error("Expected auth secret to be specified.")

  if (!auth.store)
    throw new Error("Expected auth storeDB to be specified.")

  auth.tokenExpiry = config.tokenExpiry || auth.tokenExpiry
  auth.authNamespace = config.authNamespace || auth.authNamespace

  auth.store.namespaces[auth.authNamespace] = {
    ref: "username"
  }

  return auth
}

module.exports.configure = configure

// var auth = require('@cloudblob/auth')

// auth.configure()

// auth.login()

// return object of functions

// auth.configure({

// })

// auth.