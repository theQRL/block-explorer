/* eslint no-console: 0 */

// server-side startup
import grpc from 'grpc'
import tmp from 'tmp'
import fs from 'fs'
import { check } from 'meteor/check'

//  import { QRLLIB } from 'qrllib/build/web-libjsqrl.js'

// The address of the API node used
const API_NODE_ADDRESS = '104.251.219.215:9009'

// Create a temp file to store the qrl.proto file in
const qrlProtoFilePath = tmp.fileSync({ mode: '0644', prefix: 'qrl-', postfix: '.proto' }).name
const qrlClient = []

// Load qrlbase.proto and fetch current qrl.proto from node
const baseGrpcObject = grpc.load(Assets.absoluteFilePath('qrlbase.proto'))
const client = new baseGrpcObject.qrl.Base(API_NODE_ADDRESS, grpc.credentials.createInsecure())

client.getNodeInfo({}, (err, res) => {
  if (err) {
    console.log(`Error fetching qrl.proto from ${API_NODE_ADDRESS}`)
  } else {
    fs.writeFile(qrlProtoFilePath, res.grpcProto, (FSerr) => {
      if (FSerr) throw FSerr
      const grpcObject = grpc.load(qrlProtoFilePath)
      // Create area to store this grpc connection
      qrlClient.push('API')
      qrlClient.API = new grpcObject.qrl
        .PublicAPI(API_NODE_ADDRESS, grpc.credentials.createInsecure())
      console.log(`qrlClient.API loaded for ${API_NODE_ADDRESS}`)
    })
  }
})

const errorCallback = (error, message, alert) => {
  const d = new Date()
  const getTime = d.toUTCString()
  console.log(`${alert} [Timestamp: ${getTime}] ${error}`)
  const meteorError = new Meteor.Error(500, `[${getTime}] ${message} (${error})`)
  return meteorError
}

const getAddressState = (request, callback) => {
  try {
    qrlClient.API.GetAddressState({}, (error, response) => {
      if (error) {
        const myError = errorCallback(error, 'Cannot access API/GetAddressState', '**ERROR/getAddressState** ')
        callback(myError, null)
      } else {
        console.log(response)
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(error, 'Cannot access API/GetObject', '**ERROR/getObject**')
    callback(myError, null)
  }
}

const getLatestData = (request, callback) => {
  try {
    qrlClient.API.GetLatestData({}, (error, response) => {
      if (error) {
        const myError = errorCallback(error, 'Cannot access API/GetLatestData', '**ERROR/getLatestData** ')
        callback(myError, null)
      } else {
        console.log(response)
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(error, 'Cannot access API/GetObject', '**ERROR/getObject**')
    callback(myError, null)
  }
}

const getStats = (request, callback) => {
  try {
    qrlClient.API.GetStats({}, (error, response) => {
      if (error) {
        const myError = errorCallback(error, 'Cannot access API/GetStats', '**ERROR/getStats** ')
        callback(myError, null)
      } else {
        console.log(response)
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(error, 'Cannot access API/GetObject', '**ERROR/getObject**')
    callback(myError, null)
  }
}

const getObject = (request, callback) => {
  try {
    qrlClient.API.GetObject(request, (error, response) => {
      if (error) {
        const myError = errorCallback(error, 'Cannot access API/GetObject', '**ERROR/getObject**')
        callback(myError, null)
      } else {
        console.log(response)
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(error, 'Cannot access API/GetObject', '**ERROR/getObject**')
    callback(myError, null)
  }
}

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

  lastunconfirmedtx() {
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    const apiUrl = 'http://104.251.219.215:8080/api/last_unconfirmed_tx/5'
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
    if (!((Match.test(aId, String)) && (aId.length === 73))) {
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

  getStats() {
    this.unblock()
    const request = {}
    // check(request, Object)
    const response = Meteor.wrapAsync(getStats)(request)
    return response
  },

  getObject(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getObject)(request)
    return response
  },

  getLatestData(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getLatestData)(request)
    return response
  },

  getAddressState(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getAddressState)(request)
    return response
  },

})
