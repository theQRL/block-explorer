// Server entry point, imports all server code

import '/imports/startup/server';
import '/imports/startup/both';


const apiCall = function (apiUrl, callback) {
  // try…catch allows you to handle errors 
  try {
    const response = HTTP.get(apiUrl).data;
    // A successful API call returns no error 
    // but the contents from the JSON response
    callback(null, response);
  } catch (error) {
      const myError = new Meteor.Error(500, 'Cannot access the API');
      callback(myError, null);
  }
};

Meteor.methods({
  
  'status': function () {
    // avoid blocking other method calls from the same client - *** may need to remove for production ***
    this.unblock();
    const apiUrl = 'http://104.251.219.215:8080/api/stats';
    // asynchronous call to the dedicated API calling function
    const response = Meteor.wrapAsync(apiCall)(apiUrl);
    return response;
  },

  'richlist': function () {
    // avoid blocking other method calls from the same client - *** may need to remove for production ***
    this.unblock();
    const apiUrl = 'http://104.251.219.215:8080/api/richlist';
    // asynchronous call to the dedicated API calling function
    const response = Meteor.wrapAsync(apiCall)(apiUrl);
    return response;
  },

  'lastblocks': function () {
    // avoid blocking other method calls from the same client - *** may need to remove for production ***
    this.unblock();
    const apiUrl = 'http://104.251.219.215:8080/api/last_block/5';
    // asynchronous call to the dedicated API calling function
    const response = Meteor.wrapAsync(apiCall)(apiUrl);
    return response;
  },

  'lasttx': function () {
    // avoid blocking other method calls from the same client - *** may need to remove for production ***
    this.unblock();
    const apiUrl = 'http://104.251.219.215:8080/api/last_tx/5';
    // asynchronous call to the dedicated API calling function
    const response = Meteor.wrapAsync(apiCall)(apiUrl);
    return response;
  },

  'stakers': function () {
    // avoid blocking other method calls from the same client - *** may need to remove for production ***
    this.unblock();
    const apiUrl = 'http://104.251.219.215:8080/api/stakers';
    // asynchronous call to the dedicated API calling function
    const response = Meteor.wrapAsync(apiCall)(apiUrl);
    return response;
  },

  'nextstakers': function () {
    // avoid blocking other method calls from the same client - *** may need to remove for production ***
    this.unblock();
    const apiUrl = 'http://104.251.219.215:8080/api/next_stakers';
    // asynchronous call to the dedicated API calling function
    const response = Meteor.wrapAsync(apiCall)(apiUrl);
    return response;
  },

  'txhash': function(txId) {
    if ((Match.test(txId,String)) && (txId.length === 64)) {
      // avoid blocking other method calls from the same client - *** may need to remove for production ***
      this.unblock();
      const apiUrl = 'http://104.251.219.215:8080/api/txhash/' + txId;
      // asynchronous call to the dedicated API calling function
      const response = Meteor.wrapAsync(apiCall)(apiUrl);
      return response;
    } else {
      const errorCode = 400;
      const errorMessage = 'Badly formed transaction ID';
      throw new Meteor.Error(errorCode, errorMessage);
    }
  },

  'block': function(blockId) {
    if (Match.test(blockId,Number)) {
      // avoid blocking other method calls from the same client - *** may need to remove for production ***
      this.unblock();
      const apiUrl = 'http://104.251.219.215:8080/api/block_data/' + blockId;
      // asynchronous call to the dedicated API calling function
      const response = Meteor.wrapAsync(apiCall)(apiUrl);
      return response;
    } else {
      const errorCode = 400;
      const errorMessage = 'Invalid block number';
      throw new Meteor.Error(errorCode, errorMessage);
    }
  },

  'address': function(aId) {
    if ((Match.test(aId,String)) && (aId.length === 69)) {
      // avoid blocking other method calls from the same client - *** may need to remove for production ***
      this.unblock();
      const apiUrl = 'http://104.251.219.215:8080/api/address/' + aId;
      // asynchronous call to the dedicated API calling function
      const response = Meteor.wrapAsync(apiCall)(apiUrl);
      return response;
    } else {
      const errorCode = 400;
      const errorMessage = 'Badly formed address';
      throw new Meteor.Error(errorCode, errorMessage);
    }
  },
  
});

