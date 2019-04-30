/**
 * Auth routes & middelware to use with clob-server.
 */
var jwt = require('jsonwebtoken')
var bcrypt = require('bcryptjs')


var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

// CHANGE THIS KEY FOR YOUR PRODUCTION USE
var secretKey = "secretkey123456"

// this namespace just stores an entity with bcrypt password.
var authNamespace = "user/auth"

var tokenExpiry = 24 * 60 * 60 // 1 day

var store = null


function configure(config) {
  secretKey = config.secretKey;
  store = config.storeDB
  tokenExpiry = config.tokenExpiry
  authNamespace = config.authNamespace
}

function generateToken(payload) {
  return jwt.sign(payload, secretKey, {
    expiresIn:  tokenExpiry
  })
}


function login(req, res) {
  store.get(authNamespace, req.body.username).then(auth => {
    bcrypt.compare(req.body.password, auth.password).then(res => {
      if (res) {
        res.json({
          success: true,
          token: generateToken({roles: auth.roles, permissions: auth.permissions})
        })
      } else {
        res.status(400)
        res.json({
          success: false,
          msg: "Invalid credentials"
        })
      }
    })
  }).catch(err => {
    // if something went wrong it's assumed user doesn't exist.
    res.status(400)
    res.json({
      success: false,
      msg: "Invalid credentials"
    })
  })
}


function register(req, res) {
  store.exists(authNamespace, req.body.username).then(exist => {
    if (exist) {
      res.status(400)
      res.json({
        success: false,
        msg: `User credentials ${req.body.username} already exist`
      })
    } else {
      // create the new user
      var pw = bcrypt.hashSync(req.body.password)
      store.put(authNamespace, {
        username: req.body.username,
        password: pw, 
        roles: [], 
        permissions: []
      }).then(res => {
        res.json({
          success: true,
          token: generateToken({roles: res.roles, permissions: res.permissions})
        })
      })
    }
  }).catch(err => {
    console.error(err)
    res.status(500)
    res.json({
      success: false,
      msg: "Something went wrong, sorry"
    })
  })
}

// jwtMiddleware


module.exports.configure = configure
module.exports.register = register
module.exports.login = login
