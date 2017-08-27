// Server entry point, imports all server code

import { check } from 'meteor/check'

import '/imports/startup/server'
import '/imports/startup/both'


const apiCall = (apiUrl, callback) => {
  try {
    const response = HTTP.get(apiUrl).data
    // Successful call
    callback(null, response)
  } catch (error) {
    const myError = new Meteor.Error(500, 'Cannot access the API')
    callback(myError, null)
  }
}

Meteor.methods({

  QRLvalue() {
    this.unblock()
    const apiUrl = 'https://bittrex.com/api/v1.1/public/getmarketsummary?market=btc-qrl'
    const apiUrlUSD = 'https://bittrex.com/api/v1.1/public/getmarketsummary?market=usdt-btc'
    // asynchronous call to API
    const response = Meteor.wrapAsync(apiCall)(apiUrl)
    const responseUSD = Meteor.wrapAsync(apiCall)(apiUrlUSD)
    const usd = response.result[0].Last * responseUSD.result[0].Last
    return usd
  },

  status() {
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    const apiUrl = 'http://104.251.219.215:8080/api/stats'
    // asynchronous call to API
    const response = Meteor.wrapAsync(apiCall)(apiUrl)
    return response
  },

  richlist() {
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    const apiUrl = 'http://104.251.219.215:8080/api/richlist'
    // asynchronous call to API
    const response = Meteor.wrapAsync(apiCall)(apiUrl)
    return response
  },

  lastblocks() {
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    const apiUrl = 'http://104.251.219.215:8080/api/last_block/5'
    // asynchronous call to API
    const response = Meteor.wrapAsync(apiCall)(apiUrl)
    return response
  },

  lasttx() {
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    const apiUrl = 'http://104.251.219.215:8080/api/last_tx/5'
    // asynchronous call to API
    const response = Meteor.wrapAsync(apiCall)(apiUrl)
    return response
  },

  stakers() {
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    const apiUrl = 'http://104.251.219.215:8080/api/stakers'
    // asynchronous call to API
    const response = Meteor.wrapAsync(apiCall)(apiUrl)
    return response
  },

  nextstakers() {
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    const apiUrl = 'http://104.251.219.215:8080/api/next_stakers'
    // asynchronous call to API
    const response = Meteor.wrapAsync(apiCall)(apiUrl)
    return response
  },

  txhash(txId) {
    check(txId, String)
    if (!((Match.test(txId, String)) && (txId.length === 64))) {
      const errorCode = 400
      const errorMessage = 'Badly formed transaction ID'
      throw new Meteor.Error(errorCode, errorMessage)
    } else {
      // avoid blocking other method calls from same client - *may need to remove for production*
      this.unblock()
      const apiUrl = `http://104.251.219.215:8080/api/txhash/${txId}`
      // asynchronous call to API
      const response = Meteor.wrapAsync(apiCall)(apiUrl)
      return response
    }
  },

  block(blockId) {
    check(blockId, Number)
    if (!(Match.test(blockId, Number))) {
      const errorCode = 400
      const errorMessage = 'Invalid block number'
      throw new Meteor.Error(errorCode, errorMessage)
    } else {
      // avoid blocking other method calls from same client - *may need to remove for production*
      this.unblock()
      const apiUrl = `http://104.251.219.215:8080/api/block_data/${blockId}`
      // asynchronous call to API
      const response = Meteor.wrapAsync(apiCall)(apiUrl)
      return response
    }
  },

  address(aId) {
    check(aId, String)
    if (!((Match.test(aId, String)) && (aId.length === 69))) {
      const errorCode = 400
      const errorMessage = 'Badly formed address'
      throw new Meteor.Error(errorCode, errorMessage)
    } else {
      // avoid blocking other method calls from same client - *may need to remove for production*
      this.unblock()
      const apiUrl = `http://104.251.219.215:8080/api/address/${aId}`
      // asynchronous call to API
      const response = Meteor.wrapAsync(apiCall)(apiUrl)
      return response
    }
  },

})
