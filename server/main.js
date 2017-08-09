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
    // If the API responded with an error message and a payload 
    if (error.response) {
      const errorCode = error.response.data.code;
      const errorMessage = error.response.data.message;
    // Otherwise use a generic error message
    } else {
      const errorCode = 500;
      const errorMessage = 'Cannot access the API';
    }
    // Create an Error object and return it via callback
    const myError = new Meteor.Error(errorCode, errorMessage);
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
  
});

