import sinon from 'sinon'
import Datastore from '@cloudblob/store'
import { expect } from 'chai'
import CloudblobAuth from '../src/index'


describe('configure', () => {

  it('throws if storeDb not provided', () => {
    expect(() => {
      CloudblobAuth.configure({secret: "1234"})
    }).to.throw('Expected auth storeDB to be specified.')
  })

  it('throws if secret not provided', () => {
    expect(() => {
      CloudblobAuth.configure({})
    }).to.throw('Expected auth secret to be specified.')
  })

  it('should configure the auth namespace', () => {
    const store = new Datastore({db: 'example'})
    const auth = CloudblobAuth.configure({
      storeDB: store,
      secret: "1234"
    })

    expect(store.checkNS('auth')).to.be.true
    expect(store.namespaces['auth'].ref).to.be.equal('username')
  })
})

describe('register', () => {
  const store = new Datastore({db: 'example'})
  const username = "john@example.com"
  const password = "test1234"
  const auth = CloudblobAuth.configure({
    storeDB: store,
    secret: "1234"
  })

  it('passes for new user and calls callback', (done) => {
    auth.register(username, password, (err, res) => {
      // make sure token is returned and no error present
      expect(err).to.be.null
      expect(res.token).to.not.be.undefined

      // make sure the user was actually created in store
      store.get('auth', username).then(res => {
        expect(res).to.not.be.null
        expect(res.username).to.be.equal(username)
        done()
      }).catch(err => {
        done(new Error(err))
      })
    })
  })

  it('fails if user account already exists', (done) => {
    auth.register(username, password, (err, res) => {
      if (res)
        done(new Error("Expected user to already exist"))
      else {
        expect(err.msg).to.be.equal(`User credentials ${username} already exists`)
        done()
      }
    })
  })
})

describe('login', () => {
  const store = new Datastore({db: 'example'})
  const username = "john@example.com"
  const password = "test1234"
  const auth = CloudblobAuth.configure({
    storeDB: store,
    secret: "1234"
  })

  before((done) => {
    auth.register(username, password, (err, res) => {
      done()
    })
  })

  it('fails login if user doesnt exist', (done) => {
    auth.login(username+"1", password, (err, res) => {
      if (res)
        done(new Error("Didn't expect login to pass"))
      else {
        expect(err.msg).to.be.equal('Invalid credentials')
        done()
      }
    })
  })

  it('fails login if user password incorrect', (done) => {
    auth.login(username, password+"1", (err, res) => {
      if (res)
        done(new Error("Didn't expect login to pass"))
      else {
        expect(err.msg).to.be.equal('Invalid credentials')
        done()
      }
    })
  })

  it('succeeds with token if credentials exist', (done) => {
    auth.login(username, password, (err, res) => {
      expect(err).to.be.null
      expect(res.token).to.not.be.undefined
      done()
    })
  })
})