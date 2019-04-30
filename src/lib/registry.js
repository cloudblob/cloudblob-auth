"use strict";

var store = null;
module.exports = {
  register: function register(store) {
    store = store;
  },
  getDatastore: function getDatastore() {
    if (!store) throw TypeError("Expected datastore to have been registered");
    return store;
  }
};