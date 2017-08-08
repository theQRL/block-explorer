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

// API call to endpoint:
//    http://104.251.219.215:8080/api/stats
//
//    e.g. returned JSON
//    {
//      "status": "ok",
//      "unmined": 19941519.82131225,
//      "network": "qrl testnet",
//      "block_reward": 0.84163887,
//      "emission": 1058480.17868775,
//      "stake_validators": 11,
//      "epoch": 118,
//      "block_time": 45.68120146989823,
//      "version": "alpha/0.11a",
//      "staked_percentage_emission": 378.29,
//      "blockheight": 11864,
//      "nodes": 18,
//      "block_time_variance": 53.500768423080444,
//      "network_uptime": 675089.9059939384
//    }


Meteor.methods({
  'status': function () {
    // avoid blocking other method calls from the same client
    this.unblock();
    const apiUrl = 'http://104.251.219.215:8080/api/stats';
    // asynchronous call to the dedicated API calling function
    const response = Meteor.wrapAsync(apiCall)(apiUrl);
    return response;
  },
});
