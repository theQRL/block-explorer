/* eslint no-console: 0 */
// server-side startup
import grpc from 'grpc'
import tmp from 'tmp'
import fs from 'fs'
import { check } from 'meteor/check'
import '/imports/api/index.js'
import '/imports/startup/server/cron.js'

const ab2str = buf => String.fromCharCode.apply(null, new Uint16Array(buf))

//  import { QRLLIB } from 'qrllib/build/web-libjsqrl.js'

// The address of the API node used
let API_NODE_ADDRESS = '104.237.3.185:9009'

// Create a temp file to store the qrl.proto file in
let qrlProtoFilePath = tmp.fileSync({ mode: '0644', prefix: 'qrl-', postfix: '.proto' }).name
let qrlClient = []

// Load qrlbase.proto and fetch current qrl.proto from node
let baseGrpcObject = grpc.load(Assets.absoluteFilePath('qrlbase.proto'))
let client = new baseGrpcObject.qrl.Base(API_NODE_ADDRESS, grpc.credentials.createInsecure())

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
  if (qrlClient.length !== 0) {
    try {
      qrlClient.API.GetAddressState(request, (error, response) => {
        if (error) {
          const myError = errorCallback(error, 'Cannot access API/GetAddressState', '**ERROR/getAddressState** ')
          callback(myError, null)
        } else {
          // server side buffering being added here
          // if (!(Addresses.findOne({ Address: response.state.address }))) {
          //   console.log('Going to add this one...')
          //   Addresses.insert({ Address: response.state.address })
          // }
          callback(null, response)
        }
      })
    } catch (error) {
      const myError = errorCallback(error, 'Cannot access API/GetObject', '**ERROR/getObject**')
      callback(myError, null)
    }
  } else {
    const myError = errorCallback('The block explorer server cannot connect to the API node', 'Cannot access API/GetStats/b', '**ERROR/getStats/b**')
    callback(myError, null)
  }
}

export const getLatestData = (request, callback) => {
  if (qrlClient.length !== 0) {
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
  } else {
    const myError = errorCallback('The block explorer server cannot connect to the API node', 'Cannot access API/GetStats/b', '**ERROR/getStats/b**')
    callback(myError, null)
  }
}

export const getStats = (request, callback) => {
  if (qrlClient.length !== 0) {
    try {
      qrlClient.API.GetStats({}, (error, response) => {
        if (error) {
          const myError = errorCallback(error, 'Cannot access API/GetStats/a', '**ERROR/getStats/a** ')
          callback(myError, null)
        } else {
          callback(null, response)
        }
      })
    } catch (error) {
      const myError = errorCallback(error, 'Cannot access API/GetStats/b', '**ERROR/getStats/b**')
      callback(myError, null)
    }
  } else {
    const myError = errorCallback('The block explorer server cannot connect to the API node', 'Cannot access API/GetStats/b', '**ERROR/getStats/b**')
    callback(myError, null)
  }
}

const getStakers = (request, callback) => {
  if (qrlClient.length !== 0) {
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
              balance: staker.address_state.balance * 10e-9,
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
  } else {
    const myError = errorCallback('The block explorer server cannot connect to the API node', 'Cannot access API/GetStats/b', '**ERROR/getStats/b**')
    callback(myError, null)
  }
}

const getObject = (request, callback) => {
  if (qrlClient.length !== 0) {
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
  } else {
    const myError = errorCallback('The block explorer server cannot connect to the API node', 'Cannot access API/GetStats/b', '**ERROR/getStats/b**')
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
    // asynchronous call to API
    const response = Meteor.wrapAsync(getLatestData)({ filter: 'TRANSACTIONS_UNCONFIRMED', offset: 0, quantity: 5 })
    return response
  },

  txhash(txId) {
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    check(txId, String)
    if (!((Match.test(txId, String)) && (txId.length === 64))) {
      const errorCode = 400
      const errorMessage = 'Badly formed transaction ID'
      throw new Meteor.Error(errorCode, errorMessage)
    } else {
      // asynchronous call to API
      const req = { query: Buffer.from(txId, 'hex') }
      const response = Meteor.wrapAsync(getObject)(req)
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
      const req = {
        query: Buffer.from(blockId.toString()),
      }
      const response = Meteor.wrapAsync(getObject)(req)
      return response
    }
  },

  addressTransactions(targets) {
    check(targets, Array)
    // TODO: throw an error if greater than 10
    const result = []
    targets.forEach((arr) => {
      try {
        const req = { query: Buffer.from(arr.txhash, 'hex') }
        const response = Meteor.wrapAsync(getObject)(req)
        response.txhash = arr.txhash
        result.push(response)
      } catch (error) {
        throw new Meteor.Error('270', error)
      }
    })
    return result
  },

  getStats() {
    this.unblock()
    const request = {}
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

  // Switch node --> remove for production
  // cyyber(request) {
  //   check(request, String)
  //   API_NODE_ADDRESS = `${request}:9009`

  //   // Create a temp file to store the qrl.proto file in
  //   qrlProtoFilePath = tmp.fileSync({ mode: '0644', prefix: 'qrl-', postfix: '.proto' }).name
  //   qrlClient = []

  //   // Load qrlbase.proto and fetch current qrl.proto from node
  //   baseGrpcObject = grpc.load(Assets.absoluteFilePath('qrlbase.proto'))
  //   client = new baseGrpcObject.qrl.Base(API_NODE_ADDRESS, grpc.credentials.createInsecure())

  //   client.getNodeInfo({}, (err, res) => {
  //     if (err) {
  //       console.log(`Error fetching qrl.proto from ${API_NODE_ADDRESS}`)
  //     } else {
  //       fs.writeFile(qrlProtoFilePath, res.grpcProto, (FSerr) => {
  //         if (FSerr) throw FSerr
  //         const grpcObject = grpc.load(qrlProtoFilePath)
  //         // Create area to store this grpc connection
  //         qrlClient.push('API')
  //         qrlClient.API = new grpcObject.qrl
  //           .PublicAPI(API_NODE_ADDRESS, grpc.credentials.createInsecure())
  //         console.log(`qrlClient.API loaded for ${API_NODE_ADDRESS}`)
  //       })
  //     }
  //   })
  // },
})
