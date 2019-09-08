/* eslint no-console: 0, max-len: 0 */
// server-side startup
import grpc from 'grpc'
import tmp from 'tmp'
import fs from 'fs'
import helpers from '@theqrl/explorer-helpers'
import { JsonRoutes } from 'meteor/simple:json-routes'
import { check } from 'meteor/check'
import { BrowserPolicy } from 'meteor/qrl:browser-policy'
import { blockData } from '/imports/api/index.js'
import '/imports/startup/server/cron.js' /* eslint-disable-line */
import {
  EXPLORER_VERSION, SHOR_PER_QUANTA, decimalToBinary, anyAddressToRaw,
} from '../both/index.js'


// Apply BrowserPolicy
BrowserPolicy.content.disallowInlineScripts()
BrowserPolicy.content.allowStyleOrigin('cdnjs.cloudflare.com')
BrowserPolicy.content.allowStyleOrigin('fonts.googleapis.com')
BrowserPolicy.content.allowStyleOrigin('cdn.jsdelivr.net')
BrowserPolicy.content.allowFontOrigin('fonts.gstatic.com')
BrowserPolicy.content.allowFontOrigin('cdnjs.cloudflare.com')
BrowserPolicy.content.allowFontOrigin('cdn.jsdelivr.net')
BrowserPolicy.content.allowScriptOrigin('cdn.jsdelivr.net')
BrowserPolicy.content.allowScriptOrigin('cdnjs.cloudflare.com')
BrowserPolicy.content.allowFontDataUrl('cdnjs.cloudflare.com')
BrowserPolicy.content.allowConnectOrigin('wss://*.theqrl.org:*')

// The addresses of the API nodes and their state
// defaults to Testnet if run without config file
// state true is connected, false is disconnected
let API_NODES = [
  {
    id: 'testnet-1',
    address: 'testnet-1.automated.theqrl.org:19009',
    state: false,
    height: 0,
  },
  {
    id: 'testnet-2',
    address: 'testnet-2.automated.theqrl.org:19009',
    state: false,
    height: 0,
  },
  {
    id: 'testnet-3',
    address: 'testnet-3.automated.theqrl.org:19009',
    state: false,
    height: 0,
  },
  {
    id: 'testnet-4',
    address: 'testnet-4.automated.theqrl.org:19009',
    state: false,
    height: 0,
  },
]

// Grab config and set API nodes if set
try {
  if (Meteor.settings.api.primaryNode.length > 0) {
    // Reset API_NODES
    API_NODES = []
    // Set primary node
    API_NODES.push({
      address: Meteor.settings.api.primaryNode,
      state: false,
      height: 0,
    })
  }
  if (Meteor.settings.api.secondaryNode.length > 0) {
    // Set secondary node
    API_NODES.push({
      address: Meteor.settings.api.secondaryNode,
      state: false,
      height: 0,
    })
  }
  if (Meteor.settings.api.tertiaryNode.length > 0) {
    // Set tertiary node
    API_NODES.push({
      address: Meteor.settings.api.tertiaryNode,
      state: false,
      height: 0,
    })
  }
} catch (e) {
  // no configuration file used
}

// Store qrl api connections
const qrlClient = []

// Load the qrl.proto gRPC client into qrlClient from a remote node.
const loadGrpcClient = (endpoint, callback) => {
  // Load qrlbase.proto and fetch current qrl.proto from node
  const baseGrpcObject = grpc.load(Assets.absoluteFilePath('qrlbase.proto'))
  const client = new baseGrpcObject.qrl.Base(endpoint, grpc.credentials.createInsecure())

  client.getNodeInfo({}, (err, res) => {
    if (err) {
      console.log(`Error fetching qrl.proto from ${endpoint}`)
      callback(err, null)
    } else {
      // Write a new temp file for this grpc connection
      const qrlProtoFilePath = tmp.fileSync({ mode: '0644', prefix: 'qrl-', postfix: '.proto' }).name
      fs.writeFile(qrlProtoFilePath, res.grpcProto, (fsErr) => {
        if (fsErr) {
          console.log(fsErr)
          throw fsErr
        }
        const grpcObject = grpc.load(qrlProtoFilePath)
        // Create the gRPC Connection
        qrlClient[endpoint] = new grpcObject.qrl.PublicAPI(endpoint, grpc.credentials.createInsecure())
        console.log(`qrlClient loaded for ${endpoint} from ${qrlProtoFilePath}`)
        callback(null, true)
      })
    }
  })
}

const errorCallback = (error, message, alert) => {
  const d = new Date()
  const getTime = d.toUTCString()
  console.log(`${alert} [Timestamp: ${getTime}] ${error}`)
  const meteorError = new Meteor.Error(500, `[${getTime}] ${message} (${error})`)
  return meteorError
}

// Establish a connection with a remote node.
// If there is no active server side connection for the requested node,
// this function will call loadGrpcClient to establish one.
const connectToNode = (endpoint, callback) => {
  // First check if there is an existing object to store the gRPC connection
  if (qrlClient.hasOwnProperty(endpoint) === true) { // eslint-disable-line
    console.log('Existing connection found for ', endpoint, ' - attempting getNodeState')
    // There is already a gRPC object for this server stored.
    // Attempt to connect to it.
    try {
      qrlClient[endpoint].getNodeState({}, (err, response) => {
        if (err) {
          console.log('Error fetching node state for ', endpoint)
          // If it errors, we're going to remove the object and attempt to connect again.
          delete qrlClient[endpoint]
          console.log('Attempting re-connection to ', endpoint)
          loadGrpcClient(endpoint, (loadErr, loadResponse) => {
            if (loadErr) {
              console.log(`Failed to re-connect to node ${endpoint}`)
              const myError = errorCallback(err, 'Cannot connect to remote node', '**ERROR/connection** ')
              callback(myError, null)
            } else {
              console.log(`Connected to ${endpoint}`)
              callback(null, loadResponse)
            }
          })
        } else {
          console.log(`Node state for ${endpoint} ok`)
          callback(null, response)
        }
      })
    } catch (err) {
      console.log('node state error exception')
      const myError = errorCallback(err, 'Cannot access API/getNodeState', '**ERROR/getNodeState**')
      callback(myError, null)
    }
  } else {
    console.log(`Establishing new connection to ${endpoint}`)
    // We've not connected to this node before, let's establish a connection to it.
    loadGrpcClient(endpoint, (err) => {
      if (err) {
        console.log(`Failed to connect to node ${endpoint}`)
        const myError = errorCallback(err, 'Cannot connect to remote node', '**ERROR/connection** ')
        callback(myError, null)
      } else {
        console.log(`Connected to ${endpoint}`)
        qrlClient[endpoint].getNodeState({}, (errState, response) => {
          if (errState) {
            console.log(`Failed to query node state ${endpoint}`)
            const myError = errorCallback(err, 'Cannot connect to remote node', '**ERROR/connection** ')
            callback(myError, null)
          } else {
            callback(null, response)
          }
        })
      }
    })
  }
}

// Connect to all nodes
const connectNodes = () => {
  API_NODES.forEach((node, index) => {
    const endpoint = node.address
    console.log(`Attempting to create gRPC connection to node: ${endpoint} ...`)
    connectToNode(endpoint, (err, res) => {
      if (err) {
        console.log(`Failed to connect to node ${endpoint}`)
        API_NODES[index].state = false
        API_NODES[index].height = 0
      } else {
        console.log(`Connected to ${endpoint}`)
        API_NODES[index].state = true
        API_NODES[index].height = parseInt(res.info.block_height, 10)
      }
    })
  })
}

const updateAutoIncrement = () => {
  // update autoincrement
  blockData.update({ _id: 'autoincrement' }, { $inc: { value: 1 } })
  // check cache not full
  if (blockData.findOne({ _id: 'autoincrement' }).value > 2500) {
    // empty cache and start again
    blockData.remove({})
    blockData.insert({ _id: 'autoincrement', value: 1 })
  }
}

// Server Startup
if (Meteor.isServer) {
  Meteor.startup(() => {
    console.log(`QRL Explorer Starting - Version: ${EXPLORER_VERSION}`)
    // Attempt to create connections with all nodes
    connectNodes()
    // remove cached data whilst cache featureset being iterated
    // (may want this to persist on restart in time)
    blockData.remove({})
    try {
      blockData.insert({ _id: 'autoincrement', value: 0 })
    } catch (err) {
      console.log('Autoincrement active on blockData')
    }
  })
}

// Maintain node connection status
Meteor.setInterval(() => {
  console.log('Refreshing node connection status')

  // Maintain state of connections to all nodes
  connectNodes()
}, 20000)

// Wrapper to provide highly available API results in the event
// the primary or secondary nodes go offline
const qrlApi = (api, request, callback) => {
  const activeNodes = []

  // Determine current active nodes
  API_NODES.forEach((node) => {
    if (node.state === true) {
      activeNodes.push(node)
    }
  })

  // Determine node with highest block height and set as bestNode
  const bestNode = {}
  bestNode.address = ''
  bestNode.height = 0
  activeNodes.forEach((node) => {
    if (node.height > bestNode.height) {
      bestNode.address = node.address
      bestNode.height = node.height
    }
  })

  // If all three nodes have gone offline, fail
  if (activeNodes.length === 0) {
    const myError = errorCallback('The block explorer server cannot connect to any API node', 'Cannot connect to API', '**ERROR/noActiveNodes/b**')
    callback(myError, null)
  } else {
    // Make the API call
    qrlClient[bestNode.address][api](request, (error, response) => {
      callback(error, response)
    })
  }
}

const helpersaddressTransactions = (response) => {
  const output = []
  console.log(response)
  _.each(response.transactions_detail, (tx) => {
    const txEdited = tx
    console.log('tx.transfer', tx.transfer)
    if (tx.tx.transfer) {
      const hexlified = []
      _.each(tx.tx.transfer.addrs_to, (txOutput) => {
        console.log('formatting: ', txOutput)
        hexlified.push(`Q${Buffer.from(txOutput).toString('hex')}`)
      })
      txEdited.tx.transfer.addrs_to = hexlified
    }
    if (tx.tx.coinbase) {
      if (tx.tx.coinbase.addr_to) {
        txEdited.tx.coinbase.addr_to = `Q${Buffer.from(txEdited.tx.coinbase.addr_to).toString('hex')}`
      }
    }
    if (tx.tx.transaction_hash) {
      txEdited.tx.transaction_hash = Buffer.from(txEdited.tx.transaction_hash).toString('hex')
    }
    if (tx.tx.master_addr) {
      txEdited.tx.master_addr = Buffer.from(txEdited.tx.master_addr).toString('hex')
    }
    if (tx.tx.public_key) {
      txEdited.tx.public_key = Buffer.from(txEdited.tx.public_key).toString('hex')
    }
    if (tx.tx.signature) {
      txEdited.tx.signature = Buffer.from(txEdited.tx.signature).toString('hex')
    }
    if (tx.block_header_hash) {
      txEdited.block_header_hash = Buffer.from(txEdited.block_header_hash).toString('hex')
    }
    txEdited.addr_from = `Q${Buffer.from(txEdited.addr_from).toString('hex')}`
    output.push(txEdited)
  })
  return response
}

const getAddressState = (request, callback) => {
  try {
    qrlApi('GetAddressState', request, (error, response) => {
      if (error) {
        const myError = errorCallback(error, 'Cannot access API/GetAddressState', '**ERROR/getAddressState** ')
        callback(myError, null)
      } else {
        // Parse OTS Bitfield, and grab the lowest unused key
        const newOtsBitfield = {}
        let lowestUnusedOtsKey = -1
        let otsBitfieldLength = 0
        let thisOtsBitfield = []
        // console.log('response.state.ots_bitfield=', response.state.ots_bitfield)
        if (response.state.ots_bitfield !== undefined) { thisOtsBitfield = response.state.ots_bitfield }
        thisOtsBitfield.forEach((item, index) => {
          const thisDecimal = new Uint8Array(item)[0]
          const thisBinary = decimalToBinary(thisDecimal).reverse()
          const startIndex = index * 8

          for (let i = 0; i < 8; i += 1) {
            const thisOtsIndex = startIndex + i

            // Add to parsed array
            newOtsBitfield[thisOtsIndex] = thisBinary[i]

            // Check if this is lowest unused key
            if ((thisBinary[i] === 0) && ((thisOtsIndex < lowestUnusedOtsKey) || (lowestUnusedOtsKey === -1))) {
              lowestUnusedOtsKey = thisOtsIndex
            }

            // Increment otsBitfieldLength
            otsBitfieldLength += 1
          }
        })

        // If all keys in bitfield are used, lowest key will be what is shown in ots_counter + 1
        if (lowestUnusedOtsKey === -1) {
          if (response.state.ots_counter === '0') {
            lowestUnusedOtsKey = otsBitfieldLength
          } else {
            lowestUnusedOtsKey = parseInt(response.state.ots_counter, 10) + 1
          }
        }

        // Calculate number of keys that are consumed
        let totalKeysConsumed = 0
        // First add all tracked keys from bitfield
        for (let i = 0; i < otsBitfieldLength; i += 1) {
          if (newOtsBitfield[i] === 1) {
            totalKeysConsumed += 1
          }
        }

        // Then add any extra from `otsBitfieldLength` to `ots_counter`
        if (response.state.ots_counter !== '0') {
          totalKeysConsumed += parseInt(response.state.ots_counter, 10) - (otsBitfieldLength - 1)
        }

        // Add in OTS fields to response
        response.ots = {}
        response.ots.keys = newOtsBitfield
        response.ots.nextKey = lowestUnusedOtsKey
        response.ots.keysConsumed = totalKeysConsumed

        if (response.state.address) {
          response.state.address = `Q${Buffer.from(response.state.address).toString('hex')}`
        }

        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(error, 'Cannot access API/GetAddressState', '**ERROR/GetAddressState**')
    callback(myError, null)
  }
}

export const getLatestData = (request, callback) => {
  try {
    qrlApi('GetLatestData', request, (error, response) => {
      if (error) {
        const myError = errorCallback(error, 'Cannot access API/GetLatestData', '**ERROR/GetLatestData** ')
        callback(myError, null)
      } else {
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(error, 'Cannot access API/GetLatestData', '**ERROR/GetLatestData**')
    callback(myError, null)
  }
}

export const getStats = (request, callback) => {
  try {
    qrlApi('GetStats', request, (error, response) => {
      if (error) {
        const myError = errorCallback(error, 'Cannot access API/GetStats/a', '**ERROR/GetStats/a** ')
        callback(myError, null)
      } else {
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(error, 'Cannot access API/GetStats/b', '**ERROR/GetStats/b**')
    callback(myError, null)
  }
}

export const getPeersStat = (request, callback) => {
  try {
    qrlApi('GetPeersStat', request, (error, response) => {
      if (error) {
        const myError = errorCallback(error, 'Cannot access API/GetPeersStat/a', '**ERROR/GetPeersStat/a** ')
        callback(myError, null)
      } else {
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(error, 'Cannot access API/GetPeersStat/b', '**ERROR/GetPeersStat/b**')
    callback(myError, null)
  }
}

export const getObject = (request, callback) => {
  try {
    qrlApi('GetObject', request, (error, response) => {
      if (error) {
        const myError = errorCallback(error, 'Cannot access API/GetObject', '**ERROR/GetObject**')
        callback(myError, null)
      } else {
        // console.log(response)
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(error, 'Cannot access API/GetObject', '**ERROR/GetObject**')
    callback(myError, null)
  }
}

export const getTransactionsByAddress = (request, callback) => {
  try {
    qrlApi('GetTransactionsByAddress', request, (error, response) => {
      if (error) {
        const myError = errorCallback(error, 'Cannot access API/GetTransactionsByAddress', '**ERROR/GetTransactionsByAddress**')
        callback(myError, null)
      } else {
        // console.log(response)
        callback(null, response)
      }
    })
  } catch (error) {
    const myError = errorCallback(error, 'Cannot access API/GetTransactionsByAddress', '**ERROR/GetTransactionsByAddress**')
    callback(myError, null)
  }
}

export const apiCall = (apiUrl, callback) => {
  try {
    const response = HTTP.get(apiUrl).data
    // Successful call
    callback(null, response)
  } catch (error) {
    const myError = new Meteor.Error(500, 'Cannot access the API')
    callback(myError, null)
  }
}

export const makeTxHumanReadable = (item) => {
  let output
  if (item.transaction.tx.transactionType === 'transfer_token') {
    try {
      // Request Token Decimals / Symbol
      const symbolRequest = { query: item.transaction.tx.transfer_token.token_txhash }
      const thisSymbolResponse = Meteor.wrapAsync(getObject)(symbolRequest)
      output = helpers.parseTokenAndTransferTokenTx(thisSymbolResponse, item)
    } catch (e) {
      console.log('ERROR in makeTxHumanReadable', e)
    }
  } else {
    output = helpers.txhash(item)
  }
  return output
}

export const makeTxListHumanReadable = (txList, confirmed) => {
  const outputList = []

  txList.forEach((item) => {
    // Add a transaction object to the returned transaction so we can use txhash helper
    const output = makeTxHumanReadable({ transaction: item })
    // Now put it back
    if (confirmed) {
      output.transaction.tx.confirmed = 'true'
    } else {
      output.transaction.tx.confirmed = 'false'
    }
    outputList.push(output.transaction)
  })

  return outputList
}

Meteor.methods({
  QRLvalue() {
    console.log('QRLvalue method called')
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
    console.log('status method called')
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    // asynchronous call to API
    const response = Meteor.wrapAsync(getStats)({})
    return response
  },

  lastblocks() {
    console.log('lastblocks method called')
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    // asynchronous call to API
    const response = Meteor.wrapAsync(getLatestData)({ filter: 'BLOCKHEADERS', offset: 0, quantity: 5 })
    return response
  },

  lastunconfirmedtx() {
    console.log('lastunconfirmedtx method called')
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    // asynchronous call to API
    const response = Meteor.wrapAsync(getLatestData)({ filter: 'TRANSACTIONS_UNCONFIRMED', offset: 0, quantity: 5 })
    const unconfirmedReadable = makeTxListHumanReadable(response.transactions_unconfirmed, false)
    response.transactions_unconfirmed = unconfirmedReadable
    return response
  },

  txhash(txId) {
    check(txId, String)
    console.log(`txhash method called for: ${txId}`)
    // avoid blocking other method calls from same client - *may need to remove for production*
    this.unblock()
    if (!((Match.test(txId, String)) && (txId.length === 64))) {
      const errorCode = 400
      const errorMessage = 'Badly formed transaction ID'
      throw new Meteor.Error(errorCode, errorMessage)
    } else {
      // first check this is not cached
      const queryResults = blockData.findOne({ txId })
      if (queryResults !== undefined) {
        // cached transaction located
        // check if it's an unconfirmed Tx
        if (queryResults.formattedData.transaction.header !== null) {
          // not unconfirmed, return cached data
          console.log(`** INFO ** Returning cached data for txhash ${txId}`)
          return queryResults.formattedData
        }
      }
      // not cached or was unconfirmed so...
      // asynchronous call to API
      const req = { query: Buffer.from(txId, 'hex') }
      const response = Meteor.wrapAsync(getObject)(req)
      const formattedData = makeTxHumanReadable(response)
      if (formattedData.transaction.header !== null) {
        // not unconfirmed so insert into cache
        updateAutoIncrement()
        blockData.insert({ txId, formattedData })
      }
      // return to client
      return formattedData
    }
  },

  block(blockId) {
    check(blockId, Number)
    console.log(`block Method called for: ${blockId}`)
    if (!(Match.test(blockId, Number)) || (Number.isNaN(blockId))) {
      const errorCode = 400
      const errorMessage = 'Invalid block number'
      console.log('Throwing invalid block number error')
      throw new Meteor.Error(errorCode, errorMessage)
    } else {
      // avoid blocking other method calls from same client - *may need to remove for production*
      this.unblock()
      // first check this is not cached
      const queryResults = blockData.findOne({ blockId })
      if (queryResults !== undefined) {
        // cached transaction located
        console.log(`** INFO ** Returning cached data for block ${blockId}`)
        return queryResults.formattedData
      }

      // asynchronous call to API
      const req = {
        query: Buffer.from(blockId.toString()),
      }
      const response = Meteor.wrapAsync(getObject)(req)

      // Refactor for block_extended and extended_transactions
      response.block = response.block_extended
      response.block.transactions = response.block_extended.extended_transactions

      if (response.block.header) {
        response.block.header.hash_header = Buffer.from(response.block.header.hash_header).toString('hex')
        response.block.header.hash_header_prev = Buffer.from(response.block.header.hash_header_prev).toString('hex')
        response.block.header.merkle_root = Buffer.from(response.block.header.merkle_root).toString('hex')

        // transactions
        const transactions = []
        response.block.transactions.forEach((value) => {
          const adjusted = value.tx
          adjusted.addr_from = value.addr_from
          adjusted.public_key = Buffer.from(adjusted.public_key).toString('hex')
          adjusted.transaction_hash = Buffer.from(adjusted.transaction_hash).toString('hex')
          adjusted.signature = Buffer.from(adjusted.signature).toString('hex')
          if (adjusted.transactionType === 'coinbase') {
            // adjusted.coinbase.addr_to = adjusted.coinbase.addr_to <--- FIXME: why was this here?
            // FIXME: need to refactor to explorer.[GUI] format (below allow amount to be displayed)
            adjusted.transfer = adjusted.coinbase
          }

          if (adjusted.transactionType === 'transfer') {
            // Calculate total transferred, and generate a clean structure to display outputs from
            let thisTotalTransferred = 0
            let totalOutputs = 0
            _.each(adjusted.transfer.addrs_to, (thisAddress, index) => {
              totalOutputs += 1
              thisTotalTransferred += parseInt(adjusted.transfer.amounts[index], 10)
              // adjusted.transfer.addrs_to[index] = adjusted.transfer.addrs_to[index] <-- FIXME: why was this here?
            })
            adjusted.transfer.totalTransferred = thisTotalTransferred / SHOR_PER_QUANTA
            adjusted.transfer.totalOutputs = totalOutputs
          }
          if (adjusted.transactionType === 'transfer_token') {
            // Request Token Decimals / Symbol
            const symbolRequest = {
              query: Buffer.from(adjusted.transfer_token.token_txhash, 'hex'),
            }
            const thisSymbolResponse = Meteor.wrapAsync(getObject)(symbolRequest)
            // eslint-disable-next-line
            const thisSymbol = Buffer.from(thisSymbolResponse.transaction.tx.token.symbol).toString()
            const thisDecimals = thisSymbolResponse.transaction.tx.token.decimals
            // Calculate total transferred, and generate a clean structure to display outputs from
            let thisTotalTransferred = 0
            let totalOutputs = 0
            _.each(adjusted.transfer_token.addrs_to, (thisAddress, index) => {
              totalOutputs += 1
              thisTotalTransferred += parseInt(adjusted.transfer_token.amounts[index], 10)
              // adjusted.transfer_token.addrs_to[index] = adjusted.transfer_token.addrs_to[index] <-- FIXME: why was this here?
            })
            // eslint-disable-next-line
            adjusted.transfer_token.totalTransferred = thisTotalTransferred / Math.pow(10, thisDecimals)
            adjusted.transfer_token.totalOutputs = totalOutputs
            adjusted.transfer_token.tokenSymbol = thisSymbol
          }

          transactions.push(adjusted)
        })

        response.block.transactions = transactions
      }
      // insert into cache
      updateAutoIncrement()
      blockData.insert({ blockId, formattedData: response })
      return response
    }
  },

  addressTransactions(request) {
    check(request, Object)
    console.log(`addressTransactions method called for ${request.tx.length} transactions`)
    const targets = request.tx
    const result = []
    targets.forEach((arr) => {
      const req = { query: Buffer.from(arr.txhash, 'hex') }
      try {
        const thisTxnHashResponse = Meteor.wrapAsync(getObject)(req)

        const output = helpers.txhash(thisTxnHashResponse)

        let thisTxn = {}

        if (output.transaction.tx.transactionType === 'transfer') {
          thisTxn = {
            type: output.transaction.tx.transactionType,
            txhash: arr.txhash,
            totalTransferred: output.transaction.explorer.totalTransferred,
            outputs: output.transaction.explorer.outputs,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            ots_key: parseInt(output.transaction.tx.signature.substring(0, 8), 16),
            fee: output.transaction.tx.fee,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }
          result.push(thisTxn)
        } else if (output.transaction.tx.transactionType === 'token') {
          thisTxn = {
            type: output.transaction.tx.transactionType,
            txhash: arr.txhash,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            symbol: output.transaction.tx.token.symbol,
            name: output.transaction.tx.token.name,
            decimals: output.transaction.tx.token.decimals,
            ots_key: parseInt(output.transaction.tx.signature.substring(0, 8), 16),
            fee: output.transaction.tx.fee,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }

          result.push(thisTxn)
        } else if (thisTxnHashResponse.transaction.tx.transactionType === 'transfer_token') {
          // Request Token Symbol
          const symbolRequest = {
            query: Buffer.from(Buffer.from(thisTxnHashResponse.transaction.tx.transfer_token.token_txhash).toString('hex'), 'hex'),
          }
          const thisSymbolResponse = Meteor.wrapAsync(getObject)(symbolRequest)
          const helpersResponse = helpers.parseTokenAndTransferTokenTx(thisSymbolResponse, thisTxnHashResponse)
          thisTxn = {
            type: helpersResponse.transaction.tx.transactionType,
            txhash: arr.txhash,
            symbol: helpersResponse.transaction.explorer.symbol,
            // eslint-disable-next-line
            totalTransferred: helpersResponse.transaction.explorer.totalTransferred,
            outputs: helpersResponse.transaction.explorer.outputs,
            from_hex: helpersResponse.transaction.explorer.from_hex,
            from_b32: helpersResponse.transaction.explorer.from_b32,
            ots_key: parseInt(helpersResponse.transaction.tx.signature.substring(0, 8), 16),
            fee: helpersResponse.transaction.tx.fee / SHOR_PER_QUANTA,
            block: helpersResponse.transaction.header.block_number,
            timestamp: helpersResponse.transaction.header.timestamp_seconds,
          }

          result.push(thisTxn)
        } else if (output.transaction.tx.transactionType === 'coinbase') {
          thisTxn = {
            type: output.transaction.tx.transactionType,
            txhash: arr.txhash,
            amount: output.transaction.tx.coinbase.amount / SHOR_PER_QUANTA,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            to: output.transaction.tx.coinbase.addr_to,
            ots_key: '',
            fee: output.transaction.tx.fee / SHOR_PER_QUANTA,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }
          result.push(thisTxn)
        } else if (output.transaction.tx.transactionType === 'slave') {
          thisTxn = {
            type: output.transaction.tx.transactionType,
            txhash: arr.txhash,
            amount: 0,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            to: '',
            ots_key: parseInt(output.transaction.tx.signature.substring(0, 8), 16),
            fee: output.transaction.tx.fe,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }
          result.push(thisTxn)
        } else if (output.transaction.tx.transactionType === 'latticePK') {
          thisTxn = {
            type: output.transaction.tx.transactionType,
            txhash: arr.txhash,
            amount: 0,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            to: '',
            ots_key: parseInt(output.transaction.tx.signature.substring(0, 8), 16),
            fee: output.transaction.tx.fee,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }
          result.push(thisTxn)
        } else if (output.transaction.explorer.type === 'MESSAGE') {
          thisTxn = {
            type: output.transaction.explorer.type,
            txhash: arr.txhash,
            amount: 0,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            to: '',
            ots_key: parseInt(output.transaction.tx.signature.substring(0, 8), 16),
            fee: output.transaction.tx.fee,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }
          result.push(thisTxn)
        } else if (output.transaction.explorer.type === 'KEYBASE') {
          thisTxn = {
            type: output.transaction.explorer.type,
            txhash: arr.txhash,
            amount: 0,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            to: '',
            ots_key: parseInt(output.transaction.tx.signature.substring(0, 8), 16),
            fee: output.transaction.tx.fee,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }
          result.push(thisTxn)
        } else if (output.transaction.explorer.type === 'DOCUMENT_NOTARISATION') {
          thisTxn = {
            type: output.transaction.explorer.type,
            txhash: arr.txhash,
            amount: 0,
            from_hex: output.transaction.explorer.from_hex,
            from_b32: output.transaction.explorer.from_b32,
            to: '',
            ots_key: parseInt(output.transaction.tx.signature.substring(0, 8), 16),
            fee: output.transaction.tx.fee,
            block: output.transaction.header.block_number,
            timestamp: output.transaction.header.timestamp_seconds,
          }
          result.push(thisTxn)
        }
      } catch (err) {
        console.log(`Error fetching transaction hash in addressTransactions '${arr.txhash}' - ${err}`)
      }
    })
    return result
  },

  getStats(request = {}) {
    check(request, Object)
    this.unblock()
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

  getTransactionsByAddress(request) {
    check(request, Object)
    this.unblock()
    const response = Meteor.wrapAsync(getTransactionsByAddress)(request)
    console.table(response)
    return helpersaddressTransactions(response)
  },

  connectionStatus() {
    console.log('connectionStatus method called')
    this.unblock()
    const activeNodes = []
    API_NODES.forEach((node) => {
      if (node.state === true) {
        activeNodes.push(node.address)
      }
    })
    if (activeNodes.length === 0) {
      const res = { colour: 'red' }
      return res
    }
    const res = { colour: 'green' }
    return res
  },
})

JsonRoutes.add('get', '/api/a/:id', (req, res) => {
  const aId = req.params.id
  check(aId, String)
  let response = {}
  if (aId.length === 79 && aId.charAt(0).toLowerCase() === 'q') {
    const request = {
      address: anyAddressToRaw(aId),
    }
    try {
      response = Meteor.wrapAsync(getAddressState)(request)
    } catch (e) {
      response = e
    }
  } else {
    response = { found: false, message: 'Invalid QRL address', code: 3000 }
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})

JsonRoutes.add('get', '/api/tx/:id', (req, res) => {
  const txId = req.params.id
  check(txId, String)
  let response = {}
  if (txId.length === 64) {
    // first check this is not cached
    const queryResults = blockData.findOne({ txId })
    if (queryResults !== undefined) {
      // cached transaction located
      response = queryResults.formattedData
    } else {
      // cache empty, query grpc
      const request = { query: Buffer.from(txId, 'hex') }
      try {
        response = Meteor.wrapAsync(getObject)(request)
      } catch (e) {
        response = e
      }
    }
  } else {
    response = { found: false, message: 'Invalid Txhash', code: 3001 }
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})

JsonRoutes.add('get', '/api/block/:id', (req, res) => {
  const txId = req.params.id
  check(txId, String)
  let response = {}
  if (parseInt(txId, 10).toString() === txId) {
    // first check this is not cached
    const queryResults = blockData.findOne({ txId })
    if (queryResults !== undefined) {
      // cached transaction located
      response = queryResults.formattedData
    } else {
      // cache empty, query grpc
      const request = { query: Buffer.from(txId) }
      try {
        response = Meteor.wrapAsync(getObject)(request)
      } catch (e) {
        response = e
      }
    }
  } else {
    response = { found: false, message: 'Invalid Block', code: 3002 }
  }
  JsonRoutes.sendResult(res, {
    data: response,
  })
})
