"use strict";

var _storage = require("./storage");

var _v = _interopRequireDefault(require("uuid/v4"));

var _uuidParse = _interopRequireDefault(require("uuid-parse"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Datastore = function Datastore() {
  var _this = this;

  var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  _classCallCheck(this, Datastore);

  _defineProperty(this, "loadIndex", function (namespace) {
    if (Object.keys(_this._indexer).indexOf(namespace) < 0) throw Error("No indexer for namespace '".concat(namespace, "' defined"));
    var self = _this;

    if (!_this._indexer[namespace]._index) {
      var key = [namespace, _this._indexer[namespace]._indexPath].join('/');
      return _this._storage.readDoc(_this._bucket, key).then(function (docBody) {
        self._indexer[namespace].load(docBody);
      });
    } else {
      // index has already been loaded, just return it as a promise
      return new Promise(function (resolve, reject) {
        return resolve();
      });
    }
  });

  _defineProperty(this, "_generateId", function () {
    return _uuidParse["default"].parse((0, _v["default"])(), Buffer.alloc(16)).toString('hex');
  });

  _defineProperty(this, "_loadFromCache", function (namespace, key) {
    if (_this._cache) {
      _this._cache.get([namespace, key].join('/'), function (err, val) {
        if (!err) return Promise.resolve(JSON.parse(val));
      });
    }
  });

  _defineProperty(this, "_cacheEntity", function (namespace, key, doc) {
    if (_this._cache) _this._cache.set([namespace, key].join('/'), JSON.stringify(doc));
  });

  _defineProperty(this, "dumpIndex", function (namespace) {
    if (Object.keys(_this._indexer).indexOf(namespace) < 0) throw Error("No indexer for namespace '".concat(namespace, "' defined"));
    var key = [namespace, _this._indexer[namespace]._indexPath].join('/');
    return _this._storage.writeDoc(_this._bucket, key, _this._indexer[namespace].serialize()).then(function (res) {
      if (res.success) _this._indexer[namespace].setClean();
    });
  });

  _defineProperty(this, "clearIndex", function (namespace) {
    var saveFirst = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if (Object.keys(_this._indexer).indexOf(namespace) < 0) throw Error("No indexer for namespace '".concat(namespace, "' defined"));
    if (saveFirst && _this._indexer[namespace].isDirty()) _this.dumpIndex(namespace).then(function () {
      return _this._indexer[namespace].reset();
    });else _this._indexer[namespace].reset();
  });

  _defineProperty(this, "exists", function (namespace, key) {// return a check for entity existence
  });

  _defineProperty(this, "put", function (namespace, doc, key) {
    // there can be some use cases where a user would want to manage reference theirself
    var _id = key;
    if (!_id) _id = _this._generateId();

    var fullKey = _this._storage._buildKey(namespace, _id);

    doc[_this._indexer[namespace]._ref] = _id;
    return _this._storage.writeDoc(_this._bucket, fullKey, doc);
  });

  _defineProperty(this, "get", function (namespace, key) {
    var fullKey = _this._storage._buildKey(namespace, key);

    var cached = _this._loadFromCache(namespace, key);

    if (cached) return cached;
    return _this._storage.readDoc(_this._bucket, fullKey).then(function (res) {
      _this._cacheEntity(namespace, key, res);

      return res;
    });
  });

  _defineProperty(this, "index", function (namespace, doc) {
    var self = _this;
    return _this.loadIndex(namespace).then(function () {
      return self._indexer[namespace].add(doc);
    });
  });

  _defineProperty(this, "filter", function (namespace, query) {
    var keysOnly = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var self = _this;
    return _this.loadIndex(namespace).then(function () {
      return {
        'results': self._indexer[namespace].search(query)
      };
    });
  });

  _defineProperty(this, "list", function (namespace, max) {
    return _this._storage.listDocs(_this._bucket, namespace, max).then(function (res) {
      var getKeys = res.results.map(function (key) {
        return _this.get(namespace, key);
      });
      return Promise.all(getKeys).then(function (data) {
        return {
          next: data.NextContinuationToken,
          results: data
        };
      });
    });
  });

  var db = params.db,
      clean = _objectWithoutProperties(params, ["db"]);

  if (!db) throw Error("Expected 'db' name to be specified");
  this._bucket = db;
  this._cache = clean.cache;
  if (clean.storage) this._storage = clean.storage;else this._storage = new _storage.MockStore();

  this._storage.initConnection();

  if (clean.namespaces) this._indexer = clean.namespaces;else this._indexer = {};
};

module.exports = Datastore;