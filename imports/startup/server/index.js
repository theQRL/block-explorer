/* eslint no-console: 0 */

// server-side startup
import grpc from 'grpc'
import tmp from 'tmp'
import fs from 'fs'
import { check } from 'meteor/check'

const ab2str = buf => String.fromCharCode.apply(null, new Uint16Array(buf))

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
    qrlClient.API.GetAddressState(request, (error, response) => {
      if (error) {
        const myError = errorCallback(error, 'Cannot access API/GetAddressState', '**ERROR/getAddressState** ')
        callback(myError, null)
      } else {
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
    qrlClient.API.GetLatestData(request, (error, response) => {
      if (error) {
        const myError = errorCallback(error, 'Cannot access API/GetLatestData', '**ERROR/getLatestData** ')
        callback(myError, null)
      } else {
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
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(error, 'Cannot access API/GetObject', '**ERROR/getObject**')
    callback(myError, null)
  }
}

const getStakers = (request, callback) => {
  try {
    qrlClient.API.GetStakers(request, (error, response) => {
      if (error) {
        const myError = errorCallback(error, 'Cannot access API/GetStakers', '**ERROR/getStakers** ')
        callback(myError, null)
      } else {
        const currentStakers = []
        response.stakers.forEach((staker) => {
          currentStakers.push({
            address: ab2str(staker.address_state.address),
            balance: staker.address_state.balance / 100000000,
            nonce: staker.address_state.nonce,
            hash_terminator: staker.terminator_hash.toString('hex'),
          })
        })
        callback(null, currentStakers)
      }
    })
  } catch (error) {
    const myError = errorCallback(error, 'Cannot access API/GetStakers', '**ERROR/getStakers**')
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
        // console.log(response)
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
    // asynchronous call to API
    const response = Meteor.wrapAsync(getStats)({})
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
    // asynchronous call to API
    const response = Meteor.wrapAsync(getLatestData)({ filter: 'BLOCKHEADERS', offset: 0, quantity: 5 })
    return response
  },

  lasttx() {
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    // asynchronous call to API
    const response = Meteor.wrapAsync(getLatestData)({ filter: 'TRANSACTIONS', offset: 0, quantity: 5 })
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

  txhash(txId) {
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    check(txId, String)
    console.log(txId)
    if (!((Match.test(txId, String)) && (txId.length === 64))) {
      const errorCode = 400
      const errorMessage = 'Badly formed transaction ID'
      throw new Meteor.Error(errorCode, errorMessage)
    } else {
      // asynchronous call to API

      const req = {
        query: Buffer.from(txId, 'hex'),
      }

      const response = Meteor.wrapAsync(getObject)(req)

      // FIXME: This will require refactoring
      // TODO: This could probably be unified with block
      response.transaction.tx.addr_from = Buffer.from(response.transaction.tx.addr_from).toString()
      response.transaction.tx.transaction_hash =
        Buffer.from(response.transaction.tx.transaction_hash).toString('hex')

      response.transaction.tx.addr_to = ''
      response.transaction.tx.amount = ''
      if (response.transaction.coinbase) {
        response.transaction.tx.addr_to =
          Buffer.from(response.transaction.tx.coinbase.addr_to).toString()
        response.transaction.tx.coinbase.addr_to =
          Buffer.from(response.transaction.tx.coinbase.addr_to).toString()
        // FIXME: We need a unified way to format Quanta
        response.transaction.tx.amount = response.transaction.tx.coinbase.amount * 1e-8
      }
      if (response.transaction.tx.transfer)
      {
        response.transaction.tx.addr_to =
          Buffer.from(response.transaction.tx.transfer.addr_to).toString()
        response.transaction.tx.transfer.addr_to =
          Buffer.from(response.transaction.tx.transfer.addr_to).toString()
        // FIXME: We need a unified way to format Quanta
        response.transaction.tx.amount = response.transaction.tx.transfer.amount * 1e-8
      }

      response.transaction.tx.public_key = Buffer.from(response.transaction.tx.public_key).toString('hex')
      response.transaction.tx.signature = Buffer.from(response.transaction.tx.signature).toString('hex')

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
      // asynchronous call to API
      check(blockId, Number)
      req = {
        query: Buffer.from(blockId.toString()),
      }
      const response = Meteor.wrapAsync(getObject)(req)
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
  addressTransactions(targets) {
    check(targets, Array)
    const result = []
    targets.forEach((arr) => {
      console.log(`Lookup Txhash ${arr.txhash}`)
      result.push({ txhash: arr.txhash, amount: 2344 })
    })
    return result
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

  stakers(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getStakers)(request)
    return response
  },

  getAddressState(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getAddressState)(request)
    return response
  },

})
